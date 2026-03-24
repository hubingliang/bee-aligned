"use client";

import Link from "next/link";

import { RetroGrid } from "@/components/retro-grid";
import { ShinyText } from "@/components/shiny-text";
import { Button } from "@/components/ui/button";
import { BeeWaggleLogo } from "@/app/components/BeeWaggleLogo";

export function MarketingShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-dvh flex-col">
      <RetroGrid />
      <header className="sticky top-0 z-50 border-b border-border/80 bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4 sm:px-6 lg:h-16">
          <Link
            className="flex min-w-0 items-center gap-2 text-foreground"
            href="/"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-3xl bg-primary px-1.5 text-primary-foreground shadow-[0_8px_24px_-12px_hsl(var(--foreground)/0.32)]">
              <BeeWaggleLogo className="size-[22px]" />
            </span>
            <ShinyText className="truncate">Bee Waggle</ShinyText>
          </Link>
          <nav
            aria-label="站内导航"
            className="flex flex-wrap items-center justify-end gap-1 sm:gap-2"
          >
            <Button asChild size="sm" variant="ghost">
              <Link href="/getting-started">上手</Link>
            </Button>
            <Button asChild size="sm" variant="ghost">
              <Link href="/help">帮助</Link>
            </Button>
            <Button asChild className="shrink-0 rounded-3xl border-border/80 shadow-sm" size="sm">
              <Link href="/workspace">打开工作台</Link>
            </Button>
          </nav>
        </div>
      </header>
      <main className="relative z-[1] flex-1">{children}</main>
      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        <p>
          <Link className="underline-offset-4 hover:underline" href="/help">
            帮助中心
          </Link>
          <span className="mx-2 text-border">·</span>
          <Link
            className="underline-offset-4 hover:underline"
            href="/getting-started"
          >
            快速开始
          </Link>
        </p>
      </footer>
    </div>
  );
}
