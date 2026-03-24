import { existsSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { NextResponse } from "next/server";

export const runtime = "nodejs";

/** Vercel Serverless 请求体上限约 4.5MB，须留余量，避免在到达本路由前被边缘层拒绝并返回空响应 */
export const maxDuration = 60;

export const dynamic = "force-dynamic";

const MAX_BYTES = 4 * 1024 * 1024;

const ALLOWED_EXT = new Set(["pdf", "docx", "md", "txt"]);

function getExtension(filename: string): string {
  const i = filename.lastIndexOf(".");
  if (i < 0) return "";
  return filename.slice(i + 1).toLowerCase();
}

/**
 * Vercel / Node 下 pdf.js 需显式 worker 路径，否则 getDocument 常失败。
 * `pdfjs-dist` 已列为直接依赖，保证 `node_modules/pdfjs-dist` 可解析。
 * 不同大版本 worker 路径可能不同，故做多候选。
 */
function resolvePdfWorkerFileUrl(): string | undefined {
  const root = path.join(process.cwd(), "node_modules", "pdfjs-dist");
  const candidates = [
    path.join(root, "legacy", "build", "pdf.worker.mjs"),
    path.join(root, "build", "pdf.worker.mjs"),
    path.join(root, "build", "pdf.worker.min.mjs"),
  ];
  for (const p of candidates) {
    if (existsSync(p)) return pathToFileURL(p).href;
  }
  return undefined;
}

function configurePdfWorker(PDFParse: {
  setWorker?: (src: string | undefined) => string;
}): void {
  if (typeof PDFParse.setWorker !== "function") return;
  const href = resolvePdfWorkerFileUrl();
  if (href) PDFParse.setWorker(href);
}

/** 动态导入，避免 pdf-parse/pdfjs 在部分 Serverless 环境初始化失败时拖垮整段路由模块加载（表现为 500 HTML 而非 JSON） */
async function parsePdf(buffer: Buffer): Promise<string> {
  const { PDFParse } = await import("pdf-parse");
  configurePdfWorker(PDFParse);
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return result.text.trim();
  } finally {
    await parser.destroy();
  }
}

async function parseDocx(buffer: Buffer): Promise<string> {
  const { extractRawText } = await import("mammoth");
  const result = await extractRawText({ buffer });
  return result.value.trim();
}

function parsePlainText(buffer: Buffer): string {
  return new TextDecoder("utf-8", { fatal: false }).decode(buffer).trim();
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "未找到上传文件" }, { status: 400 });
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        {
          error:
            "文件超过 4MB 限制（部署环境单请求约 4.5MB 上限），请压缩或拆分后再试",
        },
        { status: 413 },
      );
    }

    if (file.size === 0) {
      return NextResponse.json({ error: "文件为空" }, { status: 400 });
    }

    const ext = getExtension(file.name);
    if (!ALLOWED_EXT.has(ext)) {
      return NextResponse.json(
        { error: "仅支持 .pdf、.docx、.md、.txt" },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    let content: string;
    try {
      if (ext === "pdf") {
        content = await parsePdf(buffer);
      } else if (ext === "docx") {
        content = await parseDocx(buffer);
      } else {
        content = parsePlainText(buffer);
      }
    } catch (cause) {
      const detail =
        cause instanceof Error ? cause.message : String(cause).slice(0, 500);
      console.error("[parse] extraction failed", cause);
      const label =
        ext === "pdf" ? "PDF" : ext === "docx" ? "Word" : "文本";
      return NextResponse.json(
        {
          error: `${label} 解析失败，可改用手动粘贴内容`,
          detail,
          kind: ext,
        },
        { status: 422 },
      );
    }

    if (!content) {
      return NextResponse.json(
        { error: "未能从文件中提取文本，可改用手动粘贴" },
        { status: 422 },
      );
    }

    return NextResponse.json({ content });
  } catch (cause) {
    console.error("[parse] request failed", cause);
    return NextResponse.json({ error: "处理上传时出错" }, { status: 500 });
  }
}
