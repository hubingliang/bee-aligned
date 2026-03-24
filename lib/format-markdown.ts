/**
 * 轻量 Markdown 正则清洗：多余换行、标题与列表空格、列表符号规范化。
 */
export function formatMarkdown(text: string): string {
  let s = text.replace(/\r\n/g, "\n");
  s = s.replace(/\u00a0/g, " ");
  s = s.replace(/\n{3,}/g, "\n\n");

  const lines = s.split("\n");
  const out: string[] = [];
  let blankRun = 0;

  for (const line of lines) {
    const trimmedEnd = line.trimEnd();
    if (trimmedEnd.trim() === "") {
      blankRun++;
      if (blankRun <= 2) {
        out.push("");
      }
      continue;
    }
    blankRun = 0;
    let t = trimmedEnd.trim();
    if (/^#{1,6}(?!\s|#)/.test(t)) {
      t = t.replace(/^(#{1,6})(\S)/, "$1 $2");
    }
    t = t.replace(/^(\s*)([-*+])(\S)/, "$1$2 $3");
    t = t.replace(/^(\s*)(\d+)\.(\S)/, "$1$2. $3");
    out.push(t);
  }

  return out
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
