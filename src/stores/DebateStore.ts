import { invoke } from "@tauri-apps/api/core";
import { createSignal } from "solid-js";
import { DebateViewpoint } from "../types";
import type {
	AppScreen,
	BotConfig,
	DebateMessage,
	DebateResult,
	DebateState,
	LlmSettings,
	Personality,
} from "../types";

// Inline AppSettings type (matches Rust struct)
interface AppSettingsLocal {
	api_key: string;
	base_url: string;
	model: string;
}

export function createDebateStore() {
	const [screen, setScreen] = createSignal<AppScreen>("setup");
	const [debateState, setDebateState] = createSignal<DebateState>({
		value: "idle",
	});
	const [topic, setTopic] = createSignal("");
	const [bots, setBots] = createSignal<[BotConfig, BotConfig]>([
		{
			name: "",
			personality: { name: "", botName: "" },
			viewpoint: DebateViewpoint.For,
		},
		{
			name: "",
			personality: { name: "", botName: "" },
			viewpoint: DebateViewpoint.Against,
		},
	]);
	const [messages, setMessages] = createSignal<DebateMessage[]>([]);
	const [results, setResults] = createSignal<DebateResult | null>(null);
	const [personalities, setPersonalities] = createSignal<Personality[]>([]);
	const [llmSettings, setLlmSettings] = createSignal<LlmSettings>({
		apiKey: "",
		baseUrl: "https://api.openai.com/v1/chat/completions",
		model: "gpt-4o-mini",
	});

	// Load LLM settings from SQLite on init
	(async () => {
		try {
			const settings = await invoke<AppSettingsLocal>("get_llm_settings");
			setLlmSettings({
				apiKey: settings.api_key,
				baseUrl: settings.base_url,
				model: settings.model,
			});
		} catch (e) {
			console.warn("Failed to load LLM settings from SQLite:", e);
		}
	})();

	const resetDebate = () => {
		setDebateState({ value: "idle" });
		setMessages([]);
		setResults(null);
	};

	return {
		screen,
		setScreen,
		debateState,
		setDebateState,
		topic,
		setTopic,
		bots,
		setBots,
		messages,
		setMessages,
		results,
		setResults,
		personalities,
		setPersonalities,
		llmSettings,
		setLlmSettings,
		resetDebate,
	};
}
