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
import { DebateViewpoint, InvokeEnum, LLMProviderOptions } from "../types";

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
	const [userProviders, setUserProviders] = createSignal<LLMProvider[]>([]);
	const [acceptedProviders, _] =
		createSignal<Record<LLMProviderEnum, LLMProvider>>(LLMProviderOptions);

	createEffect(async () => {
		try {
			await loadUserProviders();
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

	const loadUserProviders = async (): Promise<void> => {
		const providers = await invoke<LLMProvider[]>(InvokeEnum.GetLLMProviders);
		if (providers.length === 0) {
			logger.warn("No LLM settings found in SQLite, using defaults");
		}
		setUserProviders(providers || []);
	};

	const saveUserProviders = async (providers: LLMProvider[]): Promise<void> => {
		try {
			await invoke(InvokeEnum.SaveLLMProvider, { providers });
			setUserProviders(providers);
		} catch (e) {
			logger.error(
				`Failed to save LLM settings to SQLite: ${(e as Error).message}`,
			);
		}
	};

	const deleteUserProvider = async (
		providerName: LLMProviderEnum,
	): Promise<void> => {
		try {
			await invoke(InvokeEnum.DeleteLLMProvider, { providerName });
			const updated = userProviders().filter(
				(p) => p.provider !== providerName,
			);
			setUserProviders(updated);
		} catch (e) {
			logger.error(
				`Failed to delete LLM provider from SQLite: ${(e as Error).message}`,
			);
		}
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
		userProviders,
		loadUserProviders,
		saveUserProviders,
		deleteUserProvider,
		acceptedProviders,
		resetDebate,
	};
}
