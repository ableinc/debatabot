import { invoke } from "@tauri-apps/api/core";
import { createEffect, createSignal } from "solid-js";
import logger from "../lib/logger";
import type {
	AppScreen,
	BotConfig,
	DebateMessage,
	DebateResult,
	DebateState,
	LLMProvider,
	LLMProviderEnum,
	Personality,
} from "../types";
import { DebateViewpoint, LLMProviderOptions } from "../types";

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
	const [llmProviders, setLlmProviders] = createSignal<LLMProvider[]>([]);
	const [acceptedProviders, _] =
		createSignal<Record<LLMProviderEnum, LLMProvider>>(LLMProviderOptions);

	// Load LLM settings from SQLite on init
	createEffect(async () => {
		try {
			const settings = await invoke<LLMProvider[]>("get_llm_settings");
			if (settings.length === 0) {
				logger.warn("No LLM settings found in SQLite, using defaults");
			}
			setLlmProviders(settings);
		} catch (e) {
			logger.error(
				`Failed to load app settings from SQLite: ${(e as Error).message}`,
			);
		}
	});

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
		llmProviders,
		setLlmProviders,
		acceptedProviders,
		resetDebate,
	};
}
