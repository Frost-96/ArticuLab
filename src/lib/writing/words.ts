/**
 * 按空白分词统计英文词数（与 PATCH draft 校验、WritingExercise.wordCount 一致）
 *
 * 输入格式：
 * - text：string，作文全文
 *
 * 输出格式：
 * - number：非负整数；trim 后按 /\s+/ 切分
 */
export function countWords(text: string): number {
  const t = text.trim();
  if (!t) return 0;
  return t.split(/\s+/).length;
}
