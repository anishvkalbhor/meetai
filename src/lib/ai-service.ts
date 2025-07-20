// src/lib/ai-service.ts
import { askAgent as askOpenRouterAgent } from "./openrouter";
import { runGeminiChatResponse } from "./gemini-chat";
import { askLlamaAgent } from "./llama-integration";

export interface AIProvider {
  name: string;
  models: string[];
  defaultModel: string;
}

export const AI_PROVIDERS: Record<string, AIProvider> = {
  openrouter: {
    name: "OpenRouter",
    models: [
      "mistralai/mistral-7b-instruct",
      "anthropic/claude-3-haiku",
      "meta-llama/Llama-2-70b-chat-hf",
      "meta-llama/Llama-2-13b-chat-hf",
      "openai/gpt-3.5-turbo",
      "openai/gpt-4"
    ],
    defaultModel: "mistralai/mistral-7b-instruct"
  },
  gemini: {
    name: "Google Gemini",
    models: [
      "gemini-1.5-flash",
      "gemini-1.5-pro",
      "gemini-pro"
    ],
    defaultModel: "gemini-1.5-flash"
  },
  llama: {
    name: "Meta Llama",
    models: [
      "meta-llama/Llama-2-70b-chat-hf",
      "meta-llama/Llama-2-13b-chat-hf",
      "meta-llama/Llama-2-7b-chat-hf",
      "meta-llama/Llama-3-8b-chat-hf",
      "meta-llama/Llama-3-70b-chat-hf"
    ],
    defaultModel: "meta-llama/Llama-2-70b-chat-hf"
  },
  anthropic: {
    name: "Anthropic Claude",
    models: [
      "claude-3-haiku",
      "claude-3-sonnet",
      "claude-3-opus"
    ],
    defaultModel: "claude-3-haiku"
  }
};

export async function askAIAgent({
  messages,
  provider = "openrouter",
  model,
  temperature = 0.7,
  maxTokens = 1000
}: {
  messages: { role: "user" | "assistant" | "system"; content: string }[];
  provider?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}): Promise<string> {
  const selectedModel = model || AI_PROVIDERS[provider]?.defaultModel || "mistralai/mistral-7b-instruct";

  try {
    switch (provider) {
      case "openrouter":
        return await askOpenRouterAgent({
          messages,
          model: selectedModel
        });

      case "gemini":
        // For Gemini, we need to format messages differently
        const lastMessage = messages[messages.length - 1];
        const systemMessage = messages.find(m => m.role === "system");
        const combinedPrompt = systemMessage 
          ? `${systemMessage.content}\n\nUser: ${lastMessage.content}`
          : lastMessage.content;
        
        return await runGeminiChatResponse(combinedPrompt);

      case "llama":
        return await askLlamaAgent({
          messages,
          model: selectedModel,
          temperature,
          maxTokens
        });

      case "anthropic":
        // You can add Anthropic Claude integration here
        return await askOpenRouterAgent({
          messages,
          model: "anthropic/claude-3-haiku"
        });

      default:
        throw new Error(`Unsupported AI provider: ${provider}`);
    }
  } catch (error) {
    console.error(`Error with ${provider} AI service:`, error);
    // Fallback to OpenRouter
    return await askOpenRouterAgent({
      messages,
      model: "mistralai/mistral-7b-instruct"
    });
  }
}

// Function to get available providers
export function getAvailableProviders(): AIProvider[] {
  return Object.values(AI_PROVIDERS);
}

// Function to get models for a specific provider
export function getModelsForProvider(provider: string): string[] {
  return AI_PROVIDERS[provider]?.models || [];
} 