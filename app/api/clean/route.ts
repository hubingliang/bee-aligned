import { NextResponse } from "next/server";
import { z } from "zod";

import { invokeLlm, modelEnum, readLlmHeadersFromRequest } from "@/lib/llm";

const cleanRequestSchema = z.object({
  rawContent: z.string().min(1, "rawContent 不能为空"),
  model: modelEnum,
});

const CLEAN_SYSTEM_PROMPT = `你是一个专业的需求分析师。你的任务是将杂乱的原始文档（可能是飞书导出、PDF 或随手笔记）提炼为精准的 Markdown 需求。要求：
仅保留：1. 功能列表 2. 业务逻辑流程 3. UI 交互细节 4. 数据结构/Schema。
删除：项目背景、市场分析、人员分工等非技术开发信息。

只输出 Markdown 正文，不要 JSON。`;

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "请求体不是合法的 JSON" },
      { status: 400 },
    );
  }

  const parsed = cleanRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "参数校验失败",
        issues: z.treeifyError(parsed.error),
      },
      { status: 400 },
    );
  }

  const userMessage = [
    "## 原始文档",
    parsed.data.rawContent.trim(),
  ].join("\n\n");

  try {
    const { markdown, provider } = await invokeLlm(
      parsed.data.model,
      readLlmHeadersFromRequest(request),
      CLEAN_SYSTEM_PROMPT,
      userMessage,
    );

    return NextResponse.json({
      provider,
      model: parsed.data.model,
      markdown,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "降噪失败，请稍后重试";
    const isConfig =
      message.includes("缺少") ||
      message.includes("API Key") ||
      message.includes("环境变量");
    return NextResponse.json(
      { error: message },
      { status: isConfig ? 503 : 502 },
    );
  }
}
