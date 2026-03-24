import type { Metadata } from "next";
import Link from "next/link";

import { MarketingShell } from "@/app/components/MarketingShell";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";

export const metadata: Metadata = {
  title: "快速开始 — PreVibe",
  description:
    "配置 API Key、选择模型与角色，完成导入 → 需求稿 → Prompt 手册的完整路径。",
};

const sections = [
  {
    id: "prepare",
    title: "1. 准备",
    body: (
      <>
        <p>
          支持常见需求来源：<strong>PDF、Word、Markdown、纯文本</strong>
          。内容越长，Clean 与审计耗时可能越高；建议单次先聚焦一条业务线或一个功能域。
        </p>
        <p className="mt-3">请使用现代浏览器（Chrome / Edge / Safari / Firefox 最新版）。</p>
      </>
    ),
  },
  {
    id: "keys",
    title: "2. 配置 API Key",
    body: (
      <>
        <p>
          打开{" "}
          <Link className="font-medium text-primary underline-offset-4 hover:underline" href="/workspace">
            工作台
          </Link>
          ，点击右上角 <strong>设置</strong>，按<strong>当前所选模型</strong>填写对应
          Key：
        </p>
        <ul className="mt-3 list-disc space-y-1 pl-5">
          <li>GPT 系列 → OpenAI API Key</li>
          <li>Claude → Anthropic API Key</li>
          <li>DeepSeek / Gemini / Achat 等 → 按表单提示填写</li>
        </ul>
        <p className="mt-3">
          Key 仅保存在<strong>本机浏览器</strong>，通过请求头发往<strong>你的</strong>
          Next 服务端再转发至模型；请勿在公共电脑保存。
        </p>
      </>
    ),
  },
  {
    id: "model-role",
    title: "3. 模型与 Target Role",
    body: (
      <>
        <p>
          顶栏可选择<strong>模型</strong>；设置中可选择{" "}
          <strong>Target Role</strong>（Product / Frontend /
          Backend），将影响 Prompt 手册（Logic Blueprint）的叙述侧重。
        </p>
        <p className="mt-3">
          切换模型后，请确认已为该模型配置 Key，否则 Clean、审计与生成会失败。
        </p>
      </>
    ),
  },
  {
    id: "run",
    title: "4. 跑通一轮",
    body: (
      <>
        <ol className="list-decimal space-y-3 pl-5">
          <li>
            <strong>导入</strong>：拖入文件或粘贴文本 → 点击{" "}
            <strong>Clean to Markdown</strong>。
          </li>
          <li>
            <strong>需求稿</strong>：在编辑器中修改 Markdown；右侧可查看{" "}
            <strong>逻辑审计</strong>与 <strong>Vibe</strong>。存在{" "}
            <strong>Critical</strong> 冲突时，建议先消再点生成。
          </li>
          <li>
            <strong>Prompt 手册</strong>：点击{" "}
            <strong>Vibe Check (Generate Prompt)</strong>，在 Step 3 查看
            Prompt 手册（文档内章节为 Logic Blueprint），可复制全文或跳转至「Prompt 手册」区域。
          </li>
        </ol>
      </>
    ),
  },
  {
    id: "next",
    title: "5. 下一步",
    body: (
      <>
        <p>
          若遇错误提示或概念不清，请查看{" "}
          <Link className="font-medium text-primary underline-offset-4 hover:underline" href="/help">
            帮助中心
          </Link>
          。
        </p>
        <div className="mt-6">
          <Button asChild size="lg" className="rounded-full">
            <Link href="/workspace">进入工作台</Link>
          </Button>
        </div>
      </>
    ),
  },
];

export default function GettingStartedPage() {
  return (
    <MarketingShell>
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          快速开始
        </h1>
        <p className="mt-3 text-muted-foreground">
          按顺序完成环境配置与第一次生成；预计 5～10 分钟。
        </p>

        <Alert className="mt-8">
          <Info className="size-4" />
          <AlertTitle>提示</AlertTitle>
          <AlertDescription>
            所有与模型交互的步骤都需要有效 API Key 与网络可达的服务端路由。
          </AlertDescription>
        </Alert>

        <nav className="mt-10 rounded-lg border border-border bg-muted/30 p-4 text-sm">
          <p className="font-medium text-foreground">本页目录</p>
          <ul className="mt-2 space-y-1 text-muted-foreground">
            {sections.map((s) => (
              <li key={s.id}>
                <a className="hover:text-foreground" href={`#${s.id}`}>
                  {s.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="mt-12 space-y-14">
          {sections.map((s) => (
            <section key={s.id} className="scroll-mt-24" id={s.id}>
              <h2 className="text-xl font-semibold text-foreground">{s.title}</h2>
              <div className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground [&_strong]:text-foreground">
                {s.body}
              </div>
            </section>
          ))}
        </div>
      </div>
    </MarketingShell>
  );
}
