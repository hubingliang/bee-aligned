import { NextResponse } from "next/server";
import { z } from "zod";

import { invokeLlm, modelEnum, readLlmHeadersFromRequest } from "@/lib/llm";

const explainRequestSchema = z.object({
  refinedMd: z.string().min(1, "refinedMd 不能为空"),
  model: modelEnum,
  conflict: z.object({
    line: z.number().int().positive(),
    type: z.enum(["Critical", "Warning"]),
    reason: z.string().min(1),
  }),
});

const EXPLAIN_SYSTEM_PROMPT = `你是资深需求分析师。用户有一份需求 Markdown，以及一条「Alignment Audit」结论（可能指出状态矛盾、权限冲突、流程断裂或术语不一）。

你的任务：
1. 结合全文上下文，解释**为什么**该结论认为存在矛盾或风险（指出相互抵触或缺失的表述）。
2. 给出**可执行的修改建议**（如何改文档措辞或补全流程），用 Markdown 分点列出。

不要输出 JSON；使用 Markdown 正文即可。语气专业、简洁。`;

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

  const parsed = explainRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "参数校验失败",
        issues: z.treeifyError(parsed.error),
      },
      { status: 400 },
    );
  }

  const { refinedMd, model, conflict } = parsed.data;

  const userMessage = [
    "## 精炼需求（Markdown）",
    refinedMd.trim(),
    "",
    "## 待解释的 Alignment Audit 条目",
    `- 行号：${conflict.line}`,
    `- 级别：${conflict.type}`,
    `- 摘要：${conflict.reason}`,
    "",
    "请解释矛盾点并给出修改建议。",
  ].join("\n");

  try {
    const { markdown, provider } = await invokeLlm(
      model,
      readLlmHeadersFromRequest(request),
      EXPLAIN_SYSTEM_PROMPT,
      userMessage,
    );

    return NextResponse.json({
      provider,
      model,
      markdown,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "解释失败，请稍后重试";
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
