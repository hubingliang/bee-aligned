"use client";

import { cn } from "@/lib/utils";

type BeeWaggleLogoProps = {
  className?: string;
  title?: string;
};

/**
 * 蜜蜂徽标；置于 `bg-primary text-primary-foreground` 容器内以继承对比色。
 */
export function BeeWaggleLogo({ className, title = "Bee Waggle" }: BeeWaggleLogoProps) {
  return (
    <span className={cn("inline-flex shrink-0", className)} title={title}>
      <svg
        aria-hidden
        className="size-full"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* 翅翼 */}
        <ellipse
          cx="8"
          cy="11"
          rx="3.5"
          ry="2.2"
          fill="currentColor"
          opacity={0.28}
          transform="rotate(-22 8 11)"
        />
        <ellipse
          cx="16"
          cy="11"
          rx="3.5"
          ry="2.2"
          fill="currentColor"
          opacity={0.28}
          transform="rotate(22 16 11)"
        />
        {/* 腹部 */}
        <ellipse cx="12" cy="14" rx="5.5" ry="4.3" fill="currentColor" />
        <path
          d="M8.2 12.2h7.6M7.8 14.5h8.4M8.4 16.6h7.2"
          stroke="white"
          strokeOpacity={0.22}
          strokeWidth="1.2"
          strokeLinecap="round"
        />
        {/* 头胸 */}
        <circle cx="12" cy="8.8" r="3.6" fill="currentColor" />
        <circle cx="10.1" cy="8.2" r="0.75" fill="white" opacity={0.92} />
        <circle cx="13.9" cy="8.2" r="0.75" fill="white" opacity={0.92} />
        <path
          d="M9 6.2q-0.8-1.4-0.2-2.4M15 6.2q0.8-1.4 0.2-2.4"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinecap="round"
          opacity={0.85}
        />
      </svg>
    </span>
  );
}
