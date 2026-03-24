import type { Metadata } from "next";
import Link from "next/link";

import { MarketingShell } from "@/app/components/MarketingShell";
import { MagicCard } from "@/components/magic-card";
import { ShimmerButton } from "@/components/shimmer-button";
import { Button } from "@/components/ui/button";
import {
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BeeWaggleLogo } from "@/app/components/BeeWaggleLogo";
import { ArrowRight, FileText, Wand2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Bee Waggle — 从需求到 Final Spec（Logic Blueprint）",
  description:
    "导入 PRD、整理需求稿（Markdown）、Alignment Audit 与 Vibe 分数，按角色生成 Final Spec 与 Cursor 规则建议。",
};

export default function HomePage() {
  return (
    <MarketingShell>
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-24">
        <section className="text-center">
          <p className="mb-2 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Bee Waggle · Clean · Align · Final Spec
          </p>
          <p className="mb-4 text-sm font-medium tracking-wide text-primary">
            PRD → 需求稿 → Final Spec
          </p>
          <h1 className="mx-auto max-w-3xl text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl md:text-5xl">
            把杂乱需求，变成可协作的
            <span className="text-primary"> Final Spec</span>
          </h1>
          <p className="mx-auto mt-4 max-w-[28rem] text-sm text-muted-foreground">
            摇摆舞传递信息，工程对齐交付 Spec。
          </p>
          <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-muted-foreground">
            结构化需求稿（Markdown）、Alignment Audit、Vibe 密度提示，再按角色生成含 Mermaid 与{" "}
            <code className="rounded-xl bg-muted px-1.5 py-0.5 text-sm">.cursorrules</code>{" "}
            建议的 <strong>Logic Blueprint</strong> 形态长文档——面向 Cursor 与真实仓库上下文。
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <ShimmerButton asChild size="lg" className="gap-2 px-8">
              <Link href="/workspace">
                打开工作台
                <ArrowRight className="size-4" />
              </Link>
            </ShimmerButton>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="rounded-3xl border-border/80 px-6 shadow-sm"
            >
              <Link href="/getting-started">5 分钟上手</Link>
            </Button>
          </div>
        </section>

        <section className="mt-24">
          <h2 className="text-center text-xl font-semibold text-foreground">
            三步工作流
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-center text-sm text-muted-foreground">
            与工具内界面一致：导入 → 需求稿 → Final Spec。
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <MagicCard>
              <CardHeader>
                <div className="mb-2 flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <FileText className="size-5" strokeWidth={1.75} />
                </div>
                <CardTitle className="text-lg">1 · 导入</CardTitle>
                <CardDescription className="text-sm leading-relaxed">
                  拖拽 PDF / Word / 文本或粘贴会议记录，整理为原始输入。
                </CardDescription>
              </CardHeader>
            </MagicCard>
            <MagicCard>
              <CardHeader>
                <div className="mb-2 flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Wand2 className="size-5" strokeWidth={1.75} />
                </div>
                <CardTitle className="text-lg">2 · 需求稿</CardTitle>
                <CardDescription className="text-sm leading-relaxed">
                  Clean 为 Markdown 需求稿，对照 Alignment Audit 与 Vibe，打磨表述。
                </CardDescription>
              </CardHeader>
            </MagicCard>
            <MagicCard>
              <CardHeader>
                <div className="mb-2 flex size-10 items-center justify-center rounded-2xl bg-primary/10 p-1.5 text-primary">
                  <BeeWaggleLogo className="size-full" />
                </div>
                <CardTitle className="text-lg">3 · Final Spec</CardTitle>
                <CardDescription className="text-sm leading-relaxed">
                  按 Target Role 生成 Final Spec（文档内为 Logic Blueprint，含测试矩阵与规则建议）。
                </CardDescription>
              </CardHeader>
            </MagicCard>
          </div>
        </section>

        <section className="mt-20 rounded-3xl border border-border/80 bg-muted/30 px-6 py-10 text-center shadow-[0_20px_50px_-24px_hsl(var(--foreground)/0.12)] sm:px-10">
          <h2 className="text-lg font-semibold text-foreground">隐私说明</h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            API Key 默认保存在本机浏览器，经你的服务端转发至模型供应商；请勿在公共设备保存密钥。具体行为见{" "}
            <Link className="font-medium text-primary underline-offset-4 hover:underline" href="/help">
              帮助中心
            </Link>
            。
          </p>
        </section>
      </div>
    </MarketingShell>
  );
}
