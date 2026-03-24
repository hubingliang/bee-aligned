import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

/** Vercel Serverless 请求体上限约 4.5MB，须留余量，避免在到达本路由前被边缘层拒绝并返回空响应 */
export const maxDuration = 60;

const MAX_BYTES = 4 * 1024 * 1024;

const ALLOWED_EXT = new Set(["pdf", "docx", "md", "txt"]);

function getExtension(filename: string): string {
  const i = filename.lastIndexOf(".");
  if (i < 0) return "";
  return filename.slice(i + 1).toLowerCase();
}

async function parsePdf(buffer: Buffer): Promise<string> {
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return result.text.trim();
  } finally {
    await parser.destroy();
  }
}

async function parseDocx(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer });
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
        { error: "文件超过 4MB 限制（部署环境单请求约 4.5MB 上限），请压缩或拆分后再试" },
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
      console.error("[parse] extraction failed", cause);
      return NextResponse.json(
        { error: "解析失败，可改用手动粘贴内容" },
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
