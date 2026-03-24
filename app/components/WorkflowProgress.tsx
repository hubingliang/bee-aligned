"use client";

import { FileText } from "lucide-react";
import { Fragment } from "react";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const STEP_HEADLINE: Record<1 | 2 | 3, string> = {
  1: "步骤 1 · 导入原始需求",
  2: "步骤 2 · 整理需求稿（Markdown）",
  3: "步骤 3 · Prompt 手册（Logic Blueprint）",
};

function StepIndicator({
  active,
  className,
}: {
  active: 1 | 2 | 3;
  className?: string;
}) {
  const steps = [
    { n: 1 as const, label: "导入" },
    { n: 2 as const, label: "需求稿" },
    { n: 3 as const, label: "手册" },
  ];
  return (
    <nav
      aria-label="Workflow"
      className={cn(
        "flex w-full max-w-full flex-wrap items-center justify-center gap-2 rounded-full border border-border bg-muted/40 px-4 py-2.5 sm:w-auto sm:justify-center sm:gap-3 sm:px-5 sm:py-3",
        className,
      )}
    >
      {steps.map((s, i) => {
        const isActive = active === s.n;
        const isDone = active > s.n;
        return (
          <Fragment key={s.n}>
            {i > 0 ? (
              <span
                aria-hidden
                className="mx-0.5 text-3xl font-light leading-none text-muted-foreground/35 sm:text-4xl"
              >
                ·
              </span>
            ) : null}
            <div className="flex min-w-[3rem] flex-col items-center gap-1 sm:min-w-[3.25rem]">
              <span
                className={cn(
                  "flex size-10 items-center justify-center rounded-full text-base font-semibold tabular-nums sm:size-11 sm:text-lg",
                  isActive && "bg-primary text-primary-foreground shadow-sm",
                  isDone && !isActive && "bg-muted text-muted-foreground",
                  !isActive &&
                    !isDone &&
                    "border border-border bg-background text-muted-foreground",
                )}
              >
                {s.n}
              </span>
              <span
                className={cn(
                  "max-w-[4.25rem] text-center text-xs font-medium leading-tight text-muted-foreground sm:max-w-none sm:text-sm",
                  isActive && "text-foreground",
                )}
                title={s.n === 3 ? "Prompt 手册" : undefined}
              >
                {s.label}
              </span>
            </div>
          </Fragment>
        );
      })}
    </nav>
  );
}

function scrollToPromptHandbook() {
  document.getElementById("logic-blueprint")?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}

export type WorkflowProgressProps = {
  indicatorStep: 1 | 2 | 3;
  currentStep: 1 | 2 | 3;
};

export function WorkflowProgress({
  indicatorStep,
  currentStep,
}: WorkflowProgressProps) {
  const handbookEnabled = currentStep === 3;

  const handbookJumpButton = handbookEnabled ? (
    <Button
      type="button"
      variant="outline"
      size="default"
      className="h-9 shrink-0 gap-2 px-3 text-sm"
      onClick={scrollToPromptHandbook}
    >
      <FileText className="size-4" />
      Prompt 手册
    </Button>
  ) : (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex">
          <Button
            type="button"
            variant="outline"
            size="default"
            className="h-9 shrink-0 gap-2 px-3 text-sm"
            disabled
          >
            <FileText className="size-4 opacity-50" />
            Prompt 手册
          </Button>
        </span>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <p className="max-w-xs text-xs">
          完成「Vibe Check」生成 Prompt 手册后可跳转查看
        </p>
      </TooltipContent>
    </Tooltip>
  );

  return (
    <section
      aria-label="工作流进度"
      className="mb-4 shrink-0 rounded-xl border border-border/80 bg-muted/25 px-4 py-4 sm:px-6 sm:py-5"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <div className="min-w-0 sm:max-w-[min(100%,32rem)]">
          <p className="text-xs font-medium text-muted-foreground sm:text-sm">
            当前进度
          </p>
          <p className="mt-1 text-base font-semibold leading-snug text-foreground sm:text-lg">
            {STEP_HEADLINE[indicatorStep]}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2 sm:min-w-0 sm:flex-1 sm:justify-end">
          <StepIndicator active={indicatorStep} />
          {handbookJumpButton}
        </div>
      </div>
    </section>
  );
}
