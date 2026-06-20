export type LogLevel = "log" | "debug" | "trace" | "info" | "warn" | "error";

export enum InvokeEnum {
	StartDebate = "start_debate",
	StopDebate = "stop_debate",
	DeclareWinner = "declare_winner",
	GetPersonalities = "get_personalities",
	GetLLMProviders = "get_llm_providers",
	SaveLLMProvider = "save_llm_provider",
	DeleteLLMProvider = "delete_llm_provider",
}

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

/** LLM providers persisted in SQLite */
export interface LLMProvider {
	provider: LLMProviderEnum;
	apiKey: string;
	baseUrl: string;
	model: string;
	maxTokens: number;
	temperature: number;
	isDefault: boolean;
}

export const LLMProviderOptions: Record<LLMProviderEnum, LLMProvider> = {
	[LLMProviderEnum.OpenAI]: {
		provider: LLMProviderEnum.OpenAI,
		apiKey: "",
		baseUrl: "https://api.openai.com/v1/chat/completions",
		model: "gpt-4",
		maxTokens: 256000,
		temperature: 0.7,
		isDefault: true,
	},
	[LLMProviderEnum.Ollama]: {
		provider: LLMProviderEnum.Ollama,
		apiKey: "",
		baseUrl: "http://localhost:11434/v1/chat/completions",
		model: "llama3",
		maxTokens: 256000,
		temperature: 0.7,
		isDefault: false,
	},
	[LLMProviderEnum.OpenRouter]: {
		provider: LLMProviderEnum.OpenRouter,
		apiKey: "",
		baseUrl: "https://openrouter.ai/api/v1/chat/completions",
		model: "anthropic/claude-sonnet-4",
		maxTokens: 256000,
		temperature: 0.7,
		isDefault: false,
	},
	[LLMProviderEnum.TogetherAI]: {
		provider: LLMProviderEnum.TogetherAI,
		apiKey: "",
		baseUrl: "https://api.together.xyz/v1/chat/completions",
		model: "mistralai/Mistral-7B-Instruct-v0.7",
		maxTokens: 256000,
		temperature: 0.7,
		isDefault: false,
	},
	[LLMProviderEnum.LiteLLM]: {
		provider: LLMProviderEnum.LiteLLM,
		apiKey: "",
		baseUrl: "http://localhost:4000/v1/chat/completions",
		model: "gpt-4o-mini",
		maxTokens: 256000,
		temperature: 0.7,
		isDefault: false,
	},
	[LLMProviderEnum.Groq]: {
		provider: LLMProviderEnum.Groq,
		apiKey: "",
		baseUrl: "https://api.groq.com/openai/v1/chat/completions",
		model: "llama3-8b-8192",
		maxTokens: 256000,
		temperature: 0.7,
		isDefault: false,
	},
	[LLMProviderEnum.DeepSeek]: {
		provider: LLMProviderEnum.DeepSeek,
		apiKey: "",
		baseUrl: "https://api.deepseek.com/v1/chat/completions",
		model: "deepseek-chat",
		maxTokens: 256000,
		temperature: 0.7,
		isDefault: false,
	},
	[LLMProviderEnum.LMStudio]: {
		provider: LLMProviderEnum.LMStudio,
		apiKey: "",
		baseUrl: "http://localhost:1234/v1/chat/completions",
		model: "gpt-4o-mini",
		maxTokens: 256000,
		temperature: 0.7,
		isDefault: false,
	},
	[LLMProviderEnum.vLLM]: {
		provider: LLMProviderEnum.vLLM,
		apiKey: "",
		baseUrl: "http://localhost:8000/v1/chat/completions",
		model: "meta-llama/Llama-3-8B",
		maxTokens: 256000,
		temperature: 0.7,
		isDefault: false,
	},
	[LLMProviderEnum.MistralAI]: {
		provider: LLMProviderEnum.MistralAI,
		apiKey: "",
		baseUrl: "https://api.mistral.ai/v1/chat/completions",
		model: "mistral-small-latest",
		maxTokens: 256000,
		temperature: 0.7,
		isDefault: false,
	},
	[LLMProviderEnum.Perplexity]: {
		provider: LLMProviderEnum.Perplexity,
		apiKey: "",
		baseUrl: "https://api.perplexity.ai/chat/completions",
		model: "sonar",
		maxTokens: 256000,
		temperature: 0.7,
		isDefault: false,
	},
	[LLMProviderEnum.CloudflareAIGateway]: {
		provider: LLMProviderEnum.CloudflareAIGateway,
		apiKey: "",
		baseUrl:
			"https://api.cloudflare.com/client/v4/accounts/{account_id}/ai/gateway/chat/completions",
		model: "gpt-4o-mini",
		maxTokens: 256000,
		temperature: 0.7,
		isDefault: false,
	},
	[LLMProviderEnum.Portkey]: {
		provider: LLMProviderEnum.Portkey,
		apiKey: "",
		baseUrl: "https://api.portkey.ai/v1/chat/completions",
		model: "gpt-4o-mini",
		maxTokens: 256000,
		temperature: 0.7,
		isDefault: false,
	},
	[LLMProviderEnum.Anyscale]: {
		provider: LLMProviderEnum.Anyscale,
		apiKey: "",
		baseUrl: "https://api.anyscale.com/v1/chat/completions",
		model: "gpt-4o-mini",
		maxTokens: 256000,
		temperature: 0.7,
		isDefault: false,
	},
	[LLMProviderEnum.FireworksAI]: {
		provider: LLMProviderEnum.FireworksAI,
		apiKey: "",
		baseUrl: "https://api.fireworks.ai/v1/chat/completions",
		model: "gpt-4o-mini",
		maxTokens: 256000,
		temperature: 0.7,
		isDefault: false,
	},
	[LLMProviderEnum.LocalAI]: {
		provider: LLMProviderEnum.LocalAI,
		apiKey: "",
		baseUrl: "http://localhost:8080/v1/chat/completions",
		model: "gpt-4o-mini",
		maxTokens: 256000,
		temperature: 0.7,
		isDefault: false,
	},
	[LLMProviderEnum.LlamaCpp]: {
		provider: LLMProviderEnum.LlamaCpp,
		apiKey: "",
		baseUrl: "http://localhost:8080/v1/chat/completions",
		model: "llama-3-8b",
		maxTokens: 256000,
		temperature: 0.7,
		isDefault: false,
	},
	[LLMProviderEnum.Custom]: {
		provider: LLMProviderEnum.Custom,
		apiKey: "",
		baseUrl: "",
		model: "",
		maxTokens: 256000,
		temperature: 0.7,
		isDefault: false,
	},
};
