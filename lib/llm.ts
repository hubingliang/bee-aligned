import Anthropic from "@anthropic-ai/sdk";
import OpenAI, { AzureOpenAI } from "openai";
import { z } from "zod";

import {
  AZURE_OPENAI_DEPLOYMENT_IDS,
  isAzureOpenAiDeploymentId,
} from "@/lib/azure-openai-deployments";

/** OpenAI 官方 API（含兼容端点）默认 baseURL */
export const OPENAI_DEFAULT_BASE_URL = "https://api.openai.com/v1";

/** DeepSeek OpenAI 兼容入口（与 OpenAI SDK 的 baseURL 约定一致） */
export const DEEPSEEK_BASE_URL = "https://api.deepseek.com";

/** Azure OpenAI REST API 版本（与官方 SDK 示例一致，可随 Azure 文档升级） */
const AZURE_OPENAI_API_VERSION = "2024-02-15-preview";

export const modelEnum = z.enum([
  "claude-3-5-sonnet-20241022",
  "gpt-4o",
  "gpt-4o-mini",
  "deepseek-v3",
  "gemini-2.0-flash",
  /** 使用你在 Azure 门户中创建的 Endpoint、密钥与部署名；不绑定任何第三方固定地址 */
  "azure-openai",
]);

export type ModelId = z.infer<typeof modelEnum>;

export type LlmProvider =
  | "openai"
  | "anthropic"
  | "deepseek"
  | "gemini"
  | "azureOpenai";

export type LlmHeaders = {
  openai: string | null;
  anthropic: string | null;
  deepseek: string | null;
  gemini: string | null;
  azureOpenaiEndpoint: string | null;
  azureOpenaiKey: string | null;
  azureOpenaiDeployment: string | null;
};

export function readLlmHeadersFromRequest(request: Request): LlmHeaders {
  return {
    openai: request.headers.get("x-openai-key"),
    anthropic: request.headers.get("x-anthropic-key"),
    deepseek: request.headers.get("x-deepseek-key"),
    gemini: request.headers.get("x-gemini-key"),
    azureOpenaiEndpoint: request.headers.get("x-azure-openai-endpoint"),
    azureOpenaiKey: request.headers.get("x-azure-openai-key"),
    azureOpenaiDeployment: request.headers.get("x-azure-openai-deployment"),
  };
}

export function pickKey(
  header: string | null,
  env: string | undefined,
): string | undefined {
  const h = header?.trim();
  if (h) return h;
  const e = env?.trim();
  return e || undefined;
}

/** Google API Key 常见前缀；误填到 OpenAI 会导致 401 */
function looksLikeGeminiApiKey(key: string): boolean {
  return key.trim().startsWith("AIza");
}

/** 规范化 Azure OpenAI 资源 Endpoint（用户可粘贴门户中的 URL） */
function normalizeAzureEndpoint(raw: string): string {
  let t = raw.trim();
  if (!t.startsWith("http://") && !t.startsWith("https://")) {
    t = `https://${t}`;
  }
  return t.replace(/\/+$/, "");
}

type ResolvedRoute =
  | {
      provider: "openai";
      apiKey: string;
      apiModel: string;
      baseURL: string;
    }
  | {
      provider: "anthropic";
      apiKey: string;
      apiModel: string;
    }
  | {
      provider: "deepseek";
      apiKey: string;
      apiModel: string;
      baseURL: string;
    }
  | {
      provider: "gemini";
      apiKey: string;
      apiModel: string;
    }
  | {
      provider: "azureOpenai";
      endpoint: string;
      apiKey: string;
      deployment: string;
    };

export function resolveRoute(
  model: ModelId,
  headers: LlmHeaders,
): ResolvedRoute | { error: string } {
  switch (model) {
    case "claude-3-5-sonnet-20241022": {
      const apiKey = pickKey(
        headers.anthropic,
        process.env.ANTHROPIC_API_KEY,
      );
      if (!apiKey) {
        return {
          error:
            "缺少 Anthropic API Key（请求头 x-anthropic-key 或环境变量 ANTHROPIC_API_KEY）",
        };
      }
      return {
        provider: "anthropic",
        apiKey,
        apiModel: "claude-3-5-sonnet-20241022",
      };
    }
    case "gpt-4o":
    case "gpt-4o-mini": {
      const apiKey = pickKey(headers.openai, process.env.OPENAI_API_KEY);
      if (!apiKey) {
        return {
          error:
            "缺少 OpenAI API Key（请求头 x-openai-key 或环境变量 OPENAI_API_KEY）",
        };
      }
      if (looksLikeGeminiApiKey(apiKey)) {
        return {
          error:
            "检测到 Google Gemini 格式的密钥（以 AIza 开头）。请在「配置」中选择 **Gemini 2.0 Flash** 模型，并把密钥填在 **Google Gemini** 一栏；OpenAI 密钥应以 sk- 开头。",
        };
      }
      return {
        provider: "openai",
        apiKey,
        apiModel: model,
        baseURL: process.env.OPENAI_BASE_URL?.trim() || OPENAI_DEFAULT_BASE_URL,
      };
    }
    case "deepseek-v3": {
      const apiKey = pickKey(headers.deepseek, process.env.DEEPSEEK_API_KEY);
      if (!apiKey) {
        return {
          error:
            "缺少 DeepSeek API Key（请求头 x-deepseek-key 或环境变量 DEEPSEEK_API_KEY）",
        };
      }
      return {
        provider: "deepseek",
        apiKey,
        apiModel: "deepseek-chat",
        baseURL: process.env.DEEPSEEK_BASE_URL?.trim() || DEEPSEEK_BASE_URL,
      };
    }
    case "gemini-2.0-flash": {
      const apiKey = pickKey(headers.gemini, process.env.GEMINI_API_KEY);
      if (!apiKey) {
        return {
          error:
            "缺少 Google Gemini API Key（请求头 x-gemini-key 或环境变量 GEMINI_API_KEY）",
        };
      }
      return {
        provider: "gemini",
        apiKey,
        apiModel: "gemini-2.0-flash",
      };
    }
    case "azure-openai": {
      const endpoint = pickKey(
        headers.azureOpenaiEndpoint,
        process.env.AZURE_OPENAI_ENDPOINT,
      );
      const apiKey = pickKey(
        headers.azureOpenaiKey,
        process.env.AZURE_OPENAI_API_KEY,
      );
      const deployment = pickKey(
        headers.azureOpenaiDeployment,
        process.env.AZURE_OPENAI_DEPLOYMENT,
      );
      if (!endpoint) {
        return {
          error:
            "缺少 Azure OpenAI Endpoint（请求头 x-azure-openai-endpoint 或环境变量 AZURE_OPENAI_ENDPOINT）",
        };
      }
      if (!apiKey) {
        return {
          error:
            "缺少 Azure OpenAI API Key（请求头 x-azure-openai-key 或环境变量 AZURE_OPENAI_API_KEY）",
        };
      }
      if (!deployment) {
        return {
          error:
            "缺少 Deployment 名称（请求头 x-azure-openai-deployment 或环境变量 AZURE_OPENAI_DEPLOYMENT）",
        };
      }
      const dep = deployment.trim();
      if (!isAzureOpenAiDeploymentId(dep)) {
        return {
          error: `Deployment 仅支持：${AZURE_OPENAI_DEPLOYMENT_IDS.join("、")}`,
        };
      }
      return {
        provider: "azureOpenai",
        endpoint: normalizeAzureEndpoint(endpoint),
        apiKey,
        deployment: dep,
      };
    }
  }
}

async function chatOpenAI(
  systemPrompt: string,
  userMessage: string,
  apiKey: string,
  model: string,
  baseURL: string,
): Promise<string> {
  const client = new OpenAI({
    apiKey,
    baseURL,
  });

  const completion = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
  });

  const text = completion.choices[0]?.message?.content;
  if (!text) {
    throw new Error("模型返回内容为空");
  }
  return text;
}

async function chatAzureOpenAI(
  systemPrompt: string,
  userMessage: string,
  endpoint: string,
  apiKey: string,
  deploymentName: string,
): Promise<string> {
  const client = new AzureOpenAI({
    endpoint,
    apiKey,
    apiVersion: AZURE_OPENAI_API_VERSION,
  });
  const completion = await client.chat.completions.create({
    model: deploymentName,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
  });
  const text = completion.choices[0]?.message?.content;
  if (!text) {
    throw new Error("模型返回内容为空");
  }
  return text;
}

async function* streamAzureOpenAI(
  systemPrompt: string,
  userMessage: string,
  endpoint: string,
  apiKey: string,
  deploymentName: string,
): AsyncGenerator<string, void, undefined> {
  const client = new AzureOpenAI({
    endpoint,
    apiKey,
    apiVersion: AZURE_OPENAI_API_VERSION,
  });
  const stream = await client.chat.completions.create({
    model: deploymentName,
    stream: true,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
  });
  for await (const chunk of stream) {
    const piece = chunk.choices[0]?.delta?.content;
    if (piece) {
      yield piece;
    }
  }
}

/** Google Gemini（Generative Language API REST） */
const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta";

async function chatGemini(
  systemPrompt: string,
  userMessage: string,
  apiKey: string,
  model: string,
): Promise<string> {
  const url = `${GEMINI_API_BASE}/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: systemPrompt }],
      },
      contents: [
        {
          role: "user",
          parts: [{ text: userMessage }],
        },
      ],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API 错误 ${res.status}: ${errText.slice(0, 500)}`);
  }

  const data = (await res.json()) as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
    }>;
  };
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("模型返回内容为空");
  }
  return text.trim();
}

async function chatAnthropic(
  systemPrompt: string,
  userMessage: string,
  apiKey: string,
  model: string,
): Promise<string> {
  const client = new Anthropic({ apiKey });

  const message = await client.messages.create({
    model,
    max_tokens: 8192,
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
  });

  const textParts: string[] = [];
  for (const block of message.content) {
    if (block.type === "text") {
      textParts.push(block.text);
    }
  }
  const text = textParts.join("\n").trim();
  if (!text) {
    throw new Error("模型返回内容为空");
  }
  return text;
}

async function* streamOpenAI(
  systemPrompt: string,
  userMessage: string,
  apiKey: string,
  model: string,
  baseURL: string,
): AsyncGenerator<string, void, undefined> {
  const client = new OpenAI({ apiKey, baseURL });
  const stream = await client.chat.completions.create({
    model,
    stream: true,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
  });

  for await (const chunk of stream) {
    const piece = chunk.choices[0]?.delta?.content;
    if (piece) {
      yield piece;
    }
  }
}

export type InvokeLlmResult = {
  markdown: string;
  provider: LlmProvider;
};

export type InvokeLlmStreamResult = {
  textStream: AsyncIterable<string>;
  provider: LlmProvider;
};

/**
 * 非流式：一次性返回完整文本（clean / generate 默认使用）。
 */
export async function invokeLlm(
  model: ModelId,
  headers: LlmHeaders,
  systemPrompt: string,
  userMessage: string,
): Promise<InvokeLlmResult> {
  const route = resolveRoute(model, headers);
  if ("error" in route) {
    throw new Error(route.error);
  }

  if (route.provider === "anthropic") {
    const markdown = await chatAnthropic(
      systemPrompt,
      userMessage,
      route.apiKey,
      route.apiModel,
    );
    return { markdown, provider: "anthropic" };
  }

  if (route.provider === "gemini") {
    const markdown = await chatGemini(
      systemPrompt,
      userMessage,
      route.apiKey,
      route.apiModel,
    );
    return { markdown, provider: "gemini" };
  }

  if (route.provider === "azureOpenai") {
    const markdown = await chatAzureOpenAI(
      systemPrompt,
      userMessage,
      route.endpoint,
      route.apiKey,
      route.deployment,
    );
    return { markdown, provider: "azureOpenai" };
  }

  const markdown = await chatOpenAI(
    systemPrompt,
    userMessage,
    route.apiKey,
    route.apiModel,
    route.baseURL,
  );
  return { markdown, provider: route.provider };
}

/**
 * 流式：OpenAI / DeepSeek 使用 SSE chunk；Anthropic 当前 SDK走单次完整响应并作为单块 yield，便于统一消费端。
 */
export async function invokeLlmStream(
  model: ModelId,
  headers: LlmHeaders,
  systemPrompt: string,
  userMessage: string,
): Promise<InvokeLlmStreamResult> {
  const route = resolveRoute(model, headers);
  if ("error" in route) {
    throw new Error(route.error);
  }

  if (route.provider === "anthropic") {
    const text = await chatAnthropic(
      systemPrompt,
      userMessage,
      route.apiKey,
      route.apiModel,
    );
    async function* once(): AsyncGenerator<string, void, undefined> {
      yield text;
    }
    return { textStream: once(), provider: "anthropic" };
  }

  if (route.provider === "gemini") {
    const text = await chatGemini(
      systemPrompt,
      userMessage,
      route.apiKey,
      route.apiModel,
    );
    async function* once(): AsyncGenerator<string, void, undefined> {
      yield text;
    }
    return { textStream: once(), provider: "gemini" };
  }

  if (route.provider === "azureOpenai") {
    const { endpoint, apiKey, deployment } = route;
    async function* gen(): AsyncGenerator<string, void, undefined> {
      yield* streamAzureOpenAI(
        systemPrompt,
        userMessage,
        endpoint,
        apiKey,
        deployment,
      );
    }
    return { textStream: gen(), provider: "azureOpenai" };
  }

  const { apiKey, apiModel, baseURL, provider } = route;

  async function* gen(): AsyncGenerator<string, void, undefined> {
    yield* streamOpenAI(
      systemPrompt,
      userMessage,
      apiKey,
      apiModel,
      baseURL,
    );
  }

  return { textStream: gen(), provider };
}

/** 将流式片段合并为完整字符串 */
export async function collectTextStream(
  stream: AsyncIterable<string>,
): Promise<string> {
  let out = "";
  for await (const chunk of stream) {
    out += chunk;
  }
  return out.trim();
}
