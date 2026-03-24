"use client";

import type { ComponentProps } from "react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/** Magic UI 风格：渐变描边容器 */
export function MagicCard({
  className,
  children,
  ...props
}: ComponentProps<typeof Card>) {
  return (
    <div
      className={cn(
        "rounded-3xl bg-gradient-to-br from-accent/50 via-primary/[0.07] to-accent/40 p-px shadow-[0_20px_50px_-20px_hsl(var(--foreground)/0.12)]",
        className,
      )}
    >
      <Card
        className="rounded-[calc(1.5rem-1px)] border-0 bg-card shadow-none"
        {...props}
      >
        {children}
      </Card>
    </div>
  );
}
