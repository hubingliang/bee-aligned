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
import { AZURE_OPENAI_DEPLOYMENT_IDS } from "@/lib/azure-openai-deployments";
import { cn } from "@/lib/utils";

export type ApiKeysState = {
  openai: string;
  anthropic: string;
  deepseek: string;
  gemini: string;
  azureOpenaiEndpoint: string;
  azureOpenaiKey: string;
  azureOpenaiDeployment: string;
};

type SettingsFormProps = {
  model: string;
  onModelChange: (v: string) => void;
  modelOptions: readonly { value: string; label: string }[];
  targetRole: string;
  onTargetRoleChange: (v: string) => void;
  targetRoleOptions: readonly { value: string; label: string }[];
  activeKeySlot:
    | "openai"
    | "anthropic"
    | "deepseek"
    | "gemini"
    | "azureOpenai";
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
                : activeKeySlot === "azureOpenai"
                  ? "使用你在 Microsoft Azure 门户中为 Azure OpenAI 资源复制的 Endpoint、密钥，以及模型部署（Deployment）名称。"
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

        {activeKeySlot === "azureOpenai" ? (
          <div className="flex flex-col gap-4">
            <div className="space-y-2">
              <Label htmlFor="k-az-endpoint">Endpoint</Label>
              <Input
                autoComplete="off"
                id="k-az-endpoint"
                placeholder="https://<资源名>.openai.azure.com"
                type="text"
                value={apiKeys.azureOpenaiEndpoint ?? ""}
                onChange={(e) =>
                  setApiKeys((k) => ({
                    ...k,
                    azureOpenaiEndpoint: e.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="k-az-key">API Key</Label>
              <Input
                autoComplete="off"
                id="k-az-key"
                placeholder="Azure OpenAI 资源密钥"
                type="password"
                value={apiKeys.azureOpenaiKey ?? ""}
                onChange={(e) =>
                  setApiKeys((k) => ({ ...k, azureOpenaiKey: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="k-az-deploy">Deployment</Label>
              <Select
                value={apiKeys.azureOpenaiDeployment ?? "gpt4o-mini"}
                onValueChange={(v) =>
                  setApiKeys((k) => ({ ...k, azureOpenaiDeployment: v }))
                }
              >
                <SelectTrigger id="k-az-deploy" className="w-full">
                  <SelectValue placeholder="选择部署名" />
                </SelectTrigger>
                <SelectContent>
                  {AZURE_OPENAI_DEPLOYMENT_IDS.map((id) => (
                    <SelectItem key={id} value={id}>
                      {id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[10px] leading-relaxed text-muted-foreground">
                须与 Azure 门户中部署名一致；若不一致请在门户将部署重命名为上述之一。
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
