"use client";

import { useMemo } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

function vibeFeedback(score: number): string {
  if (score <= 40) {
    return "逻辑密度偏低，可补充分支、数据结构与错误路径。";
  }
  if (score <= 70) {
    return "逻辑正在成型，建议在生成手册前补充约束与失败场景。";
  }
  return "逻辑密度高，可以生成执行手册。";
}

const RING_SIZE = 128;
const R = 52;
const CX = 64;
const CY = 64;
const CIRC = 2 * Math.PI * R;

export type VibeMeterProps = {
  score: number;
  suggestions: string[];
  className?: string;
};

export function VibeMeter({ score, suggestions, className }: VibeMeterProps) {
  const feedback = useMemo(() => vibeFeedback(score), [score]);
  const hints = useMemo(() => suggestions.slice(0, 2), [suggestions]);
  const t = Math.min(100, Math.max(0, score)) / 100;
  const strokeDashoffset = CIRC * (1 - t);
  const highGlow = score > 80;

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-2 text-center">
        <CardTitle className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Vibe · Logic Density
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="relative mx-auto flex aspect-square w-[min(100%,9rem)] items-center justify-center">
          <svg
            aria-hidden
            className="absolute inset-0 size-full -rotate-90"
            viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
          >
            <defs>
              <linearGradient id="vibe-ring" x1="0%" x2="100%" y1="0%" y2="100%">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.45" />
                <stop offset="100%" stopColor="hsl(var(--muted-foreground))" stopOpacity="0.35" />
              </linearGradient>
            </defs>
            <circle
              cx={CX}
              cy={CY}
              fill="none"
              r={R}
              className="stroke-border"
              strokeWidth="10"
            />
            <circle
              cx={CX}
              cy={CY}
              className="transition-[stroke-dashoffset] duration-500 ease-out"
              fill="none"
              r={R}
              stroke="url(#vibe-ring)"
              strokeDasharray={CIRC}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              strokeWidth="10"
              style={
                highGlow
                  ? {
                      filter:
                        "drop-shadow(0 0 8px hsl(var(--primary) / 0.35))",
                    }
                  : undefined
              }
            />
          </svg>

          <div
            aria-hidden
            className="relative z-[1] flex size-[4.5rem] flex-col items-center justify-center rounded-full border border-border bg-muted/50"
          >
            <span className="text-2xl font-bold tabular-nums tracking-tighter text-foreground">
              {score}
            </span>
            <span className="mt-0.5 text-[10px] font-medium tabular-nums text-muted-foreground">
              / 100
            </span>
          </div>
        </div>

        <CardDescription className="text-center text-sm leading-relaxed">
          {feedback}
        </CardDescription>

        {hints.length > 0 ? (
          <ul className="space-y-3 text-[12px] leading-relaxed text-muted-foreground">
            {hints.map((s, i) => (
              <li key={i} className="flex gap-3">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-muted-foreground/40" />
                <span>{s}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </CardContent>
    </Card>
  );
}
