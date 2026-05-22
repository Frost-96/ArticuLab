// src/lib/speaking/pronunciationClient.ts
// Azure Speech 配置工厂（缓存基础认证信息，每次调用创建新的 SpeechConfig）

import * as sdk from "microsoft-cognitiveservices-speech-sdk";

/** 基础认证信息（进程生命周期内缓存） */
interface AzureSpeechCredentials {
  speechKey: string;
  speechRegion: string;
}

const globalCredentials = globalThis as unknown as {
  azureSpeechCredentials: AzureSpeechCredentials | null | undefined;
};

/** 默认语音识别语言（美式英语） */
const DEFAULT_SPEECH_LANGUAGE = "en-US";

/**
 * 获取缓存的 Azure Speech 认证信息
 *
 * @returns 认证信息，未配置时返回 null
 */
function getCredentials(): AzureSpeechCredentials | null {
  if (globalCredentials.azureSpeechCredentials !== undefined) {
    return globalCredentials.azureSpeechCredentials;
  }

  const speechKey = process.env.AZURE_SPEECH_KEY?.trim();
  const speechRegion = process.env.AZURE_SPEECH_REGION?.trim();

  if (!speechKey || !speechRegion) {
    console.warn("Azure Speech credentials missing");
    globalCredentials.azureSpeechCredentials = null;
    return null;
  }

  const creds: AzureSpeechCredentials = { speechKey, speechRegion };
  globalCredentials.azureSpeechCredentials = creds;
  return creds;
}

/**
 * 创建 Azure SpeechConfig 实例
 *
 * 每次调用返回全新实例，避免可变状态共享。
 * 默认语言为 en-US（美式英语），输出格式为 Detailed（包含逐词/音素详情）。
 *
 * @param language - 识别语言，默认 "en-US"
 * @returns SpeechConfig 实例，未配置时返回 null
 */
export function createSpeechConfig(
  language: string = DEFAULT_SPEECH_LANGUAGE,
): sdk.SpeechConfig | null {
  const credentials = getCredentials();
  if (!credentials) return null;

  try {
    const config = sdk.SpeechConfig.fromSubscription(
      credentials.speechKey,
      credentials.speechRegion,
    );
    config.speechRecognitionLanguage = language;
    config.outputFormat = sdk.OutputFormat.Detailed;
    return config;
  } catch (error) {
    console.error("Failed to create SpeechConfig:", error);
    return null;
  }
}
