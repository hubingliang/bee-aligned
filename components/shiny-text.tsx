"use client";

import { cn } from "@/lib/utils";

/** Magic UI 风格：渐变扫光，用于品牌名 */
export function ShinyText({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-block bg-[length:200%_auto] bg-clip-text font-bold tracking-tighter text-transparent",
        "bg-gradient-to-r from-foreground via-primary to-foreground",
        "animate-shiny",
        className,
      )}
    >
      {children}
    </span>
  );
}
