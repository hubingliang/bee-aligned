"use client";

import type { Dispatch, SetStateAction } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type ApiKeysState = {
  openai: string;
  anthropic: string;
  deepseek: string;
  gemini: string;
};

type SettingsFormProps = {
  model: string;
  onModelChange: (v: string) => void;
  modelOptions: readonly { value: string; label: string }[];
  targetRole: string;
  onTargetRoleChange: (v: string) => void;
  targetRoleOptions: readonly { value: string; label: string }[];
  activeKeySlot: "openai" | "anthropic" | "deepseek" | "gemini";
  apiKeys: ApiKeysState;
  setApiKeys: Dispatch<SetStateAction<ApiKeysState>>;
  className?: string;
};

export function SettingsForm({
  model,
  onModelChange,
  modelOptions,
  targetRole,
  onTargetRoleChange,
  targetRoleOptions,
  activeKeySlot,
  apiKeys,
  setApiKeys,
  className,
}: SettingsFormProps) {
  return (
    <div className={cn("flex flex-col gap-6", className)}>
      <div className="space-y-2">
        <Label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Model
        </Label>
        <Select value={model} onValueChange={onModelChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="选择模型" />
          </SelectTrigger>
          <SelectContent>
            {modelOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Target Role
        </Label>
        <Select value={targetRole} onValueChange={onTargetRoleChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="角色" />
          </SelectTrigger>
          <SelectContent>
            {targetRoleOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="border-t border-border pt-6">
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          API Key（当前模型）
        </p>
        <p className="mb-3 text-[11px] leading-relaxed text-muted-foreground">
          {activeKeySlot === "openai"
            ? "GPT 系列使用 OpenAI API Key。"
            : activeKeySlot === "anthropic"
              ? "Claude 使用 Anthropic API Key。"
              : activeKeySlot === "deepseek"
                ? "DeepSeek-V3 使用 DeepSeek API Key。"
                : "Gemini 使用 Google AI Studio / Cloud 的 API Key（与 Generative Language API 兼容）。"}
        </p>

        {activeKeySlot === "openai" ? (
          <div className="space-y-2">
            <Label htmlFor="k-openai">OpenAI</Label>
            <Input
              autoComplete="off"
              id="k-openai"
              placeholder="sk-..."
              type="password"
              value={apiKeys.openai ?? ""}
              onChange={(e) =>
                setApiKeys((k) => ({ ...k, openai: e.target.value }))
              }
            />
          </div>
        ) : null}

        {activeKeySlot === "anthropic" ? (
          <div className="space-y-2">
            <Label htmlFor="k-anthropic">Anthropic</Label>
            <Input
              autoComplete="off"
              id="k-anthropic"
              placeholder="sk-ant-..."
              type="password"
              value={apiKeys.anthropic ?? ""}
              onChange={(e) =>
                setApiKeys((k) => ({ ...k, anthropic: e.target.value }))
              }
            />
          </div>
        ) : null}

        {activeKeySlot === "deepseek" ? (
          <div className="space-y-2">
            <Label htmlFor="k-deepseek">DeepSeek</Label>
            <Input
              autoComplete="off"
              id="k-deepseek"
              placeholder="DeepSeek API Key"
              type="password"
              value={apiKeys.deepseek ?? ""}
              onChange={(e) =>
                setApiKeys((k) => ({ ...k, deepseek: e.target.value }))
              }
            />
          </div>
        ) : null}

        {activeKeySlot === "gemini" ? (
          <div className="space-y-2">
            <Label htmlFor="k-gemini">Google Gemini</Label>
            <Input
              autoComplete="off"
              id="k-gemini"
              placeholder="AIza..."
              type="password"
              value={apiKeys.gemini ?? ""}
              onChange={(e) =>
                setApiKeys((k) => ({ ...k, gemini: e.target.value }))
              }
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
