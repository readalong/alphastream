import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

type Provider = "anthropic" | "openai" | "google";

const DEFAULT_MODELS: Record<Provider, string> = {
  anthropic: "claude-sonnet-4-5-20250929",
  openai: "gpt-4o",
  google: "gemini-2.0-flash",
};

export function getModel(llmKey?: string | null) {
  const provider = (process.env.AI_PROVIDER || "anthropic") as Provider;
  const modelId = process.env.AI_MODEL_ID || DEFAULT_MODELS[provider];

  switch (provider) {
    case "openai":
      return createOpenAI({ apiKey: llmKey || process.env.OPENAI_API_KEY })(modelId);
    case "google":
      return createGoogleGenerativeAI({ apiKey: llmKey || process.env.GOOGLE_GENERATIVE_AI_API_KEY })(modelId);
    case "anthropic":
    default:
      return createAnthropic({ apiKey: llmKey || process.env.ANTHROPIC_API_KEY })(modelId);
  }
}
