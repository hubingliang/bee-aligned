"use client";

import Link from "next/link";
import { HelpCircle, Settings2, Sparkles } from "lucide-react";

import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SheetTrigger } from "@/components/ui/sheet";

const WORKFLOW_STEPS = [
  {
    title: "导入",
    subtitle: "Input",
    body: "导入 PRD / 文档并整理为原始文本，支持拖拽或粘贴。",
  },
  {
    title: "需求稿",
    subtitle: "Spec",
    body: "将杂乱内容 Clean 为结构化 Markdown 需求稿，并配合逻辑审计与 Vibe 打磨。",
  },
  {
    title: "Prompt 手册",
    subtitle: "Logic Blueprint",
    body: "按 Target Role 生成长篇协作提示（文档内标题为 Logic Blueprint），含 Mermaid、测试矩阵与 .cursorrules 建议等。",
  },
] as const;

export type AppHeaderProps = {
  model: string;
  onModelChange: (v: string) => void;
  modelOptions: readonly { value: string; label: string }[];
  showKeyWarning: boolean;
};

export function AppHeader({
  model,
  onModelChange,
  modelOptions,
  showKeyWarning,
}: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-50 shrink-0 border-b border-border bg-background/95 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-[1600px] items-center justify-between gap-3 px-4 sm:px-6 lg:h-16 lg:px-8">
        <div className="flex min-w-0 items-center gap-2">
          <Link
            className="flex min-w-0 items-center gap-2 rounded-lg text-foreground outline-none ring-offset-background transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring"
            href="/"
            title="返回首页"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Sparkles className="size-[18px]" strokeWidth={1.75} />
            </span>
            <span className="truncate font-semibold tracking-tight">PreVibe</span>
          </Link>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="shrink-0 text-muted-foreground"
                aria-label="工作流说明"
              >
                <HelpCircle className="size-4" strokeWidth={1.75} />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[min(100vw-2rem,22rem)]" align="start">
              <p className="mb-3 text-sm font-semibold">三步工作流</p>
              <ul className="space-y-3 text-xs text-muted-foreground">
                {WORKFLOW_STEPS.map((s) => (
                  <li key={s.title}>
                    <span className="font-medium text-foreground">{s.title}</span>
                    <span className="text-muted-foreground/80"> · {s.subtitle}</span>
                    <p className="mt-0.5 leading-relaxed">{s.body}</p>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 border-t border-border pt-3 text-xs">
                <Link className="font-medium text-primary hover:underline" href="/getting-started">
                  快速开始
                </Link>
                <Link className="font-medium text-primary hover:underline" href="/help">
                  帮助中心
                </Link>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex min-w-0 items-center justify-end gap-2">
          <Select value={model} onValueChange={onModelChange}>
            <SelectTrigger
              aria-label="Model"
              className="h-8 max-w-[min(200px,42vw)] min-w-[120px] text-xs"
              size="sm"
            >
              <SelectValue placeholder="Model" />
            </SelectTrigger>
            <SelectContent>
              {modelOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <ModeToggle />
          <div className="relative shrink-0">
            <SheetTrigger asChild>
              <Button
                aria-label="API Key 与高级设置"
                size="icon-sm"
                type="button"
                variant="outline"
              >
                <Settings2 className="size-4" strokeWidth={1.75} />
              </Button>
            </SheetTrigger>
            {showKeyWarning ? (
              <span
                aria-hidden
                className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-amber-500 ring-2 ring-background"
              />
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
