// src/lib/speaking/sttClient.ts
// 腾讯云 STT 客户端工厂（模块级单例，globalThis 防止 HMR 重复创建）

import * as tencentcloud from "tencentcloud-sdk-nodejs-asr";

/** 腾讯云 ASR 客户端类型 */
type AsrClient = InstanceType<typeof tencentcloud.asr.v20190614.Client>;

const globalForStt = globalThis as unknown as {
  sttClient: AsrClient | null | undefined;
};

/**
 * 获取腾讯云语音识别客户端（单例）
 *
 * 环境变量：
 * - TENCENT_STT_SECRET_ID：腾讯云 SecretId
 * - TENCENT_STT_SECRET_KEY：腾讯云 SecretKey
 * - TENCENT_STT_REGION：腾讯云区域，默认 ap-guangzhou
 *
 * @returns 腾讯云 ASR 客户端实例，未配置时返回 null
 */
export function getSttClient(): AsrClient | null {
  if (globalForStt.sttClient !== undefined) {
    return globalForStt.sttClient;
  }

  const secretId = process.env.TENCENT_STT_SECRET_ID?.trim();
  const secretKey = process.env.TENCENT_STT_SECRET_KEY?.trim();
  if (!secretId || !secretKey) {
    console.warn("STT credentials missing");
    globalForStt.sttClient = null;
    return null;
  }

  const region = process.env.TENCENT_STT_REGION?.trim() || "ap-guangzhou";

  try {
    globalForStt.sttClient = new tencentcloud.asr.v20190614.Client({
      credential: { secretId, secretKey },
      region,
      profile: {
        httpProfile: { endpoint: "asr.tencentcloudapi.com" },
      },
    });
    return globalForStt.sttClient;
  } catch (error) {
    console.error("STT client init error:", error);
    globalForStt.sttClient = null;
    return null;
  }
}
/**
 * 获取腾讯云 STT 区域
 *
 * @returns 区域字符串
 */
export function getSttRegion(): string {
  return process.env.TENCENT_STT_REGION?.trim() || "ap-guangzhou";
}
