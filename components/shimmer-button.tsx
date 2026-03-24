"use client";

import type { ComponentProps } from "react";

import "./shimmer-button.css";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Magic UI 风格：主按钮扫光 */
export function ShimmerButton({
  className,
  ...props
}: ComponentProps<typeof Button>) {
  return (
    <Button
      className={cn(
        "relative isolate overflow-hidden rounded-3xl shadow-[0_12px_40px_-16px_hsl(var(--foreground)/0.25)] before:pointer-events-none before:absolute before:inset-0 before:z-0 before:content-[''] before:animate-[shimmer-sweep_2.4s_ease-in-out_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/35 before:to-transparent [&>*]:relative [&>*]:z-[1]",
        className,
      )}
      {...props}
    />
  );
}
