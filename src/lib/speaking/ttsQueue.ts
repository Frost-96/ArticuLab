// TTS 异步队列（实时音频调度器）
//
// 关键设计：
// - while 循环替代递归：避免长对话时调用栈膨胀
// - 背压控制：backlog = queue.length + (running ? 1 : 0)，包含正在处理的任务
// - 超时保护：单个 TTS 请求超过 timeoutMs 则放弃
// - 可中断：abort() 只置标志，循环自然退出

import { textToSpeech } from "./tts";

/** TTS 音频格式 */
export type TtsFormat = "wav" | "mp3" | "pcm16";

/** 任务指标（可选，用于监控） */
export interface TtsTaskMetrics {
  index: number;
  text: string;
  enqueuedAt: number;
  startedAt?: number;
  finishedAt?: number;
  error?: string;
}

/** TTS 音频就绪回调 */
export type OnAudioReady = (
  index: number,
  audioBase64: string,
  format: TtsFormat,
  metrics?: TtsTaskMetrics,
) => void;

/** 入队结果枚举 */
export type EnqueueResult = "ok" | "full" | "aborted";

/** 任务内部结构 */
interface TtsTask {
  index: number;
  text: string;
  metrics?: TtsTaskMetrics;
}

/**
 * TTS 异步队列（实时音频调度器）
 *
 * 按入队顺序依次调用 TTS 合成，完成后通过 onAudio 回调发送音频。
 * 支持背压控制（maxQueueSize）、超时保护和中断（abort）。
 */
export class TtsQueue {
  /** 待处理任务队列 */
  private queue: TtsTask[] = [];
  /** 是否正在处理 */
  private running = false;
  /** 下一个任务的索引 */
  private nextIndex = 0;
  /** 音频就绪回调 */
  private onAudio: OnAudioReady;
  /** 音频格式 */
  private format: TtsFormat;
  /** 最大 backlog 长度（背压阈值） */
  private maxQueueSize: number;
  /** 单个 TTS 超时时间（毫秒） */
  private timeoutMs: number;
  /** 是否启用指标收集 */
  private collectMetrics: boolean;
  /** waitForAll 的 pending resolve 数组（支持多个等待者） */
  private flushResolvers: Array<() => void> = [];
  /** waitForSpace 的 pending resolve 数组 */
  private spaceResolvers: Array<() => void> = [];
  /** 是否已中断 */
  private aborted = false;

  constructor(
    onAudio: OnAudioReady,
    format: TtsFormat = "mp3",
    maxQueueSize: number = 10,
    timeoutMs: number = 15000,
    collectMetrics: boolean = false,
  ) {
    this.onAudio = onAudio;
    this.format = format;
    this.maxQueueSize = maxQueueSize;
    this.timeoutMs = timeoutMs;
    this.collectMetrics = collectMetrics;
  }

  /**
   * 添加句子到队列
   *
   * @param text - 要合成的句子文本
   * @returns "ok" 入队成功；"full" 队列已满（上游需等待空间）；"aborted" 队列已中断
   */
  enqueue(text: string): EnqueueResult {
    if (this.aborted) return "aborted";

    const backlog = this.queue.length + (this.running ? 1 : 0);
    if (backlog >= this.maxQueueSize) {
      return "full";
    }

    const task: TtsTask = {
      index: this.nextIndex++,
      text,
      metrics: this.collectMetrics
        ? { index: this.nextIndex - 1, text, enqueuedAt: Date.now() }
        : undefined,
    };
    this.queue.push(task);

    if (!this.running) {
      this.processLoop();
    }

    return "ok";
  }

  /**
   * 检查队列是否已满（背压判断，不实际入队）
   *
   * @returns true 如果 backlog ≥ maxQueueSize
   */
  isFull(): boolean {
    const backlog = this.queue.length + (this.running ? 1 : 0);
    return backlog >= this.maxQueueSize;
  }

  /**
   * 等待队列完全清空（所有任务处理完毕）
   */
  async waitForAll(): Promise<void> {
    const backlog = this.queue.length + (this.running ? 1 : 0);
    if (backlog === 0) return;
    return new Promise<void>((resolve) => {
      this.flushResolvers.push(resolve);
    });
  }

  /**
   * 等待队列中有空闲位置（背压恢复）
   *
   * 当 enqueue 返回 "full" 时调用，队列消化后 resolve
   */
  async waitForSpace(): Promise<void> {
    const backlog = this.queue.length + (this.running ? 1 : 0);
    if (backlog < this.maxQueueSize) return;
    return new Promise<void>((resolve) => {
      this.spaceResolvers.push(resolve);
    });
  }

  /**
   * 中断队列处理
   *
   * - 清空未处理的任务
   * - 阻止后续任务入队
   * - 唤醒所有等待中的 Promise
   * - 注意：正在执行的 TTS 无法取消，但不再触发 onAudio
   */
  abort(): void {
    if (this.aborted) return;
    this.aborted = true;
    this.queue = [];

    // 唤醒所有等待者
    for (const resolve of this.flushResolvers) resolve();
    for (const resolve of this.spaceResolvers) resolve();
    this.flushResolvers = [];
    this.spaceResolvers = [];
  }

  // ============= 内部方法 =============

  /** 主循环：持续处理队列直到清空或中断（while 循环，非递归） */
  private async processLoop(): Promise<void> {
    if (this.running) return;
    this.running = true;

    while (!this.aborted && this.queue.length > 0) {
      const task = this.queue.shift()!;

      // 有任务移出，可能释放了空间，通知等待者
      const backlog = this.queue.length + 1; // +1 因为当前任务正在处理
      if (backlog < this.maxQueueSize && this.spaceResolvers.length > 0) {
        for (const resolve of this.spaceResolvers) resolve();
        this.spaceResolvers = [];
      }

      await this.runTask(task);
    }

    this.running = false;

    // 队列已空，通知所有 flush 等待者
    if (this.flushResolvers.length > 0) {
      for (const resolve of this.flushResolvers) resolve();
      this.flushResolvers = [];
    }

    // 再次检查空间等待者
    if (this.spaceResolvers.length > 0) {
      const backlog = this.queue.length;
      if (backlog < this.maxQueueSize) {
        for (const resolve of this.spaceResolvers) resolve();
        this.spaceResolvers = [];
      }
    }
  }

  /** 执行单个 TTS 任务（带超时保护和中断检查） */
  private async runTask(task: TtsTask): Promise<void> {
    if (this.aborted) return;

    if (task.metrics) {
      task.metrics.startedAt = Date.now();
    }

    // 超时竞争
    const ttsPromise = textToSpeech(task.text, "Mia", 1.0, this.format);
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("TTS timeout")), this.timeoutMs),
    );

    let result;
    try {
      result = await Promise.race([ttsPromise, timeoutPromise]);
    } catch (err) {
      if (!this.aborted) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`TTS failed for sentence ${task.index}: ${msg}`);
        if (task.metrics) {
          task.metrics.error = msg;
        }
      }
      return;
    }

    if (this.aborted) return;

    if (!result.ok) {
      if (task.metrics) {
        task.metrics.error = result.error;
      }
      console.error(`TTS error for sentence ${task.index}: ${result.error}`);
      return;
    }

    const audioBase64 = result.audioBuffer.toString("base64");

    if (this.aborted) return;

    if (task.metrics) {
      task.metrics.finishedAt = Date.now();
    }

    // 回调异常隔离，不中断队列
    try {
      this.onAudio(task.index, audioBase64, this.format, task.metrics);
    } catch (err) {
      console.error("onAudio callback error:", err);
    }
  }
}
