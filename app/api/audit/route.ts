import { NextResponse } from "next/server";
import { z } from "zod";

import { invokeLlm, modelEnum, readLlmHeadersFromRequest } from "@/lib/llm";

const auditRequestSchema = z.object({
  refinedMd: z.string().min(1, "refinedMd 不能为空"),
  model: modelEnum,
});

const conflictItemSchema = z.object({
  line: z.number().int().positive(),
  type: z.enum(["Critical", "Warning"]),
  reason: z.string().min(1),
});

const AUDIT_SYSTEM_PROMPT = `你是一个极其严苛的系统分析师。请审计这份需求文档，找出以下冲突：

1. **状态矛盾**：同一实体在不同描述下处于互斥状态。
2. **权限冲突**：操作权限与用户角色描述不符。
3. **流程断裂**：有输入触发但没有对应的输出或跳转结果。
4. **术语不一**：对同一个业务对象使用了不同的名称。

## 输出要求（必须严格遵守）

- **只输出一个 JSON 数组**，不要任何其他文字、不要 Markdown 代码围栏、不要解释。
- 数组元素结构：{"line": number, "type": "Critical" | "Warning", "reason": string}
- **line**：问题所在行号，必须为 1-based，且对应用户消息中带行号前缀的文档行。
- **type**：严重用 Critical，次要或不明确用 Warning。
- **reason**：一句话说明冲突类型与要点（可中英混排）。
- 若未发现冲突，输出：[]`;

function buildNumberedDocument(md: string): string {
  const lines = md.split(/\r?\n/);
  return lines
    .map((line, i) => `${String(i + 1).padStart(4, "0")}|${line}`)
    .join("\n");
}

function parseConflictsJson(text: string): z.infer<typeof conflictItemSchema>[] {
  const trimmed = text.trim();
  const fence =
    /^```(?:json)?\s*([\s\S]*?)```$/m.exec(trimmed) ??
    /```(?:json)?\s*([\s\S]*?)```/.exec(trimmed);
  const raw = fence ? fence[1].trim() : trimmed;
  const parsed: unknown = JSON.parse(raw);
  const arr = Array.isArray(parsed) ? parsed : (parsed as { conflicts?: unknown }).conflicts;
  if (!Array.isArray(arr)) {
    throw new Error("模型返回不是 JSON 数组");
  }
  const out: z.infer<typeof conflictItemSchema>[] = [];
  for (const item of arr) {
    const one = conflictItemSchema.safeParse(item);
    if (one.success) {
      out.push(one.data);
    }
  }
  return out;
}

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

  const parsed = auditRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "参数校验失败",
        issues: z.treeifyError(parsed.error),
      },
      { status: 400 },
    );
  }

  const doc = parsed.data.refinedMd.trim();
  const numbered = buildNumberedDocument(doc);

  const userMessage = [
    "下列需求文档每行以 `0001|` 形式前缀标明行号（数字为行号）。请据此在 JSON 的 line 字段中填写对应行号。",
    "",
    numbered,
  ].join("\n");

  try {
    const { markdown, provider } = await invokeLlm(
      parsed.data.model,
      readLlmHeadersFromRequest(request),
      AUDIT_SYSTEM_PROMPT,
      userMessage,
    );

    const conflicts = parseConflictsJson(markdown);

    return NextResponse.json({
      provider,
      model: parsed.data.model,
      conflicts,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "审计失败，请稍后重试";
    const isConfig =
      message.includes("缺少") ||
      message.includes("API Key") ||
      message.includes("环境变量");
    return NextResponse.json(
      { error: message, conflicts: [] as z.infer<typeof conflictItemSchema>[] },
      { status: isConfig ? 503 : 502 },
    );
  }
}
