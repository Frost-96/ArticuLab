// src/lib/speaking/pronunciation.ts
// Azure Pronunciation Assessment 模块

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import * as sdk from "microsoft-cognitiveservices-speech-sdk";
import { createSpeechConfig } from "./pronunciationClient";
import { speechToText } from "./stt";
import { convertToPcm } from "./audioConvert";
import {
  pronunciationResultSchema,
  type PronunciationResult,
} from "@/schema/speaking.schema";
import { getFirstError } from "@/lib/error";

/** 当前模块所在目录 */
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** 发音评估调用结果 */
export type AssessmentResult =
  | { ok: true; data: PronunciationResult }
  | { ok: false; error: string };

/**
 * 将 Azure SDK 返回的原始数据转为 Zod schema 期望的格式并校验
 * @throws Zod 校验失败时抛出
 */
function buildPronunciationResult(
  result: sdk.PronunciationAssessmentResult,
): PronunciationResult {
  // Azure SDK 返回的是类实例，getter 属性无法被 Zod 直接解析，需手动提取
  const rawWords = (result.detailResult?.Words ?? []) as unknown as Array<{
    Word?: string;
    PronunciationAssessment?: { AccuracyScore?: number; ErrorType?: string };
    Phonemes?: Array<{
      Phoneme?: string;
      PronunciationAssessment?: { AccuracyScore?: number };
    }>;
  }>;

  const words = rawWords.map((w) => ({
    word: w.Word ?? "",
    accuracyScore: w.PronunciationAssessment?.AccuracyScore ?? 0,
    errorType: w.PronunciationAssessment?.ErrorType ?? "None",
    phonemes: (w.Phonemes ?? []).map((p) => ({
      phoneme: p.Phoneme ?? "",
      accuracyScore: p.PronunciationAssessment?.AccuracyScore ?? 0,
    })),
  }));

  const parsed = pronunciationResultSchema.safeParse({
    pronunciationScore: result.pronunciationScore ?? 0,
    accuracyScore: result.accuracyScore ?? 0,
    fluencyScore: result.fluencyScore ?? 0,
    completenessScore: result.completenessScore ?? 0,
    prosodyScore: result.prosodyScore ?? 0,
    words,
  });

  if (!parsed.success) {
    throw new Error(
      `Pronunciation result validation failed: ${getFirstError(parsed.error)}`,
    );
  }

  return parsed.data;
}

/**
 * 调用 Azure Pronunciation Assessment 评估发音
 *
 * @param audioBuffer - 用户录音 Buffer
 * @param referenceText - 参考文本（用户确认后的转写文本）
 * @param language - 语言代码，默认 "en-US"（由 createSpeechConfig 设置）
 * @returns 结构化发音评估结果
 */
export async function assessPronunciation(
  audioBuffer: Buffer,
  referenceText: string,
  language: string = "en-US",
): Promise<AssessmentResult> {
  const speechConfig = createSpeechConfig(language);
  if (!speechConfig) {
    return { ok: false, error: "Azure Speech not configured" };
  }

  // 将音频转为 16kHz mono PCM（Azure SDK 要求的格式）
  let pcmBuffer: Buffer;
  try {
    pcmBuffer = await convertToPcm(audioBuffer);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return { ok: false, error: `Audio conversion failed: ${msg}` };
  }

  const pronunciationConfig = new sdk.PronunciationAssessmentConfig(
    referenceText,
    sdk.PronunciationAssessmentGradingSystem.HundredMark,
    sdk.PronunciationAssessmentGranularity.Phoneme,
    true, // enableMiscue
  );
  pronunciationConfig.phonemeAlphabet = "IPA";
  pronunciationConfig.enableProsodyAssessment = true;

  // 使用 16kHz/16bit/mono PCM 格式创建 PushStream
  const format = sdk.AudioStreamFormat.getWaveFormatPCM(16000, 16, 1);
  const pushStream = sdk.AudioInputStream.createPushStream(format);
  pushStream.write(Buffer.from(pcmBuffer).buffer);
  pushStream.close();

  const audioConfig = sdk.AudioConfig.fromStreamInput(pushStream);
  const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);
  pronunciationConfig.applyTo(recognizer);

  try {
    const result = await new Promise<sdk.SpeechRecognitionResult>(
      (resolve, reject) => {
        recognizer.recognizeOnceAsync(
          (r) => resolve(r),
          (err) => reject(new Error(`Recognition failed: ${err}`)),
        );
      },
    );

    if (result.reason !== sdk.ResultReason.RecognizedSpeech) {
      const reasonText =
        result.reason === sdk.ResultReason.NoMatch
          ? "No speech could be recognized"
          : result.reason === sdk.ResultReason.Canceled
            ? `Recognition canceled: ${sdk.CancellationDetails.fromResult(result).errorDetails || "unknown"}`
            : `Unexpected recognition reason: ${result.reason}`;
      return { ok: false, error: reasonText };
    }

    const pronunciationResult =
      sdk.PronunciationAssessmentResult.fromResult(result);
    if (!pronunciationResult) {
      return { ok: false, error: "No pronunciation assessment result" };
    }
    console.log("Pronunciation assessment result:", pronunciationResult);

    const data = buildPronunciationResult(pronunciationResult);
    return { ok: true, data };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Azure pronunciation assessment error:", msg);
    return { ok: false, error: `Pronunciation assessment failed: ${msg}` };
  } finally {
    recognizer.close();
  }
}

/**
 * 读取 outputAudio 目录下的 WAV 文件，用 STT 转写文本后进行发音评估
 * 用于本地调试和测试
 *
 * @param filename - WAV 文件名，默认 "output.wav"
 * @returns 发音评估结果
 */
export async function assessLocalAudio(
  filename: string = "output.wav",
): Promise<AssessmentResult> {
  const filePath = path.join(__dirname, "outputAudio", filename);
  if (!fs.existsSync(filePath)) {
    return { ok: false, error: `File not found: ${filePath}` };
  }

  const audioBuffer = fs.readFileSync(filePath);
  console.log(
    `[pronunciation] Loaded ${filename}, size: ${audioBuffer.length} bytes`,
  );

  /* // 用 STT 转写文本
  const sttResult = await speechToText(audioBuffer, "en", "audio/wav");
  if (!sttResult.ok) {
    return { ok: false, error: `STT failed: ${sttResult.error}` };
  }
  console.log(`[pronunciation] STT result: "${sttResult.text}"`);
 */
  const text =
    "Captain, my captain, we're not here to just take measurements with a ruler. We're here to put in a few stitches. The powerful play goes on and you may contribute a powerful verse. What will your verse be?";
  // 用转写文本作为参考进行发音评估
  return assessPronunciation(audioBuffer, text, "en-US");
}
