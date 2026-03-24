/**
 * pdfjs-dist（pdf-parse 依赖）在 Node 中会引用 `DOMMatrix` / `DOMMatrixReadOnly`，
 * 纯 Node 环境无这些浏览器 API，会导致 ReferenceError。
 * 须在动态 `import("pdf-parse")` 之前执行一次。
 */
export async function installDomMatrixPolyfill(): Promise<void> {
  if (typeof globalThis.DOMMatrix !== "undefined") return;
  const { default: CSSMatrix } = await import("@thednp/dommatrix");
  const g = globalThis as unknown as {
    DOMMatrix: typeof CSSMatrix;
    DOMMatrixReadOnly: typeof CSSMatrix;
  };
  g.DOMMatrix = CSSMatrix;
  g.DOMMatrixReadOnly = CSSMatrix;
}
