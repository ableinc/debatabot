export type LogLevel = "log" | "debug" | "trace" | "info" | "warn" | "error";

export enum DebateViewpoint {
	For = "for",
	Against = "against",
}

export interface BotConfig {
	name: string;
	personality: {
		name: string; // personality display name (e.g. "Logical")
		botName: string; // bot's name (e.g. "Cortex")
	};
	viewpoint: DebateViewpoint;
}

export type DebateStateValue =
	| "idle"
	| "setting_up"
	| "in_progress"
	| "finished";

export interface DebateState {
	value: DebateStateValue;
	turn?: number;
}

export interface DebateMessage {
	speaker: string; // bot name (e.g. "Cortex")
	personalityName: string; // personality (e.g. "Logical")
	message: string;
	turn: number;
	timestamp: number;
}

export interface DebateResult {
	topic: string;
	winner: string | null; // null = Nil/draw
	messages: DebateMessage[];
	totalTurns: number;
}

export interface Personality {
	name: string;
	botName: string;
	description: string;
	speechStyle: string;
	weakness: string;
}

export type AppScreen = "setup" | "debate" | "results" | "settings";

export enum LLMProviderEnum {
	OpenAI = "OpenAI",
	Ollama = "Ollama",
	OpenRouter = "OpenRouter",
	TogetherAI = "Together AI",
	LiteLLM = "LiteLLM",
	Groq = "Groq",
	DeepSeek = "DeepSeek",
	LMStudio = "LM Studio",
	vLLM = "vLLM",
	MistralAI = "Mistral AI",
	Perplexity = "Perplexity",
	CloudflareAIGateway = "Cloudflare AI Gateway",
	Portkey = "Portkey",
	Anyscale = "Anyscale",
	FireworksAI = "Fireworks AI",
	LocalAI = "LocalAI",
	LlamaCpp = "Llama.cpp",
	Custom = "Custom",
}

export const LLMProviderOptions: Record<LLMProviderEnum, LLMProvider> = {
	[LLMProviderEnum.OpenAI]: {
		provider: LLMProviderEnum.OpenAI,
		baseUrl: "https://api.openai.com/v1/chat/completions",
		model: "gpt-4",
		maxTokens: 256000,
	},
	[LLMProviderEnum.Ollama]: {
		provider: LLMProviderEnum.Ollama,
		baseUrl: "http://localhost:11434/v1/chat/completions",
		model: "llama3",
		maxTokens: 256000,
	},
	[LLMProviderEnum.OpenRouter]: {
		provider: LLMProviderEnum.OpenRouter,
		baseUrl: "https://openrouter.ai/api/v1/chat/completions",
		model: "anthropic/claude-sonnet-4",
		maxTokens: 256000,
	},
	[LLMProviderEnum.TogetherAI]: {
		provider: LLMProviderEnum.TogetherAI,
		baseUrl: "https://api.together.xyz/v1/chat/completions",
		model: "mistralai/Mistral-7B-Instruct-v0.7",
		maxTokens: 256000,
	},
	[LLMProviderEnum.LiteLLM]: {
		provider: LLMProviderEnum.LiteLLM,
		baseUrl: "http://localhost:4000/v1/chat/completions",
		model: "gpt-4o-mini",
		maxTokens: 256000,
	},
	[LLMProviderEnum.Groq]: {
		provider: LLMProviderEnum.Groq,
		baseUrl: "https://api.groq.com/openai/v1/chat/completions",
		model: "llama3-8b-8192",
		maxTokens: 256000,
	},
	[LLMProviderEnum.DeepSeek]: {
		provider: LLMProviderEnum.DeepSeek,
		baseUrl: "https://api.deepseek.com/v1/chat/completions",
		model: "deepseek-chat",
		maxTokens: 256000,
	},
	[LLMProviderEnum.LMStudio]: {
		provider: LLMProviderEnum.LMStudio,
		baseUrl: "http://localhost:1234/v1/chat/completions",
		model: "gpt-4o-mini",
		maxTokens: 256000,
	},
	[LLMProviderEnum.vLLM]: {
		provider: LLMProviderEnum.vLLM,
		baseUrl: "http://localhost:8000/v1/chat/completions",
		model: "meta-llama/Llama-3-8B",
		maxTokens: 256000,
	},
	[LLMProviderEnum.MistralAI]: {
		provider: LLMProviderEnum.MistralAI,
		baseUrl: "https://api.mistral.ai/v1/chat/completions",
		model: "mistral-small-latest",
		maxTokens: 256000,
	},
	[LLMProviderEnum.Perplexity]: {
		provider: LLMProviderEnum.Perplexity,
		baseUrl: "https://api.perplexity.ai/chat/completions",
		model: "sonar",
		maxTokens: 256000,
	},
	[LLMProviderEnum.CloudflareAIGateway]: {
		provider: LLMProviderEnum.CloudflareAIGateway,
		baseUrl:
			"https://api.cloudflare.com/client/v4/accounts/{account_id}/ai/gateway/chat/completions",
		model: "gpt-4o-mini",
		maxTokens: 256000,
	},
	[LLMProviderEnum.Portkey]: {
		provider: LLMProviderEnum.Portkey,
		baseUrl: "https://api.portkey.ai/v1/chat/completions",
		model: "gpt-4o-mini",
		maxTokens: 256000,
	},
	[LLMProviderEnum.Anyscale]: {
		provider: LLMProviderEnum.Anyscale,
		baseUrl: "https://api.anyscale.com/v1/chat/completions",
		model: "gpt-4o-mini",
		maxTokens: 256000,
	},
	[LLMProviderEnum.FireworksAI]: {
		provider: LLMProviderEnum.FireworksAI,
		baseUrl: "https://api.fireworks.ai/v1/chat/completions",
		model: "gpt-4o-mini",
		maxTokens: 256000,
	},
	[LLMProviderEnum.LocalAI]: {
		provider: LLMProviderEnum.LocalAI,
		baseUrl: "http://localhost:8080/v1/chat/completions",
		model: "gpt-4o-mini",
		maxTokens: 256000,
	},
	[LLMProviderEnum.LlamaCpp]: {
		provider: LLMProviderEnum.LlamaCpp,
		baseUrl: "http://localhost:8080/v1/chat/completions",
		model: "llama-3-8b",
		maxTokens: 256000,
	},
	[LLMProviderEnum.Custom]: {
		provider: LLMProviderEnum.Custom,
		baseUrl: "",
		model: "",
		maxTokens: 256000,
	},
};

export interface LLMProvider {
	provider: LLMProviderEnum;
	baseUrl: string;
	model: string;
	maxTokens: number;
}

/** LLM settings persisted in SQLite */
export interface AppSetting {
	provider: LLMProviderEnum;
	apiKey: string;
	baseUrl: string;
	model: string;
	maxTokens: number;
	is_default: boolean;
}
