"use client";

import "./spec-protocol-enter.css";

import { SettingsForm } from "@/app/components/settings-form";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  Copy,
  Edit3,
  Loader2,
  Paperclip,
  RotateCw,
  Upload,
  Wand2,
} from "lucide-react";
import {
  Children,
  isValidElement,
  useCallback,
  useMemo,
  useRef,
  useState,
  useEffect,
  type ChangeEvent,
  type DragEvent,
} from "react";
import ReactMarkdown from "react-markdown";

import { BeeWaggleLogo } from "@/app/components/BeeWaggleLogo";
import { AppHeader } from "@/app/components/AppHeader";
import { WorkflowProgress } from "@/app/components/WorkflowProgress";
import { AlignmentAuditPanel } from "@/app/components/AlignmentAuditPanel";
import { MermaidBlock } from "@/app/components/MermaidBlock";
import { RefineMarkdownEditor } from "@/app/components/RefineMarkdownEditor";
import { VibeMeter } from "@/app/components/VibeMeter";
import { normalizeAzureOpenAiDeploymentId } from "@/lib/azure-openai-deployments";
import { formatMarkdown } from "@/lib/format-markdown";
import { type AuditConflict } from "@/lib/logic-audit";
import { cn } from "@/lib/utils";
import { calculateVibeScore } from "@/lib/vibe-scorer";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const STORAGE = {
  openai: "beealigned_openai_key",
  anthropic: "beealigned_anthropic_key",
  deepseek: "beealigned_deepseek_key",
  gemini: "beealigned_gemini_key",
  azureOpenaiEndpoint: "beealigned_azure_openai_endpoint",
  azureOpenaiKey: "beealigned_azure_openai_key",
  azureOpenaiDeployment: "beealigned_azure_openai_deployment",
} as const;

/** 兼容历史 localStorage key（alignspec_ / previbe_；当前为 bealigned_*） */
const STORAGE_LEGACY_ALIGN = {
  openai: "alignspec_openai_key",
  anthropic: "alignspec_anthropic_key",
  deepseek: "alignspec_deepseek_key",
  gemini: "alignspec_gemini_key",
  azureOpenaiEndpoint: "alignspec_azure_openai_endpoint",
  azureOpenaiKey: "alignspec_azure_openai_key",
  azureOpenaiDeployment: "alignspec_azure_openai_deployment",
} as const;

const STORAGE_LEGACY_PREV = {
  openai: "previbe_openai_key",
  anthropic: "previbe_anthropic_key",
  deepseek: "previbe_deepseek_key",
  gemini: "previbe_gemini_key",
  azureOpenaiEndpoint: "previbe_azure_openai_endpoint",
  azureOpenaiKey: "previbe_azure_openai_key",
  azureOpenaiDeployment: "previbe_azure_openai_deployment",
} as const;

function readStorageField(id: keyof typeof STORAGE): string {
  if (typeof window === "undefined") return "";
  const next = localStorage.getItem(STORAGE[id]);
  if (next != null && next.length > 0) return next;
  const legacyA = localStorage.getItem(STORAGE_LEGACY_ALIGN[id]);
  if (legacyA != null && legacyA.length > 0) return legacyA;
  return localStorage.getItem(STORAGE_LEGACY_PREV[id]) ?? "";
}

const MODEL_OPTIONS = [
  { value: "claude-3-5-sonnet-20241022", label: "Claude 3.5 Sonnet" },
  { value: "gpt-4o", label: "GPT-4o" },
  { value: "gpt-4o-mini", label: "GPT-4o-mini" },
  { value: "deepseek-v3", label: "DeepSeek-V3" },
  { value: "gemini-2.0-flash", label: "Gemini 2.0 Flash" },
  {
    value: "azure-openai",
    label: "Azure OpenAI（自填 Endpoint / 部署）",
  },
] as const;

const TARGET_ROLE_OPTIONS = [
  { value: "product" as const, label: "Product" },
  { value: "frontend" as const, label: "Frontend" },
  { value: "backend" as const, label: "Backend" },
];

type ModelId = (typeof MODEL_OPTIONS)[number]["value"];
type TargetRoleId = (typeof TARGET_ROLE_OPTIONS)[number]["value"];

type KeySlots = Partial<
  Record<
    | "openai"
    | "anthropic"
    | "deepseek"
    | "gemini"
    | "azureOpenaiEndpoint"
    | "azureOpenaiKey"
    | "azureOpenaiDeployment",
    string
  >
>;

function hasKeyForModel(model: ModelId, keys: KeySlots): boolean {
  const k = (slot: keyof KeySlots) => String(keys[slot] ?? "").trim();
  switch (model) {
    case "claude-3-5-sonnet-20241022":
      return Boolean(k("anthropic"));
    case "gpt-4o":
    case "gpt-4o-mini":
      return Boolean(k("openai"));
    case "deepseek-v3":
      return Boolean(k("deepseek"));
    case "gemini-2.0-flash":
      return Boolean(k("gemini"));
    case "azure-openai":
      return (
        Boolean(k("azureOpenaiEndpoint")) &&
        Boolean(k("azureOpenaiKey")) &&
        Boolean(k("azureOpenaiDeployment"))
      );
    default:
      return false;
  }
}

/** 当前所选模型对应的密钥槽位 */
function keySlotForModel(
  model: ModelId,
):
  | "openai"
  | "anthropic"
  | "deepseek"
  | "gemini"
  | "azureOpenai" {
  switch (model) {
    case "claude-3-5-sonnet-20241022":
      return "anthropic";
    case "gpt-4o":
    case "gpt-4o-mini":
      return "openai";
    case "deepseek-v3":
      return "deepseek";
    case "gemini-2.0-flash":
      return "gemini";
    case "azure-openai":
      return "azureOpenai";
    default:
      return "openai";
  }
}

const markdownComponents = {
  h1: ({ children }: { children?: React.ReactNode }) => (
    <h1 className="mb-4 mt-8 text-xl font-semibold tracking-tight text-foreground first:mt-0">
      {children}
    </h1>
  ),
  h2: ({ children }: { children?: React.ReactNode }) => (
    <h2 className="mb-3 mt-8 text-lg font-semibold tracking-tight text-foreground first:mt-0">
      {children}
    </h2>
  ),
  h3: ({ children }: { children?: React.ReactNode }) => (
    <h3 className="mb-2 mt-6 text-base font-semibold tracking-tight text-foreground first:mt-0">
      {children}
    </h3>
  ),
  p: ({ children }: { children?: React.ReactNode }) => (
    <p className="mb-4 text-[15px] font-normal leading-relaxed text-muted-foreground last:mb-0">
      {children}
    </p>
  ),
  ul: ({ children }: { children?: React.ReactNode }) => (
    <ul className="mb-4 list-disc space-y-2 pl-5 text-[15px] font-normal leading-relaxed text-muted-foreground">
      {children}
    </ul>
  ),
  ol: ({ children }: { children?: React.ReactNode }) => (
    <ol className="mb-4 list-decimal space-y-2 pl-5 text-[15px] font-normal leading-relaxed text-muted-foreground">
      {children}
    </ol>
  ),
  li: ({ children }: { children?: React.ReactNode }) => (
    <li className="marker:text-muted-foreground">{children}</li>
  ),
  strong: ({ children }: { children?: React.ReactNode }) => (
    <strong className="font-semibold text-foreground">{children}</strong>
  ),
  a: ({ href, children }: { href?: string; children?: React.ReactNode }) => (
    <a
      className="text-primary underline underline-offset-4 hover:text-primary/80"
      href={href}
      rel="noreferrer"
      target="_blank"
    >
      {children}
    </a>
  ),
  code: ({ children, className }: { children?: React.ReactNode; className?: string }) => {
    if (className?.includes("language-mermaid")) {
      return (
        <MermaidBlock code={String(children ?? "").replace(/\n$/, "")} />
      );
    }
    const isBlock = className?.includes("language-");
    if (isBlock) {
      return (
        <code className="font-mono text-sm text-foreground">{children}</code>
      );
    }
    return (
      <code className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[0.9em] text-foreground">
        {children}
      </code>
    );
  },
  pre: ({ children }: { children?: React.ReactNode }) => {
    const first = Children.toArray(children)[0];
    if (isValidElement(first) && first.type === MermaidBlock) {
      return first;
    }
    return (
      <pre className="mb-4 overflow-x-auto rounded-xl border border-border bg-muted/50 p-4 text-sm">
        {children}
      </pre>
    );
  },
  hr: () => <hr className="my-8 border-border" />,
  blockquote: ({ children }: { children?: React.ReactNode }) => (
    <blockquote className="mb-4 border-l-2 border-primary/30 pl-4 text-muted-foreground italic">
      {children}
    </blockquote>
  ),
};

export default function Page() {
  const [targetRole, setTargetRole] = useState<TargetRoleId>("product");
  const [model, setModel] = useState<ModelId>("gpt-4o-mini");

  const [apiKeys, setApiKeys] = useState({
    openai: "",
    anthropic: "",
    deepseek: "",
    gemini: "",
    azureOpenaiEndpoint: "",
    azureOpenaiKey: "",
    azureOpenaiDeployment: "gpt4o-mini",
  });
  const [keysHydrated, setKeysHydrated] = useState(false);

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [rawContent, setRawContent] = useState("");
  const [refinedMd, setRefinedMd] = useState("");

  const [markdown, setMarkdown] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cleanError, setCleanError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [specProtocolAchieved, setSpecProtocolAchieved] = useState(false);

  const [isParsingFile, setIsParsingFile] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

  const [auditConflicts, setAuditConflicts] = useState<AuditConflict[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setApiKeys({
      openai: readStorageField("openai"),
      anthropic: readStorageField("anthropic"),
      deepseek: readStorageField("deepseek"),
      gemini: readStorageField("gemini"),
      azureOpenaiEndpoint: readStorageField("azureOpenaiEndpoint"),
      azureOpenaiKey: readStorageField("azureOpenaiKey"),
      azureOpenaiDeployment: normalizeAzureOpenAiDeploymentId(
        readStorageField("azureOpenaiDeployment"),
      ),
    });
    setKeysHydrated(true);
  }, []);

  useEffect(() => {
    if (!keysHydrated) return;
    localStorage.setItem(STORAGE.openai, apiKeys.openai);
    localStorage.setItem(STORAGE.anthropic, apiKeys.anthropic);
    localStorage.setItem(STORAGE.deepseek, apiKeys.deepseek);
    localStorage.setItem(STORAGE.gemini, apiKeys.gemini);
    localStorage.setItem(
      STORAGE.azureOpenaiEndpoint,
      apiKeys.azureOpenaiEndpoint,
    );
    localStorage.setItem(STORAGE.azureOpenaiKey, apiKeys.azureOpenaiKey);
    localStorage.setItem(
      STORAGE.azureOpenaiDeployment,
      apiKeys.azureOpenaiDeployment,
    );
   }, [apiKeys, keysHydrated]);

  /** 只带当前模型对应的密钥头，避免误把 Gemini 密钥随 x-openai-key 发给 OpenAI */
  const apiHeaders = useMemo(() => {
    const slot = keySlotForModel(model);
    const base = {
      "Content-Type": "application/json",
      "x-openai-key": "",
      "x-anthropic-key": "",
      "x-deepseek-key": "",
      "x-gemini-key": "",
      "x-azure-openai-endpoint": "",
      "x-azure-openai-key": "",
      "x-azure-openai-deployment": "",
    } as const;
    switch (slot) {
      case "openai":
        return { ...base, "x-openai-key": apiKeys.openai };
      case "anthropic":
        return { ...base, "x-anthropic-key": apiKeys.anthropic };
      case "deepseek":
        return { ...base, "x-deepseek-key": apiKeys.deepseek };
      case "gemini":
        return { ...base, "x-gemini-key": apiKeys.gemini };
      case "azureOpenai":
        return {
          ...base,
          "x-azure-openai-endpoint": apiKeys.azureOpenaiEndpoint,
          "x-azure-openai-key": apiKeys.azureOpenaiKey,
          "x-azure-openai-deployment": apiKeys.azureOpenaiDeployment,
        };
      default:
        return { ...base };
    }
  }, [apiKeys, model]);

  const handleFileButtonClick = useCallback(() => {
    setParseError(null);
    fileInputRef.current?.click();
  }, []);

  const handleParseFile = useCallback(
    async (file: File) => {
      setParseError(null);
      setIsParsingFile(true);
      try {
        const body = new FormData();
        body.set("file", file);
        const res = await fetch("/api/parse", {
          method: "POST",
          body,
        });
        const data = (await res.json()) as { error?: string; content?: string };
        if (!res.ok) {
          throw new Error(data.error ?? "解析失败");
        }
        if (typeof data.content !== "string") {
          throw new Error("无效的响应");
        }
        setRawContent(data.content);
        setCurrentStep(1);
      } catch (err) {
        setParseError(
          err instanceof Error ? err.message : "解析失败，可手动粘贴内容",
        );
      } finally {
        setIsParsingFile(false);
      }
    },
    [],
  );

  const handleFileChange = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file) return;
      await handleParseFile(file);
    },
    [handleParseFile],
  );

  const handleDropOnZone = useCallback(
    async (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      const file = e.dataTransfer.files?.[0];
      if (!file) return;
      await handleParseFile(file);
    },
    [handleParseFile],
  );

  const handleClean = useCallback(async () => {
    setCleanError(null);
    setMarkdown(null);
    setIsCleaning(true);
    try {
      const res = await fetch("/api/clean", {
        method: "POST",
        headers: apiHeaders,
        body: JSON.stringify({
          rawContent,
          model,
        }),
      });

      const data = (await res.json()) as { error?: string; markdown?: string };

      if (!res.ok) {
        throw new Error(data.error ?? "Clean failed");
      }

      if (typeof data.markdown !== "string") {
        throw new Error("Invalid response");
      }

      setRefinedMd(data.markdown);
      setCurrentStep(2);
    } catch (e) {
      setCleanError(e instanceof Error ? e.message : "Clean failed");
    } finally {
      setIsCleaning(false);
    }
  }, [rawContent, model, apiHeaders]);

  const handleAutoFormat = useCallback(() => {
    setRefinedMd((prev) => formatMarkdown(prev));
  }, []);

  const handleBackToInput = useCallback(() => {
    setCurrentStep(1);
    setCleanError(null);
    setMarkdown(null);
    setError(null);
    setAuditConflicts([]);
    setAuditError(null);
  }, []);

  const handleBackToRefine = useCallback(() => {
    setCurrentStep(2);
    setError(null);
  }, []);

  const handleGenerate = useCallback(async () => {
    setIsGenerating(true);
    setError(null);
    setMarkdown(null);
    setCopied(false);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: apiHeaders,
        body: JSON.stringify({
          prdContent: refinedMd,
          model,
          targetRole,
        }),
      });

      const data = (await res.json()) as { error?: string; markdown?: string };

      if (!res.ok) {
        throw new Error(data.error ?? "Request failed");
      }

      if (typeof data.markdown !== "string") {
        throw new Error("Invalid response");
      }

      setMarkdown(data.markdown);
      setCurrentStep(3);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setIsGenerating(false);
    }
  }, [refinedMd, model, targetRole, apiHeaders]);

  const handleCopy = useCallback(async () => {
    if (!markdown) return;
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setSpecProtocolAchieved(true);
      window.setTimeout(() => setCopied(false), 2000);
      window.setTimeout(() => setSpecProtocolAchieved(false), 3200);
    } catch {
      setError("Unable to copy to clipboard");
    }
  }, [markdown]);

  /** 生成中仍停留在步骤 2（需求稿），避免与主内容「还在第 2 屏」不一致 */
  const indicatorStep: 1 | 2 | 3 =
    isGenerating && currentStep === 2 ? 2 : currentStep;

  const keyReady = hasKeyForModel(model, apiKeys);
  const showKeyWarning = keysHydrated && !keyReady;

  const cleanActionDisabled =
    isCleaning ||
    isParsingFile ||
    !rawContent.trim() ||
    isGenerating ||
    showKeyWarning;

  useEffect(() => {
    if (currentStep !== 2) {
      return;
    }
    const md = refinedMd.trim();
    if (!md) {
      setAuditConflicts([]);
      setAuditError(null);
      setAuditLoading(false);
      return;
    }
    if (!keyReady) {
      setAuditLoading(false);
      setAuditConflicts([]);
      setAuditError(null);
      return;
    }

    const ac = new AbortController();
    const timer = window.setTimeout(() => {
      void (async () => {
        setAuditLoading(true);
        setAuditError(null);
        try {
          const res = await fetch("/api/audit", {
            method: "POST",
            headers: apiHeaders,
            body: JSON.stringify({ refinedMd, model }),
            signal: ac.signal,
          });
          const data = (await res.json()) as {
            error?: string;
            conflicts?: AuditConflict[];
          };
          if (!res.ok) {
            throw new Error(data.error ?? "Audit failed");
          }
          setAuditConflicts(Array.isArray(data.conflicts) ? data.conflicts : []);
        } catch (e) {
          if (e instanceof Error && e.name === "AbortError") {
            return;
          }
          setAuditError(e instanceof Error ? e.message : "Audit failed");
          setAuditConflicts([]);
        } finally {
          if (!ac.signal.aborted) {
            setAuditLoading(false);
          }
        }
      })();
    }, 1000);

    return () => {
      window.clearTimeout(timer);
      ac.abort();
    };
  }, [refinedMd, currentStep, model, keyReady, apiHeaders]);

  const codeHighlight = useCallback((code: string) => {
    return (
      <span className="block whitespace-pre text-[14px] leading-relaxed text-foreground">
        {code}
      </span>
    );
  }, []);

  const { score: vibeScore, suggestions: vibeSuggestions } = useMemo(
    () => calculateVibeScore(refinedMd, auditConflicts),
    [refinedMd, auditConflicts],
  );

  /** 主生成：仅在有需求稿正文或请求进行中时限制；不因 Alignment Audit Critical / 未配 Key 禁用 */
  const vibeGenerateDisabled = isGenerating || !refinedMd.trim();

  const handleVibeCheckClick = useCallback(() => {
    if (vibeScore < 30) {
      setLowVibeConfirmOpen(true);
      return;
    }
    void handleGenerate();
  }, [vibeScore, handleGenerate]);

  const confirmLowVibeGenerate = useCallback(() => {
    setLowVibeConfirmOpen(false);
    void handleGenerate();
  }, [handleGenerate]);

  const activeKeySlot = keySlotForModel(model);

  const [panelDir, setPanelDir] = useState<"horizontal" | "vertical">("vertical");
  const [lowVibeConfirmOpen, setLowVibeConfirmOpen] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const u = () => setPanelDir(mq.matches ? "horizontal" : "vertical");
    u();
    mq.addEventListener("change", u);
    return () => mq.removeEventListener("change", u);
  }, []);

  return (
    <Sheet>
      <div className="relative flex h-dvh flex-col overflow-hidden text-foreground">
        <AppHeader
          model={model}
          modelOptions={MODEL_OPTIONS}
          showKeyWarning={showKeyWarning}
          onModelChange={(v) => setModel(v as ModelId)}
        />

        {showKeyWarning ? (
          <Alert className="rounded-none border-x-0 border-t-0 border-amber-200/80 bg-amber-50/90 py-2.5 text-center dark:border-amber-900/50 dark:bg-amber-950/40">
            <AlertDescription className="text-xs text-amber-950 dark:text-amber-100">
              请在设置中配置当前模型所需的 API Key；密钥仅保存在本机浏览器。
            </AlertDescription>
          </Alert>
        ) : null}

        <main className="relative z-[1] mx-auto flex min-h-0 w-full max-w-[1600px] flex-1 flex-col overflow-hidden px-6 pb-28 pt-4 lg:px-10 lg:pb-36 lg:pt-6">
          <WorkflowProgress
            currentStep={currentStep}
            indicatorStep={indicatorStep}
          />
          <ResizablePanelGroup
            className="min-h-0 flex-1 gap-2 rounded-[24px] lg:gap-3"
            orientation={panelDir}
          >
            <ResizablePanel className="min-h-0 min-w-0" defaultSize={58} minSize={32}>
              <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-[24px] bg-card p-6 shadow-sm ring-1 ring-border/60 lg:p-8">
              {currentStep === 1 ? (
                <div
                  key="stage-input"
                  className="flex min-h-0 flex-1 flex-col overflow-hidden"
                >
                  <input
                    ref={fileInputRef}
                    accept=".pdf,.docx,.md,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                    className="hidden"
                    tabIndex={-1}
                    type="file"
                    onChange={handleFileChange}
                  />
                  <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                    <div className="mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col gap-6 overflow-hidden">
                      <div className="shrink-0">
                        <h2 className="text-lg font-semibold tracking-tight text-foreground">
                          导入原始需求
                        </h2>
                        <p className="mt-1 text-sm font-normal text-muted-foreground">
                          拖拽文件到下方区域，或直接粘贴 PRD / 会议记录。
                        </p>
                      </div>
                      <div
                        className={cn(
                          "flex min-h-[140px] shrink-0 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-muted/30 px-6 py-8 text-center transition hover:bg-muted/50 sm:min-h-[180px] sm:py-10",
                          isParsingFile && "pointer-events-none opacity-70",
                        )}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        onDrop={handleDropOnZone}
                        onClick={handleFileButtonClick}
                        role="presentation"
                      >
                        <div className="flex size-12 items-center justify-center rounded-2xl bg-muted text-primary">
                          <Upload className="size-6" strokeWidth={1.5} />
                        </div>
                        <p className="mt-4 text-sm font-semibold text-foreground">
                          拖放 PDF、Word、Markdown 或纯文本
                        </p>
                        <p className="mt-1 text-xs font-normal text-muted-foreground">
                          也可点击此区域从本机选择文件
                        </p>
                        <Button
                          className="mt-5 rounded-full border border-border shadow-sm"
                          size="sm"
                          type="button"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFileButtonClick();
                          }}
                        >
                          <Paperclip className="size-3.5" strokeWidth={2} />
                          选择文件
                        </Button>
                      </div>
                      {isParsingFile ? (
                        <div className="shrink-0 space-y-2">
                          <div className="h-0.5 w-full overflow-hidden rounded-full bg-muted">
                            <div className="h-full w-full max-w-[45%] animate-pulse rounded-full bg-primary/40" />
                          </div>
                          <p className="text-[11px] font-medium tracking-wide text-muted-foreground">
                            Reading file...
                          </p>
                        </div>
                      ) : null}
                      {parseError ? (
                        <p className="shrink-0 text-xs leading-relaxed text-destructive">
                          {parseError}
                        </p>
                      ) : null}
                      {cleanError ? (
                        <p className="shrink-0 text-xs leading-relaxed text-destructive">
                          {cleanError}
                        </p>
                      ) : null}
                      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                        <Textarea
                          className="min-h-0 flex-1 resize-none overflow-y-auto rounded-xl text-[15px] leading-relaxed"
                          placeholder="或在此粘贴原始 PRD / notes…（PDF 等导入后在此滚动查看）"
                          spellCheck={false}
                          value={rawContent}
                          onChange={(e) => setRawContent(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              {currentStep === 2 ? (
                <div
                  key="stage-refine"
                  className="flex min-h-0 flex-1 flex-col gap-5 overflow-hidden"
                >
                  <div className="shrink-0">
                    <div className="flex items-center gap-2">
                      <Edit3
                        className="size-4 shrink-0 text-primary"
                        strokeWidth={1.75}
                      />
                      <h2 className="text-lg font-semibold tracking-tight text-foreground">
                        整理需求稿（Markdown）
                      </h2>
                    </div>
                    <p className="mt-1 text-sm font-normal text-muted-foreground">
                      编辑右侧 Alignment Audit 提示，直至 Vibe 与冲突状态满意。
                    </p>
                  </div>
                  <div
                    className={cn(
                      "min-h-0 flex-1 overflow-hidden rounded-xl border border-border bg-card shadow-sm",
                      isGenerating && "pointer-events-none opacity-50",
                    )}
                  >
                    <RefineMarkdownEditor
                      conflicts={auditConflicts}
                      highlight={codeHighlight}
                      value={refinedMd}
                      onChange={setRefinedMd}
                    />
                  </div>
                  {cleanError ? (
                    <p className="text-xs leading-relaxed text-destructive">
                      {cleanError}
                    </p>
                  ) : null}
                </div>
              ) : null}

              {currentStep === 3 ? (
                <div
                  key="stage-prompt-preview"
                  className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden"
                >
                  <div className="shrink-0">
                    <h2 className="text-lg font-semibold tracking-tight text-foreground">
                      需求稿预览
                    </h2>
                    <p className="mt-1 text-sm font-normal text-muted-foreground">
                      生成 Final Spec 前的最终 Markdown（只读预览）。
                    </p>
                  </div>
                  <Card className="min-h-0 flex-1 gap-0 py-0">
                    <CardContent className="min-h-0 flex-1 overflow-y-auto p-6 text-sm">
                      <ReactMarkdown components={markdownComponents}>
                        {refinedMd || "_暂无内容_"}
                      </ReactMarkdown>
                    </CardContent>
                  </Card>
                </div>
              ) : null}
              </section>
            </ResizablePanel>

            <ResizableHandle
              className="bg-border/70 [&::after]:bg-gradient-to-b [&::after]:from-accent/20 [&::after]:via-accent [&::after]:to-accent/20 [&::after]:shadow-[0_0_12px_hsla(51,100%,50%,0.22)]"
              withHandle
            />

            <ResizablePanel className="min-h-0 min-w-0" defaultSize={42} minSize={28}>
              <aside className="flex h-full min-h-0 flex-col gap-6 overflow-hidden rounded-[24px] border border-border/70 bg-muted/30 p-6 lg:p-8">
              {currentStep === 1 ? (
                <div className="flex flex-1 flex-col justify-center gap-4">
                  <h3 className="text-sm font-semibold text-foreground">
                    三步工作流
                  </h3>
                  <ul className="space-y-3 text-sm font-normal leading-relaxed text-muted-foreground">
                    <li className="flex gap-2">
                      <span className="font-semibold text-primary">1.</span>
                      Clean：将杂乱输入转为结构化需求稿（Markdown）。
                    </li>
                    <li className="flex gap-2">
                      <span className="font-semibold text-primary">2.</span>
                      需求稿：对照 Alignment Audit 与 Vibe 分数打磨内容。
                    </li>
                    <li className="flex gap-2">
                      <span className="font-semibold text-primary">3.</span>
                      Vibe Check：生成面向{" "}
                      {TARGET_ROLE_OPTIONS.find((o) => o.value === targetRole)
                        ?.label ?? targetRole}{" "}
                      的 Final Spec（Logic Blueprint）。
                    </li>
                  </ul>
                  <p className="text-xs font-normal leading-relaxed text-muted-foreground">
                    角色与完整模型列表可在右上角「设置」中调整。
                  </p>
                </div>
              ) : null}

              {currentStep === 2 && isGenerating ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-6 rounded-2xl border border-border bg-card py-16">
                  <div className="flex items-center gap-2">
                    <span className="size-2 animate-pulse rounded-full bg-primary [animation-delay:0ms]" />
                    <span className="size-2 animate-pulse rounded-full bg-primary/60 [animation-delay:150ms]" />
                    <span className="size-2 animate-pulse rounded-full bg-muted-foreground/40 [animation-delay:300ms]" />
                  </div>
                  <p className="text-xs font-medium tracking-[0.2em] text-muted-foreground">
                    Generating blueprint
                  </p>
                </div>
              ) : null}

              {currentStep === 2 && !isGenerating ? (
                <div className="flex min-h-0 flex-1 flex-col gap-8">
                  <VibeMeter
                    className="w-full shrink-0"
                    score={vibeScore}
                    suggestions={vibeSuggestions}
                  />
                  <div className="min-h-0 flex-1 overflow-y-auto">
                    <AlignmentAuditPanel
                      apiHeaders={apiHeaders}
                      conflicts={auditConflicts}
                      error={auditError}
                      keyReady={keyReady}
                      loading={auditLoading}
                      model={model}
                      refinedMd={refinedMd}
                    />
                  </div>
                </div>
              ) : null}

              {currentStep === 3 ? (
                <div
                  className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden"
                  id="logic-blueprint"
                >
                  <div className="flex shrink-0 flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">
                        Final Spec（Logic Blueprint）
                      </h3>
                      <p className="mt-0.5 text-xs font-normal text-muted-foreground">
                        文档内章节标题为 Logic Blueprint；面向 Cursor，支持 Mermaid。
                      </p>
                    </div>
                    {markdown ? (
                      <Button
                        aria-label={copied ? "已复制" : "复制全文"}
                        className="shrink-0"
                        size="sm"
                        type="button"
                        variant="outline"
                        onClick={handleCopy}
                      >
                        {copied ? (
                          <Check className="size-3.5 text-primary" strokeWidth={2} />
                        ) : (
                          <Copy className="size-3.5" strokeWidth={2} />
                        )}
                        {copied ? "已复制" : "复制"}
                      </Button>
                    ) : null}
                  </div>

                  {specProtocolAchieved ? (
                    <div
                      role="status"
                      className="animate-spec-protocol flex w-full shrink-0 items-center justify-center gap-2 rounded-xl border border-emerald-500/45 bg-emerald-500/[0.12] px-4 py-3 text-sm font-semibold tracking-tight text-emerald-800 shadow-sm dark:border-emerald-400/35 dark:bg-emerald-950/40 dark:text-emerald-200"
                    >
                      <Check
                        aria-hidden
                        className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400"
                        strokeWidth={2.5}
                      />
                      Spec Protocol Achieved
                    </div>
                  ) : null}

                  <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                    {error ? (
                      <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-10 text-center">
                        <p className="text-sm text-destructive">{error}</p>
                      </div>
                    ) : null}

                    {markdown ? (
                      <Card className="min-h-0 flex-1 gap-0 border py-0 shadow-none">
                        <CardContent className="min-h-0 flex-1 overflow-y-auto p-5 text-sm">
                          <ReactMarkdown components={markdownComponents}>
                            {markdown}
                          </ReactMarkdown>
                        </CardContent>
                      </Card>
                    ) : null}

                    {!markdown && !error ? (
                      <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-12 text-center">
                        <p className="text-sm font-normal text-muted-foreground">
                          等待 Final Spec…
                        </p>
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : null}
              </aside>
            </ResizablePanel>
          </ResizablePanelGroup>
        </main>

        {(currentStep === 1 || currentStep === 2 || currentStep === 3) &&
        !isGenerating ? (
          <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-6 pt-4">
            <div
              className="pointer-events-auto flex max-w-[min(100%,44rem)] flex-wrap items-center justify-center gap-2.5 rounded-2xl border-2 border-border/90 bg-card/95 px-4 py-3.5 shadow-xl ring-1 ring-primary/15 backdrop-blur-md sm:gap-3 sm:px-5 sm:py-4 dark:bg-card/90"
              role="toolbar"
              aria-label="主操作"
            >
              {currentStep === 1 ? (
                <>
                  {showKeyWarning ? (
                    <span
                      className="inline-flex shrink-0"
                      title="请先在设置中填写 API Key"
                      aria-label="请先在设置中填写 API Key"
                      role="img"
                    >
                      <AlertTriangle
                        aria-hidden
                        className="size-4 text-amber-600/90"
                        strokeWidth={2}
                      />
                    </span>
                  ) : null}
                  {showKeyWarning ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="inline-flex">
                          <Button
                            aria-busy={isCleaning}
                            className="h-11 min-h-[44px] min-w-[min(100%,17rem)] gap-2 rounded-full px-8 text-sm font-semibold shadow-md"
                            disabled={cleanActionDisabled}
                            type="button"
                            variant="default"
                            onClick={handleClean}
                          >
                            {isCleaning ? (
                              <>
                                <Loader2
                                  aria-hidden
                                  className="size-5 shrink-0 animate-spin"
                                />
                                正在整理为 Markdown…
                              </>
                            ) : (
                              <>
                                <Wand2
                                  className="size-5 shrink-0 opacity-95"
                                  strokeWidth={1.75}
                                />
                                Clean to Markdown
                              </>
                            )}
                          </Button>
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        <p className="max-w-xs text-xs">
                          请先在设置中配置当前模型所需的 API Key
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <Button
                      aria-busy={isCleaning}
                      className="h-11 min-h-[44px] min-w-[min(100%,17rem)] gap-2 rounded-full px-8 text-sm font-semibold shadow-md"
                      disabled={cleanActionDisabled}
                      type="button"
                      variant="default"
                      onClick={handleClean}
                    >
                      {isCleaning ? (
                        <>
                          <Loader2
                            aria-hidden
                            className="size-5 shrink-0 animate-spin"
                          />
                          正在整理为 Markdown…
                        </>
                      ) : (
                        <>
                          <Wand2
                            className="size-5 shrink-0 opacity-95"
                            strokeWidth={1.75}
                          />
                          Clean to Markdown
                        </>
                      )}
                    </Button>
                  )}
                </>
              ) : currentStep === 2 ? (
                <>
                  <Button
                    className="rounded-full text-muted-foreground"
                    size="sm"
                    type="button"
                    variant="outline"
                    onClick={handleAutoFormat}
                  >
                    Auto format
                  </Button>
                  <Button
                    className="rounded-full text-muted-foreground"
                    size="sm"
                    type="button"
                    variant="ghost"
                    onClick={handleBackToInput}
                  >
                    Back to input
                  </Button>
                  {showKeyWarning ? (
                    <span
                      className="inline-flex shrink-0"
                      title="请先在设置中填写 API Key"
                      aria-label="请先在设置中填写 API Key"
                      role="img"
                    >
                      <AlertTriangle
                        aria-hidden
                        className="size-4 text-amber-600/90"
                        strokeWidth={2}
                      />
                    </span>
                  ) : null}
                  <Button
                    className={cn(
                      "h-11 min-h-[44px] min-w-[min(100%,17rem)] gap-2 rounded-full px-8 text-sm font-semibold shadow-md",
                      vibeScore < 30 && "opacity-50",
                    )}
                    disabled={vibeGenerateDisabled}
                    type="button"
                    variant="default"
                    onClick={handleVibeCheckClick}
                  >
                    <BeeWaggleLogo className="size-5 shrink-0 opacity-95" />
                    Vibe Check (Generate Prompt)
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    className="rounded-full text-muted-foreground"
                    size="sm"
                    type="button"
                    variant="outline"
                    onClick={handleBackToRefine}
                  >
                    <ArrowLeft className="size-4" strokeWidth={2} />
                    返回需求稿
                  </Button>
                  <Button
                    className={cn(
                      "h-11 min-h-[44px] min-w-[min(100%,17rem)] gap-2 rounded-full px-8 text-sm font-semibold shadow-md",
                      vibeScore < 30 && "opacity-50",
                    )}
                    disabled={vibeGenerateDisabled}
                    type="button"
                    variant="default"
                    onClick={handleVibeCheckClick}
                  >
                    <RotateCw className="size-5 shrink-0" strokeWidth={2} />
                    重新生成 Final Spec
                  </Button>
                </>
              )}
            </div>
          </div>
        ) : null}

        {isGenerating ? (
          <div
            aria-live="polite"
            className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-6 pt-4"
            role="status"
          >
            <div className="flex min-w-[min(100%,26rem)] items-center justify-center gap-3 rounded-2xl border-2 border-primary/35 bg-primary/12 px-6 py-4 shadow-xl backdrop-blur-md dark:bg-primary/20">
              <Loader2
                aria-hidden
                className="size-7 shrink-0 animate-spin text-primary"
              />
              <p className="text-base font-semibold text-foreground">
                正在生成 Final Spec…
              </p>
            </div>
          </div>
        ) : null}

        <AlertDialog
          open={lowVibeConfirmOpen}
          onOpenChange={setLowVibeConfirmOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Vibe 分数偏低</AlertDialogTitle>
              <AlertDialogDescription>
                当前逻辑密度偏低，生成 Final Spec 时模型可能过度推断。是否仍要继续生成？
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>取消</AlertDialogCancel>
              <AlertDialogAction onClick={confirmLowVibeGenerate}>
                继续生成
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <SheetContent className="flex w-full flex-col gap-0 overflow-y-auto sm:max-w-md">
          <SheetHeader className="text-left">
            <SheetTitle>配置</SheetTitle>
            <SheetDescription>
              选择模型与角色；密钥仅保存在本机浏览器，经请求头发往你的服务端。
            </SheetDescription>
          </SheetHeader>
          <div className="px-4 pb-4">
            <SettingsForm
              activeKeySlot={activeKeySlot}
              apiKeys={apiKeys}
              model={model}
              modelOptions={MODEL_OPTIONS}
              setApiKeys={setApiKeys}
              targetRole={targetRole}
              targetRoleOptions={TARGET_ROLE_OPTIONS}
              onModelChange={(v) => setModel(v as ModelId)}
              onTargetRoleChange={(v) => setTargetRole(v as TargetRoleId)}
            />
          </div>
          <SheetFooter>
            <SheetClose asChild>
              <Button className="w-full" type="button">
                完成
              </Button>
            </SheetClose>
          </SheetFooter>
        </SheetContent>
      </div>
    </Sheet>
  );

}
