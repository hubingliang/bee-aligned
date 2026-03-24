import { NextResponse } from "next/server";
import { z } from "zod";

import { invokeLlm, modelEnum, readLlmHeadersFromRequest } from "@/lib/llm";

const targetRoleEnum = z.enum(["product", "frontend", "backend"]);

const generateRequestSchema = z.object({
  prdContent: z.string().min(1, "prdContent 不能为空"),
  model: modelEnum,
  targetRole: targetRoleEnum,
});

const ROLE_HINT: Record<z.infer<typeof targetRoleEnum>, string> = {
  product:
    "侧重：业务价值、用户旅程、验收标准、优先级与风险；技术细节点到为止。",
  frontend:
    "侧重：交互状态、页面/组件边界、客户端与服务端分工、可访问性与性能注意点。",
  backend:
    "侧重：数据一致性、幂等、事务与并发、错误码、审计与安全；接口契约用抽象描述即可。",
};

const SYSTEM_PROMPT = `你是一个资深「逻辑建模与开发引导」专家，面向在真实仓库中协作的 AI 编程助手与人类开发者。

## 你的立场

- **你不生成具体项目代码**，不输出可直接复制进仓库的完整源码块；必要时仅用**伪代码**、**流程图**（Mermaid 或 ASCII）、**表格**表达算法与数据关系。
- 你的产出是一份 **「面向 AI 的开发执行手册」**：让读者能按块推进实现，并与用户逐步对齐。

## 与 Target Role 的关系

用户会提供 **Target Role**（product / frontend / backend）。请按下列侧重点组织叙述（不要写死具体技术栈）：
- **product**：${ROLE_HINT.product}
- **frontend**：${ROLE_HINT.frontend}
- **backend**：${ROLE_HINT.backend}

## 输出格式（必须严格使用下列 Markdown 二级标题顺序与编号）

## 1. Logic Blueprint

用**伪代码**或**逻辑流程图**（推荐 Mermaid \`flowchart\` / \`sequenceDiagram\`，或 ASCII）描述核心算法与分支；标出关键判断条件与数据依赖。

## 2. Contextual Constraints

列出开发时必须遵守的**业务死理**与不变量（例如：余额不能为负、幂等键、禁止重复提交等），用短列表。

## 3. Cursor Step-by-Step Guide

划分 **Task 1, Task 2, …** 任务块。每一块必须包含类似含义的说明（可改写但不得省略意图）：
**「请结合项目现有上下文，实现 XXX 逻辑」** —— XXX 替换为具体、可验证的子目标。

## 4. Testing Matrix

列出 **恰好 5 条**必须通过的测试用例（可为表格：场景 / 输入 / 期望 / 备注），覆盖主路径与至少一条异常/边界。

## 5. .cursorrules

输出一段**可直接保存为项目根目录 \`.cursorrules\` 文件**的规则正文（用 Markdown 代码围栏 \`\`\`text 包裹整段内容）。

**硬性要求：**
- **不得**包含具体编程语言语法、具体框架 API、具体库导入语句。
- **必须**包含以下含义（可用你自己的话转述，但不得弱化）：
  - 在实现此需求时，请严格遵守 **Logic Blueprint** 中的步骤；
  - **每一步完成后请用户确认**再继续下一步。

全文使用 **Markdown**；除第 5 节中的 \`.cursorrules\` 正文外，主文档不要用 JSON 包裹。`;

type GenerateInput = z.infer<typeof generateRequestSchema>;

function buildUserMessage(input: GenerateInput): string {
  const { prdContent, targetRole } = input;
  return [
    "## 精炼后的需求（Markdown）",
    prdContent.trim(),
    "",
    "## Target Role",
    targetRole,
    "",
    "## 角色侧重说明（供你对齐叙述）",
    ROLE_HINT[targetRole],
  ].join("\n");
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

  const parsed = generateRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "参数校验失败",
        issues: z.treeifyError(parsed.error),
      },
      { status: 400 },
    );
  }

  const userMessage = buildUserMessage(parsed.data);

  try {
    const { markdown, provider } = await invokeLlm(
      parsed.data.model,
      readLlmHeadersFromRequest(request),
      SYSTEM_PROMPT,
      userMessage,
    );

    return NextResponse.json({
      provider,
      model: parsed.data.model,
      markdown,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "生成失败，请稍后重试";
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
