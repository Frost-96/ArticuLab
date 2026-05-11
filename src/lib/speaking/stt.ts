// src/lib/speaking/stt.ts
// Speech-to-Text 模块
// TODO: 后续实现具体的 STT 逻辑（如 OpenAI Whisper API）

/**
 * 将音频 URL 转换为文本
 * @param audioUrl - 音频文件的 URL
 * @param language - 音频语言，默认 "en"
 * @returns 识别出的文本内容
 */
export async function speechToText(
    audioUrl: string,
    language: string = "en"
): Promise<string> {
    // TODO: 实现 STT 逻辑，例如调用 OpenAI Whisper API
    void audioUrl;
    void language;
    return "Hello, this is a mock transcription of the audio.";
}
