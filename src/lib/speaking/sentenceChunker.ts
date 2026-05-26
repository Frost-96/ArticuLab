// 句子分块器：将 LLM 流式输出的文本片段按语义边界切分为句子
//
// 双阶段策略：
// - First Chunk：快速开口（4~6 词 + 标点/语义边界/超时）
// - Later Chunk：保持流畅（15 词 + 语义边界/标点，或 hard limit 30 词）

/** 句子分块器选项 */
export interface SentenceChunkerOptions {
  /** 强制 flush 的最大单词数（任何阶段），默认 30 */
  maxWords?: number;
  /** First Chunk 空闲超时（毫秒），默认 500 */
  firstChunkTimeout?: number;
  /** Later Chunk 空闲超时（毫秒），默认 1200 */
  laterChunkTimeout?: number;
}

/** 语义边界关键词（已归一化：小写，无标点），包含常见口语短语 */
const SEMANTIC_BOUNDARIES = new Set([
  "and",
  "but",
  "because",
  "so",
  "well",
  "actually",
  "however",
  "then",
  "i think",
  "you know",
  "i mean",
  "for example",
  "by the way",
]);

/** 句末标点正则 */
const SENTENCE_TERMINATORS = /[.!?]$/;

/**
 * 句子分块器（Realtime Pacing Engine）
 *
 * 将 LLM 流式输出的文本片段按语义边界切分为句子，
 * 通过 onSentence 回调将完整句子传递给 TTS 队列。
 */
export class SentenceChunker {
  /** 文本缓冲区 */
  private buffer = "";
  /** 增量维护的单词计数，避免每次 split */
  private wordCount = 0;
  /** 空闲定时器 */
  private timer: ReturnType<typeof setTimeout> | null = null;
  /** 句子完成回调 */
  private onSentence: (sentence: string) => void;
  /** 配置选项 */
  private options: Required<SentenceChunkerOptions>;
  /** 是否为第一个 chunk（首次 flush 后切换为 false） */
  private isFirstChunk = true;
  /** 是否已暂停（背压控制：暂停期间不触发 flush，不清除 buffer） */
  private paused = false;
  /** 是否已销毁 */
  private destroyed = false;

  constructor(
    onSentence: (sentence: string) => void,
    options?: SentenceChunkerOptions,
  ) {
    this.onSentence = onSentence;
    this.options = {
      maxWords: Math.max(1, options?.maxWords ?? 30),
      firstChunkTimeout: Math.max(100, options?.firstChunkTimeout ?? 5000),
      laterChunkTimeout: Math.max(200, options?.laterChunkTimeout ?? 12000),
    };
  }

  /**
   * 推入一个文本片段（来自 LLM delta.content）
   *
   * @param textDelta - LLM 生成的文本片段（可能为单词片段、标点、空格等）
   */
  pushText(textDelta: string): void {
    if (this.destroyed || this.paused || !textDelta) return;

    // 记录旧 buffer 状态用于增量单词计数
    const prevEndsWithSpace =
      this.buffer.length === 0 || /\s$/.test(this.buffer);
    const deltaStartsWithSpace = /^\s/.test(textDelta);

    this.buffer += textDelta;

    // 增量更新单词计数
    const parts = textDelta.split(/\s+/).filter((p) => p.length > 0);
    let added = parts.length;
    // 若前 buffer 不以空格结尾 且 delta 不以空格开头，第一个片段与上一个单词合并
    if (
      !prevEndsWithSpace &&
      !deltaStartsWithSpace &&
      added > 0 &&
      this.buffer.length > textDelta.length
    ) {
      added--;
    }
    this.wordCount += Math.max(0, added);

    this.resetTimer();

    if (this.isFirstChunk) {
      this.checkFirstChunkFlush();
    } else {
      this.checkLaterChunkFlush();
    }
  }

  /**
   * 流结束时强制刷新剩余内容
   */
  flush(): void {
    if (this.destroyed || this.paused) return;
    this.clearTimer();
    this.emitBuffer();
  }

  /**
   * 中断并清理资源（用户取消对话时调用）
   */
  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.clearTimer();
    this.buffer = "";
    this.wordCount = 0;
  }

  /**
   * 暂停分块器（背压控制）
   *
   * 暂停期间：
   * - pushText 不处理新文本（不更新 buffer、不检查 flush、不重置定时器）
   * - flush 不触发
   * - 定时器被清除，防止异步触发 emitBuffer
   *
   * 用于 TTS 队列满时暂停 LLM token 消费前的分块处理。
   */
  pause(): void {
    if (this.paused || this.destroyed) return;
    this.paused = true;
    this.clearTimer();
  }

  /**
   * 恢复分块器（背压释放后）
   *
   * 恢复后立即重启定时器并重检 flush 条件，
   * 确保背压期间积累在 buffer 中的内容能被及时处理。
   */
  resume(): void {
    if (!this.paused || this.destroyed) return;
    this.paused = false;
    this.resetTimer();
    if (this.isFirstChunk) {
      this.checkFirstChunkFlush();
    } else {
      this.checkLaterChunkFlush();
    }
  }

  // ============= 内部方法 =============

  /** 重置空闲定时器 */
  private resetTimer(): void {
    this.clearTimer();
    const timeout = this.isFirstChunk
      ? this.options.firstChunkTimeout
      : this.options.laterChunkTimeout;
    this.timer = setTimeout(() => {
      this.emitBuffer();
    }, timeout);
  }

  /** 清除定时器 */
  private clearTimer(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  /**
   * First Chunk flush 检查（快速开口策略）
   *
   * 满足任意条件即 flush：
   * 1. 标点（.!?）+ word count ≥ 2
   * 2. word count ≥ 6 + 语义边界
   * 3. 达到 maxWords 无条件切分（hard limit）
   * 4. 空闲超时 500ms（由定时器触发 → emitBuffer）
   */
  private checkFirstChunkFlush(): void {
    if (this.paused || this.wordCount === 0) return;

    // 条件1: 标点 + ≥2 词
    if (this.wordCount >= 2 && SENTENCE_TERMINATORS.test(this.buffer.trim())) {
      this.emitBuffer();
      return;
    }

    // 条件2: ≥6 词 + 语义边界
    if (this.wordCount >= 6 && this.endsWithSemanticBoundary()) {
      this.emitBuffer();
      return;
    }

    // Hard limit: 达到 maxWords 无条件切分
    if (this.wordCount >= this.options.maxWords) {
      this.emitBuffer();
    }
  }

  /**
   * Later Chunk flush 检查（持续流策略）
   *
   * 满足任意条件即 flush：
   * 1. word count ≥ 15 + 语义边界或标点
   * 2. 达到 maxWords 无条件切分（hard flush）
   * 3. 空闲超时 1200ms（由定时器触发 → emitBuffer）
   */
  private checkLaterChunkFlush(): void {
    if (this.paused || this.wordCount === 0) return;

    // 条件1: ≥15 词 + 语义边界或标点
    if (
      this.wordCount >= 15 &&
      (this.endsWithSemanticBoundary() ||
        SENTENCE_TERMINATORS.test(this.buffer.trim()))
    ) {
      this.emitBuffer();
      return;
    }

    // Hard flush: 达到 maxWords 无条件切分
    if (this.wordCount >= this.options.maxWords) {
      this.emitBuffer();
    }
  }

  /**
   * 发射当前缓冲区内容
   */
  private emitBuffer(): void {
    if (this.destroyed) return;

    // 规范化空白：多个空格合并为一个
    const text = this.buffer.trim().replace(/\s+/g, " ");
    if (!text) return;

    this.buffer = "";
    this.wordCount = 0;
    this.clearTimer();

    // 切换到 Later Chunk 策略
    if (this.isFirstChunk) {
      this.isFirstChunk = false;
    }

    try {
      this.onSentence(text);
    } catch (err) {
      console.error("SentenceChunker callback error:", err);
    }
  }

  /**
   * 检查当前 buffer 是否以语义边界结尾
   *
   * 归一化后匹配：去除末尾标点，检查最后 1~3 个词的组合
   */
  private endsWithSemanticBoundary(): boolean {
    const trimmed = this.buffer.trim();
    if (!trimmed) return false;

    // 逗号直接作为边界
    if (trimmed.endsWith(",")) return true;

    // 提取最后 1~3 个词，归一化后检查是否在语义边界集合中
    const words = trimmed.split(/\s+/);
    for (let len = Math.min(words.length, 3); len >= 1; len--) {
      const phrase = words
        .slice(-len)
        .join(" ")
        .toLowerCase()
        .replace(/[^\w\s]/g, "");
      if (SEMANTIC_BOUNDARIES.has(phrase)) return true;
    }
    return false;
  }
}
