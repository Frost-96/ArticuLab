// SSE 事件格式化和响应构建工具

/** 共享 TextEncoder 实例，避免重复创建 */
const encoder = new TextEncoder();

/**
 * 格式化单条 SSE 事件为标准格式字符串
 *
 * 安全处理 data 中的换行符：将 JSON 字符串按真实换行拆分为多条 data: 行，
 * 符合 SSE 规范，避免单行 data: 内含换行符导致解析异常。
 *
 * @param event - 事件名称
 * @param data - 事件数据（会被 JSON 序列化）
 * @returns SSE 格式字符串
 */
export function formatSSE(event: string, data: unknown): string {
  const json = JSON.stringify(data);
  // 按换行拆分为多条 data: 行（SSE 规范要求）
  const dataLines = json
    .split("\n")
    .map((line) => `data: ${line}`)
    .join("\n");
  return `event: ${event}\n${dataLines}\n\n`;
}

/**
 * 直接返回编码后的 Uint8Array，方便 controller.enqueue()
 *
 * @param event - 事件名称
 * @param data - 事件数据
 * @returns 编码后的 Uint8Array
 */
export function encodeSSE(event: string, data: unknown): Uint8Array {
  return encoder.encode(formatSSE(event, data));
}

/**
 * 生成心跳注释行（SSE 注释行以冒号开头，客户端不会触发事件）
 *
 * 用于保持连接活跃，防止反向代理（Nginx/Cloudflare）因空闲超时断开连接。
 * TTS 合成期间 LLM token 已停止但音频尚未返回时，需要心跳保活。
 *
 * @returns 编码后的心跳 Uint8Array
 */
export function heartbeatSSE(): Uint8Array {
  return encoder.encode(": heartbeat\n\n");
}

/**
 * 创建 SSE 流式响应（Next.js Response）
 *
 * @param stream - ReadableStream<Uint8Array> 实例
 * @returns 带正确 SSE headers 的 Response
 */
export function createSSEResponse(
  stream: ReadableStream<Uint8Array>,
): Response {
  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
