"use client";

import { AlertCircle, AlertTriangle } from "lucide-react";
import Editor from "react-simple-code-editor";

import type { AuditConflict } from "@/lib/logic-audit";
import { worstConflictOnLine } from "@/lib/logic-audit";

export type RefineMarkdownEditorProps = {
  value: string;
  onChange: (value: string) => void;
  conflicts: AuditConflict[];
  highlight: (code: string) => React.ReactNode;
};

export function RefineMarkdownEditor({
  value,
  onChange,
  conflicts,
  highlight,
}: RefineMarkdownEditorProps) {
  const lines = value.split(/\r?\n/);

  return (
    <div className="flex h-full min-h-0 w-full flex-1 overflow-auto font-mono text-[14px] leading-relaxed [&_pre]:!bg-transparent [&_pre]:!p-0 [&_pre]:!text-zinc-700 [&_textarea]:!bg-transparent [&_textarea]:!p-0 [&_textarea]:!text-zinc-800 [&_textarea]:caret-violet-500 [&_textarea]:selection:bg-violet-100/80">
      <div
        aria-hidden
        className="sticky left-0 z-10 shrink-0 select-none bg-zinc-50/40 py-4 pl-2 pr-1 text-[11px] text-zinc-400 shadow-[4px_0_12px_-8px_rgba(0,0,0,0.06)]"
      >
        {lines.map((_, i) => {
          const lineNo = i + 1;
          const worst = worstConflictOnLine(lineNo, conflicts);
          const title = worst?.reason;
          return (
            <div
              key={i}
              className="flex min-h-[1.625em] items-center justify-end gap-1"
              title={title}
            >
              <span className="tabular-nums">{lineNo}</span>
              {worst ? (
                worst.type === "Critical" ? (
                  <AlertCircle
                    className="size-3.5 shrink-0 text-[rgb(200,110,85)]"
                    strokeWidth={2}
                  />
                ) : (
                  <AlertTriangle
                    className="size-3.5 shrink-0 text-[rgb(210,140,100)]"
                    strokeWidth={2}
                  />
                )
              ) : (
                <span className="inline-block size-3.5 shrink-0" />
              )}
            </div>
          );
        })}
      </div>
      <div className="min-w-0 flex-1 py-4 pl-2 pr-3 shadow-[0_2px_16px_-6px_rgba(0,0,0,0.05)]">
        <Editor
          aria-label="Refined Markdown"
          className="block min-h-full w-full !overflow-visible outline-none"
          highlight={highlight}
          padding={0}
          style={{
            fontFamily:
              "var(--font-mono), ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
            whiteSpace: "pre",
            overflowWrap: "normal",
          }}
          value={value}
          onValueChange={onChange}
        />
      </div>
    </div>
  );
}
