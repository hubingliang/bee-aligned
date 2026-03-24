"use client";

import Link from "next/link";

import { ShinyText } from "@/components/shiny-text";
import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

export function MarketingShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4 sm:px-6 lg:h-16">
          <Link
            className="flex min-w-0 items-center gap-2 text-foreground"
            href="/"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Sparkles className="size-[18px]" strokeWidth={1.75} />
            </span>
            <ShinyText className="truncate">AlignSpec</ShinyText>
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
            <ModeToggle />
            <Button asChild className="shrink-0" size="sm">
              <Link href="/workspace">打开工作台</Link>
            </Button>
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
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
