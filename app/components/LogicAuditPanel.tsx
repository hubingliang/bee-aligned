"use client";

import { AlertCircle, Loader2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

import type { AuditConflict } from "@/lib/logic-audit";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const markdownComponents = {
  p: ({ children }: { children?: React.ReactNode }) => (
    <p className="mb-2 text-[13px] leading-relaxed text-muted-foreground last:mb-0">
      {children}
    </p>
  ),
  ul: ({ children }: { children?: React.ReactNode }) => (
    <ul className="mb-2 list-disc space-y-1 pl-4 text-[13px] text-muted-foreground">
      {children}
    </ul>
  ),
  ol: ({ children }: { children?: React.ReactNode }) => (
    <ol className="mb-2 list-decimal space-y-1 pl-4 text-[13px] text-muted-foreground">
      {children}
    </ol>
  ),
  li: ({ children }: { children?: React.ReactNode }) => (
    <li className="marker:text-muted-foreground">{children}</li>
  ),
  strong: ({ children }: { children?: React.ReactNode }) => (
    <strong className="font-semibold text-foreground">{children}</strong>
  ),
  code: ({ children }: { children?: React.ReactNode }) => (
    <code className="rounded bg-muted px-1 font-mono text-[12px] text-foreground">
      {children}
    </code>
  ),
};

function ConflictAlert({
  c,
  onExplain,
  explainLoading,
}: {
  c: AuditConflict;
  onExplain: () => void;
  explainLoading: boolean;
}) {
  const isCrit = c.type === "Critical";
  return (
    <Alert
      className={
        isCrit
          ? undefined
          : "border-orange-200/60 bg-orange-50/60 text-orange-950 dark:border-orange-900/50 dark:bg-orange-950/30 dark:text-orange-100"
      }
      variant={isCrit ? "destructive" : "default"}
    >
      <AlertCircle
        className={cn(
          "size-4 shrink-0",
          isCrit ? "text-destructive" : "text-orange-700 dark:text-orange-300",
        )}
      />
      <AlertTitle className="text-[11px] font-semibold uppercase tracking-wide">
        L{c.line} · {c.type}
      </AlertTitle>
      <AlertDescription
        className={cn(
          "text-[12px] leading-relaxed [&_button]:mt-3",
          !isCrit && "text-orange-900/90 dark:text-orange-100/90",
        )}
      >
        <p>{c.reason}</p>
        <Button
          disabled={explainLoading}
          size="sm"
          type="button"
          variant={isCrit ? "secondary" : "secondary"}
          onClick={onExplain}
        >
          Explain Conflict
        </Button>
      </AlertDescription>
    </Alert>
  );
}

export type LogicAuditPanelProps = {
  conflicts: AuditConflict[];
  loading: boolean;
  error: string | null;
  keyReady: boolean;
  refinedMd: string;
  model: string;
  apiHeaders: Record<string, string>;
  className?: string;
};

export function LogicAuditPanel({
  conflicts,
  loading,
  error,
  keyReady,
  refinedMd,
  model,
  apiHeaders,
  className,
}: LogicAuditPanelProps) {
  const [explainOpen, setExplainOpen] = useState(false);
  const [explainLoading, setExplainLoading] = useState(false);
  const [explainText, setExplainText] = useState<string | null>(null);
  const [explainTarget, setExplainTarget] = useState<AuditConflict | null>(null);
  const [explainError, setExplainError] = useState<string | null>(null);
  const prevConflictLen = useRef(0);

  const handleExplain = useCallback(
    async (c: AuditConflict) => {
      setExplainTarget(c);
      setExplainText(null);
      setExplainError(null);
      setExplainOpen(true);
      setExplainLoading(true);
      try {
        const res = await fetch("/api/audit/explain", {
          method: "POST",
          headers: apiHeaders,
          body: JSON.stringify({
            refinedMd,
            model,
            conflict: c,
          }),
        });
        const data = (await res.json()) as { error?: string; markdown?: string };
        if (!res.ok) {
          throw new Error(data.error ?? "Explain failed");
        }
        if (typeof data.markdown !== "string") {
          throw new Error("Invalid response");
        }
        setExplainText(data.markdown);
      } catch (e) {
        setExplainError(e instanceof Error ? e.message : "Explain failed");
      } finally {
        setExplainLoading(false);
      }
    },
    [apiHeaders, refinedMd, model],
  );

  useEffect(() => {
    if (loading || !keyReady) {
      return;
    }
    if (conflicts.length > prevConflictLen.current && conflicts.length > 0) {
      const delta = conflicts.length - prevConflictLen.current;
      toast.warning("逻辑审计", {
        description:
          prevConflictLen.current === 0
            ? `检测到 ${conflicts.length} 处潜在冲突`
            : `新增 ${delta} 处冲突，当前共 ${conflicts.length} 处`,
      });
    }
    prevConflictLen.current = conflicts.length;
  }, [conflicts, loading, keyReady]);

  const criticalCount = conflicts.filter((x) => x.type === "Critical").length;
  const warningCount = conflicts.filter((x) => x.type === "Warning").length;

  return (
    <>
      <div
        className={cn(
          "flex flex-col gap-2.5 lg:sticky lg:top-8 lg:max-h-[calc(100dvh-8rem)] lg:overflow-y-auto lg:pr-1",
          className,
        )}
      >
        <div className="mb-0.5 flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Logic Audit
          </span>
          {loading ? (
            <Loader2
              aria-label="Auditing"
              className="size-3.5 animate-spin text-muted-foreground"
            />
          ) : null}
          {!loading && conflicts.length > 0 ? (
            <span className="flex flex-wrap items-center gap-1.5 text-[10px] text-orange-800/90 dark:text-orange-200/90">
              {criticalCount > 0 ? (
                <span className="rounded-full bg-orange-100/90 px-2 py-0.5 text-orange-900 dark:bg-orange-900/50 dark:text-orange-100">
                  {criticalCount} Critical
                </span>
              ) : null}
              {warningCount > 0 ? (
                <span className="rounded-full bg-orange-50 px-2 py-0.5 text-orange-800 dark:bg-orange-950/40 dark:text-orange-100">
                  {warningCount} Warning
                </span>
              ) : null}
            </span>
          ) : null}
          {!loading && conflicts.length === 0 && keyReady && refinedMd.trim() ? (
            <span className="text-[11px] text-muted-foreground">No conflicts</span>
          ) : null}
        </div>

        {!keyReady ? (
          <Alert className="border-dashed">
            <AlertDescription className="text-[11px] leading-relaxed">
              Configure an API key in Settings to run Logic Audit.
            </AlertDescription>
          </Alert>
        ) : null}
        {keyReady && error ? (
          <Alert variant="destructive">
            <AlertDescription className="text-[11px] leading-relaxed">
              {error}
            </AlertDescription>
          </Alert>
        ) : null}
        {keyReady && !error && conflicts.length === 0 && !loading && refinedMd.trim() ? (
          <Alert className="border-orange-200/40 bg-orange-50/40 dark:border-orange-900/40 dark:bg-orange-950/25">
            <AlertDescription className="text-[11px] leading-relaxed text-orange-900/90 dark:text-orange-100/90">
              审计未发现冲突；内容变更约 2 秒后会重新检查。
            </AlertDescription>
          </Alert>
        ) : null}
        {keyReady && conflicts.length > 0 ? (
          <div className="flex flex-col gap-2.5">
            {conflicts.map((c, idx) => (
              <ConflictAlert
                key={`${c.line}-${c.type}-${idx}`}
                c={c}
                explainLoading={explainLoading}
                onExplain={() => void handleExplain(c)}
              />
            ))}
          </div>
        ) : null}
      </div>

      <Dialog open={explainOpen} onOpenChange={setExplainOpen}>
        <DialogContent className="flex max-h-[min(90dvh,28rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-md">
          <DialogHeader className="shrink-0 border-b px-5 py-4">
            <DialogTitle>
              {explainTarget
                ? `Explain · L${explainTarget.line} (${explainTarget.type})`
                : "Explain conflict"}
            </DialogTitle>
            <DialogDescription className="sr-only">
              AI-generated explanation for the selected conflict.
            </DialogDescription>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
            {explainLoading ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Generating explanation…
              </div>
            ) : null}
            {explainError ? (
              <p className="text-xs leading-relaxed text-destructive">{explainError}</p>
            ) : null}
            {explainText && !explainLoading ? (
              <div className="text-[13px] text-muted-foreground">
                <ReactMarkdown components={markdownComponents}>{explainText}</ReactMarkdown>
              </div>
            ) : null}
          </div>
          <DialogFooter className="shrink-0 border-t px-5 py-3">
            <Button type="button" variant="secondary" onClick={() => setExplainOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
