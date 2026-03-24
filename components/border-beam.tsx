"use client";

import "./border-beam.css";

import { cn } from "@/lib/utils";

/** Magic UI 风格：沿顶边的光束扫描（Loading / 强调） */
export function BorderBeam({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden rounded-3xl",
        className,
      )}
    >
      <div className="absolute top-0 h-[2px] w-[32%] animate-[beam-sweep_2.2s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-accent to-transparent opacity-90 [animation-fill-mode:both]" />
    </div>
  );
}
