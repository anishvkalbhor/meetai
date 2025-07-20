// src/lib/llama-integration.ts
export interface LlamaProvider {
  name: string;
  baseUrl: string;
  apiKey?: string;
  models: string[];
}

// Popular Llama providers
export const LLAMA_PROVIDERS: LlamaProvider[] = [
  {
    name: "Together AI",
    baseUrl: "https://api.together.xyz/v1",
    apiKey: process.env.TOGETHER_API_KEY,
    models: [
      "meta-llama/Llama-2-70b-chat-hf",
      "meta-llama/Llama-2-13b-chat-hf",
      "meta-llama/Llama-2-7b-chat-hf",
      "meta-llama/Llama-3-8b-chat-hf",
      "meta-llama/Llama-3-70b-chat-hf"
    ]
  },
  {
    name: "Replicate",
    baseUrl: "https://api.replicate.com/v1",
    apiKey: process.env.REPLICATE_API_KEY,
    models: [
      "meta/llama-2-70b-chat:02e509c789964a7ea8736978a43525956ef40397be9033abf9fd2badfe68c9e3",
      "meta/llama-2-13b-chat:2b7b381af7ba6b9f717fb3ed5a3cdeaa535aa960d3de2a977b7d8d5e23882b5b"
    ]
  },
  {
    name: "Hugging Face",
    baseUrl: "https://api-inference.huggingface.co",
    apiKey: process.env.HUGGINGFACE_API_KEY,
    models: [
      "meta-llama/Llama-2-70b-chat-hf",
      "meta-llama/Llama-2-13b-chat-hf"
    ]
  },
  {
    name: "Ollama (Local)",
    baseUrl: "http://localhost:11434/v1",
    models: [
      "llama2",
      "llama2:13b",
      "llama2:70b",
      "llama3",
      "llama3:8b",
      "llama3:70b"
    ]
  }
];

export async function askLlamaAgent({
  messages,
  provider = "together",
  model = "meta-llama/Llama-2-70b-chat-hf",
  temperature = 0.7,
  maxTokens = 1000
}: {
  messages: { role: "user" | "assistant" | "system"; content: string }[];
  provider?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}) {
  const selectedProvider = LLAMA_PROVIDERS.find(p => p.name.toLowerCase().includes(provider.toLowerCase()));
  
  if (!selectedProvider) {
    throw new Error(`Provider ${provider} not found`);
  }

  if (!selectedProvider.apiKey && selectedProvider.name !== "Ollama (Local)") {
    throw new Error(`API key required for ${selectedProvider.name}`);
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json"
  };

  if (selectedProvider.apiKey) {
    headers.Authorization = `Bearer ${selectedProvider.apiKey}`;
  }

  const response = await fetch(`${selectedProvider.baseUrl}/chat/completions`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      stream: false
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Llama API error: ${error}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || "No response from model";
}

// Function to get available models for a provider
export function getAvailableModels(providerName: string): string[] {
  const provider = LLAMA_PROVIDERS.find(p => p.name.toLowerCase().includes(providerName.toLowerCase()));
  return provider?.models || [];
}

// Function to get all available providers
export function getAvailableProviders(): LlamaProvider[] {
  return LLAMA_PROVIDERS;
} 