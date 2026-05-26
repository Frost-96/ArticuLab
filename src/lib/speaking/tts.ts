// src/lib/speaking/tts.ts
// Text-to-Speech 模块（小米 MiMo TTS）

import { getTtsClient, getTtsModel } from "./ttsClient";

/** TTS 调用结果 */
export type TtsResult =
  | { ok: true; audioBuffer: Buffer }
  | { ok: false; error: string };

/**
 * 将文本转换为语音（MiMo TTS）
 *
 * MiMo TTS 使用 OpenAI 兼容的 chat.completions 接口，
 * 通过 audio 参数指定输出格式和音色，
 * 音频数据以 Base64 编码返回在 completion.choices[0].message.audio.data 中。
 *
 * @param text - 要转换的文本内容
 * @param voice - 语音类型，默认 "Mia"
 * @param speed - 语速，默认 1.0（MiMo 暂不支持自定义语速，保留参数）
 * @param format - 音频格式，默认 "wav"（可选: wav, mp3, pcm, pcm16）
 * @returns TTS 结果，成功时包含音频 Buffer
 */
export async function textToSpeech(
  text: string,
  voice: string = "Mia",
  speed: number = 1.0,
  format: "wav" | "mp3" | "pcm16" = "wav",
): Promise<TtsResult> {
  const client = getTtsClient();
  if (!client) {
    return { ok: false, error: "TTS client not configured" };
  }

  try {
    const model = getTtsModel();

    // MiMo TTS 通过 chat.completions 接口调用
    // 需要提供 messages（user + assistant），assistant 的 content 是要合成的文本
    const completion = await client.chat.completions.create({
      model,
      messages: [
        { role: "user", content: text },
        { role: "assistant", content: text },
      ],
      audio: {
        format,
        voice,
      },
    });

    // 从响应中提取 Base64 编码的音频数据
    const audioBase64 = completion.choices[0]?.message?.audio?.data;
    if (!audioBase64) {
      return { ok: false, error: "No audio data in TTS response" };
    }

    const audioBuffer = Buffer.from(audioBase64, "base64");
    void speed; // MiMo 暂不支持自定义语速
    return { ok: true, audioBuffer };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return { ok: false, error: `TTS error: ${msg}` };
  }
}
