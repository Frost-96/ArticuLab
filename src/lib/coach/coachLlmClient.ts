import OpenAI from "openai";

const globalForCoachLlm = globalThis as unknown as {
  coachLlmClient: OpenAI | null | undefined;
  coachLlmCacheKey: string | undefined;
};

function resolveEnv(primary: string, fallback: string, defaultValue = "") {
  return (
    process.env[primary]?.trim() ||
    process.env[fallback]?.trim() ||
    defaultValue
  );
}

export function getCoachLlmClient(): OpenAI | null {
  const apiKey = resolveEnv("COACH_LLM_API_KEY", "SPEAKING_LLM_API_KEY");
  if (!apiKey) {
    globalForCoachLlm.coachLlmClient = null;
    globalForCoachLlm.coachLlmCacheKey = undefined;
    return null;
  }

  const baseURL = resolveEnv(
    "COACH_LLM_BASE_URL",
    "SPEAKING_LLM_BASE_URL",
    "https://api.deepseek.com",
  );
  const cacheKey = `${baseURL}:${apiKey}`;

  if (
    globalForCoachLlm.coachLlmClient !== undefined &&
    globalForCoachLlm.coachLlmCacheKey === cacheKey
  ) {
    return globalForCoachLlm.coachLlmClient;
  }

  globalForCoachLlm.coachLlmClient = new OpenAI({ apiKey, baseURL });
  globalForCoachLlm.coachLlmCacheKey = cacheKey;
  return globalForCoachLlm.coachLlmClient;
}

export function getCoachLlmModel(): string {
  return resolveEnv(
    "COACH_LLM_MODEL",
    "SPEAKING_LLM_MODEL",
    "deepseek-v4-flash",
  );
}
