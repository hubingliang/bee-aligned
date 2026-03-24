import Anthropic from "@anthropic-ai/sdk";
import OpenAI, { AzureOpenAI } from "openai";
import { z } from "zod";

/** OpenAI 官方 API（含兼容端点）默认 baseURL */
export const OPENAI_DEFAULT_BASE_URL = "https://api.openai.com/v1";

/** DeepSeek OpenAI 兼容入口（与 OpenAI SDK 的 baseURL 约定一致） */
export const DEEPSEEK_BASE_URL = "https://api.deepseek.com";

/** Achat Proxy for Azure OpenAI（固定 Endpoint，见公司文档） */
export const ACHAT_AZURE_ENDPOINT =
  "https://achat.advai.net/api/v1/openai/proxy";

/** 与官方 Azure OpenAI SDK 示例一致 */
const ACHAT_AZURE_API_VERSION = "2024-04-01-preview";

export const modelEnum = z.enum([
  "claude-3-5-sonnet-20241022",
  "gpt-4o",
  "gpt-4o-mini",
  "deepseek-v3",
  "gemini-2.0-flash",
  /** 公司 Achat → Azure OpenAI 代理；model 参数传 Deployment Id */
  "achat-azure",
]);

export type ModelId = z.infer<typeof modelEnum>;

export type LlmProvider =
  | "openai"
  | "anthropic"
  | "deepseek"
  | "gemini"
  | "achatAzure";

export type LlmHeaders = {
  openai: string | null;
  anthropic: string | null;
  deepseek: string | null;
  gemini: string | null;
  /** Achat API Key */
  achat: string | null;
  /** Azure Deployment Id（与文档中 deployment 一致） */
  achatDeployment: string | null;
};

export function readLlmHeadersFromRequest(request: Request): LlmHeaders {
  return {
    openai: request.headers.get("x-openai-key"),
    anthropic: request.headers.get("x-anthropic-key"),
    deepseek: request.headers.get("x-deepseek-key"),
    gemini: request.headers.get("x-gemini-key"),
    achat: request.headers.get("x-achat-key"),
    achatDeployment: request.headers.get("x-achat-deployment"),
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
      provider: "achatAzure";
      apiKey: string;
      deploymentId: string;
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
    case "achat-azure": {
      const apiKey = pickKey(headers.achat, process.env.ACHAT_API_KEY);
      const deploymentId = pickKey(
        headers.achatDeployment,
        process.env.ACHAT_DEPLOYMENT_ID,
      );
      if (!apiKey) {
        return {
          error:
            "缺少 Achat API Key（请求头 x-achat-key 或环境变量 ACHAT_API_KEY）",
        };
      }
      if (!deploymentId) {
        return {
          error:
            "缺少 Deployment Id（请求头 x-achat-deployment 或环境变量 ACHAT_DEPLOYMENT_ID），请填写公司文档中的部署名 / deployment id。",
        };
      }
      return {
        provider: "achatAzure",
        apiKey,
        deploymentId: deploymentId.trim(),
      };
    }
  }
}

async function chatAchatAzure(
  systemPrompt: string,
  userMessage: string,
  apiKey: string,
  deploymentId: string,
): Promise<string> {
  const client = new AzureOpenAI({
    endpoint: ACHAT_AZURE_ENDPOINT,
    apiKey,
    apiVersion: ACHAT_AZURE_API_VERSION,
  });

  const completion = await client.chat.completions.create({
    model: deploymentId,
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

async function* streamAchatAzure(
  systemPrompt: string,
  userMessage: string,
  apiKey: string,
  deploymentId: string,
): AsyncGenerator<string, void, undefined> {
  const client = new AzureOpenAI({
    endpoint: ACHAT_AZURE_ENDPOINT,
    apiKey,
    apiVersion: ACHAT_AZURE_API_VERSION,
  });

  const stream = await client.chat.completions.create({
    model: deploymentId,
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

  if (route.provider === "achatAzure") {
    const markdown = await chatAchatAzure(
      systemPrompt,
      userMessage,
      route.apiKey,
      route.deploymentId,
    );
    return { markdown, provider: "achatAzure" };
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

  if (route.provider === "achatAzure") {
    const { apiKey, deploymentId } = route;
    async function* gen(): AsyncGenerator<string, void, undefined> {
      yield* streamAchatAzure(
        systemPrompt,
        userMessage,
        apiKey,
        deploymentId,
      );
    }
    return { textStream: gen(), provider: "achatAzure" };
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
