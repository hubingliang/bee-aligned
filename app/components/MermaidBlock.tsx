"use client";

import mermaid from "mermaid";
import { useEffect, useId, useRef, useState } from "react";

let mermaidReady = false;

function ensureMermaid() {
  if (mermaidReady) return;
  mermaid.initialize({
    startOnLoad: false,
    theme: "neutral",
    securityLevel: "loose",
    fontFamily: "inherit",
  });
  mermaidReady = true;
}

export function MermaidBlock({ code }: { code: string }) {
  const uid = useId().replace(/:/g, "");
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let cancelled = false;
    ensureMermaid();

    const run = async () => {
      try {
        const id = `m-${uid}-${Math.random().toString(36).slice(2, 9)}`;
        const { svg } = await mermaid.render(id, code.trim());
        if (!cancelled && el) {
          el.innerHTML = svg;
          setError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Diagram error");
        }
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [code, uid]);

  if (error) {
    return (
      <div className="my-4 rounded-xl border border-amber-200/80 bg-amber-50/60 px-4 py-3 text-[13px] text-amber-900">
        {error}
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className="my-4 overflow-x-auto rounded-xl border border-zinc-100/80 bg-white/95 p-4 text-[13px] text-zinc-700 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.06)] [&_svg]:mx-auto [&_svg]:max-w-none"
    />
  );
}

MermaidBlock.displayName = "MermaidBlock";
