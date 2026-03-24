/** Azure OpenAI 侧栏中可选的 Deployment 名称（须与你在门户中的部署名一致） */
export const AZURE_OPENAI_DEPLOYMENT_IDS = [
  "gpt-35-turbo",
  "gpt4",
  "gpt4-turbo",
  "gpt4o",
  "gpt4o-mini",
] as const;

export type AzureOpenAiDeploymentId =
  (typeof AZURE_OPENAI_DEPLOYMENT_IDS)[number];

const ALLOWED = new Set<string>(AZURE_OPENAI_DEPLOYMENT_IDS);

export function isAzureOpenAiDeploymentId(
  value: string,
): value is AzureOpenAiDeploymentId {
  return ALLOWED.has(value.trim());
}

/** 非法或空时回退为默认，便于兼容旧 localStorage */
export function normalizeAzureOpenAiDeploymentId(
  value: string,
): AzureOpenAiDeploymentId {
  const t = value.trim();
  if (isAzureOpenAiDeploymentId(t)) return t;
  return "gpt4o-mini";
}
