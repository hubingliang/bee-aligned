/**
 * 先读 text 再 JSON.parse，避免 res.json() 在空 body 时抛出
 * “Unexpected end of JSON input”（常见于网关/平台在请求体过大时直接截断且无 JSON）。
 */
export async function parseResponseJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  if (!text.trim()) {
    throw new Error(
      `服务端返回空内容（HTTP ${res.status}）。若在 Vercel 部署，请确认文件未超过平台请求体上限（约 4.5MB），或稍后重试。`,
    );
  }
  const trimmed = text.trimStart();
  if (trimmed.startsWith("<!DOCTYPE") || trimmed.startsWith("<html")) {
    throw new Error(
      `服务端返回了 HTML 错误页（HTTP ${res.status}），多为 Route 未捕获异常或依赖在部署环境加载失败。请查看 Vercel 函数日志。`,
    );
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(
      `服务端返回非 JSON（HTTP ${res.status}）：${text.slice(0, 240)}`,
    );
  }
}
