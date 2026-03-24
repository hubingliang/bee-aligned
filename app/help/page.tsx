import type { Metadata } from "next";
import Link from "next/link";

import { MarketingShell } from "@/app/components/MarketingShell";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "帮助中心 — PreVibe",
  description:
    "模型与密钥、工作流、Vibe 与逻辑审计、Prompt 手册（Logic Blueprint）与常见问题。",
};

const faq = [
  {
    q: "API Key 存在哪里？",
    a: "默认保存在本机浏览器的 localStorage，仅在你发起请求时经页面发往你的 Next 服务端；服务端再携带对应头访问模型供应商。请勿在公共设备保存密钥。",
  },
  {
    q: "为什么切换模型后提示缺 Key？",
    a: "不同厂商使用不同密钥槽位。切换模型后请在设置中确认已为当前模型填写对应 Key（如 OpenAI / Anthropic 等）。",
  },
  {
    q: "逻辑审计里的 Critical 与 Warning 是什么？",
    a: "Critical 表示可能存在严重逻辑矛盾；Warning 为提示级问题。界面不会因此禁用「Vibe Check」生成，但强烈建议先修改需求稿、消除或权衡 Critical 后再生成，以降低模型「脑补」风险。",
  },
  {
    q: "Vibe 分数低是什么意思？",
    a: "Vibe 侧重「逻辑密度」启发式评分，并会受审计冲突影响；低分不代表一定错误，但生成时模型更容易「脑补」。界面会在极低分时提示确认。",
  },
  {
    q: "Prompt 手册（Logic Blueprint）里会包含完整业务代码吗？",
    a: "产品设计为长篇协作提示：文档内章节标题为 Logic Blueprint，含伪代码、Mermaid、测试矩阵与 .cursorrules 建议，而非可直接粘贴进仓库的完整业务源码。",
  },
  {
    q: "Clean 或生成失败怎么办？",
    a: "检查网络、模型服务端可用性、Key 是否过期、以及请求体是否过大。若接口返回具体错误文案，可据此排查；仍失败可稍后重试。",
  },
];

export default function HelpPage() {
  return (
    <MarketingShell>
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          帮助中心
        </h1>
        <p className="mt-3 text-muted-foreground">
          概念说明与常见问题；上手步骤见{" "}
          <Link className="font-medium text-primary underline-offset-4 hover:underline" href="/getting-started">
            快速开始
          </Link>
          。
        </p>

        <section className="mt-10 space-y-4">
          <h2 className="text-lg font-semibold text-foreground">工作流概览</h2>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">三步</CardTitle>
              <CardDescription>
                导入原始内容 → Clean 为 Markdown 需求稿 → 按角色生成 Prompt 手册（文档内为
                Logic Blueprint，含 Mermaid、测试矩阵、.cursorrules 建议块）。
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>
                工作台路径：{" "}
                <Link className="text-primary underline-offset-4 hover:underline" href="/workspace">
                  /workspace
                </Link>
              </p>
            </CardContent>
          </Card>
        </section>

        <section className="mt-10 space-y-4">
          <h2 className="text-lg font-semibold text-foreground">
            常见提示与错误对照
          </h2>
          <p className="text-sm text-muted-foreground">
            以下为当前版本界面与接口中**常见**提示；若文案随版本微调，以页面与接口返回为准。术语规范见仓库{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs">docs/TERMINOLOGY.md</code>
            。
          </p>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Toast（顶部通知）</CardTitle>
              <CardDescription>
                <ul className="list-disc space-y-1 pl-5 text-sm leading-relaxed">
                  <li>
                    <strong>逻辑审计</strong>：防抖审计结束后，若检测到冲突，会提示「检测到 N
                    处潜在冲突」或「新增 M 处冲突，当前共 N 处」。
                  </li>
                </ul>
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">缺少 API Key（Clean / 审计 / 生成）</CardTitle>
              <CardDescription className="text-sm leading-relaxed">
                服务端在校验模型路由时可能返回类似：「缺少 OpenAI API Key（请求头 x-openai-key
                或环境变量 OPENAI_API_KEY）」——不同厂商文案不同，含义均为：当前模型对应的 Key
                未通过浏览器设置或部署环境变量传入。另可能提示 Gemini 密钥误填到 OpenAI 槽位等。
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">导入文件（/api/parse）</CardTitle>
              <CardDescription>
                <ul className="list-disc space-y-1 pl-5 text-sm leading-relaxed">
                  <li>未找到上传文件 / 文件为空</li>
                  <li>文件超过 5MB 限制，请压缩或拆分后再试（HTTP 413）</li>
                  <li>仅支持 .pdf、.docx、.md、.txt</li>
                  <li>解析失败，可改用手动粘贴内容 / 未能从文件中提取文本，可改用手动粘贴</li>
                  <li>处理上传时出错（服务端异常）</li>
                </ul>
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">通用接口错误</CardTitle>
              <CardDescription>
                <ul className="list-disc space-y-1 pl-5 text-sm leading-relaxed">
                  <li>请求体不是合法的 JSON</li>
                  <li>参数校验失败（字段不符合约定时附带校验细节）</li>
                  <li>降噪 / 审计 / 生成 / 解释 失败类：多为「…失败，请稍后重试」或上游模型错误信息原文</li>
                </ul>
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">工作台内嵌错误</CardTitle>
              <CardDescription className="text-sm leading-relaxed">
                解析、Clean、生成、逻辑审计、Explain 等失败时，错误文案显示在对应卡片或侧栏（红色小字），与上表同一来源时表述一致。
              </CardDescription>
            </CardHeader>
          </Card>
        </section>

        <section className="mt-10">
          <h2 className="text-lg font-semibold text-foreground">常见问题</h2>
          <ul className="mt-4 space-y-3">
            {faq.map((item) => (
              <li key={item.q}>
                <Card className="border-border/80">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-medium text-foreground">
                      {item.q}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm leading-relaxed text-muted-foreground">
                    {item.a}
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        </section>

        <p className="mt-12 text-center text-sm text-muted-foreground">
          <Link className="font-medium text-primary underline-offset-4 hover:underline" href="/">
            返回首页
          </Link>
        </p>
      </div>
    </MarketingShell>
  );
}
