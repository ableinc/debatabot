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
		await loadUserProviders();
	});

	const resetDebate = () => {
		setDebateState({ value: "idle" });
		setMessages([]);
		setResults(null);
	};

	const loadUserProviders = async (): Promise<Error | null> => {
		try {
			const providers = await invoke<LLMProvider[]>(InvokeEnum.GetLLMProviders);
			if (providers.length === 0) {
				logger.warn("No LLM settings found in SQLite, using defaults");
			}
			setUserProviders(providers || []);
			return null;
		} catch (e) {
			const error = _castError(e);
			logger.error(`Failed to load LLM settings from SQLite: ${error.message}`);
			setUserProviders([]);
			return error;
		}
	};

	const saveUserProviders = async (
		providers: LLMProvider[],
	): Promise<Error | null> => {
		try {
			await invoke(InvokeEnum.SaveLLMProvider, { providers });
			setUserProviders(providers);
			return null;
		} catch (e) {
			const error = _castError(e);
			logger.error(`Failed to save LLM settings to SQLite: ${error.message}`);
			return error;
		}
	};

	const deleteUserProvider = async (
		providerName: LLMProviderEnum,
	): Promise<Error | null> => {
		try {
			await invoke(InvokeEnum.DeleteLLMProvider, { providerName });
			const updated = userProviders().filter(
				(p) => p.provider !== providerName,
			);
			setUserProviders(updated);
			return null;
		} catch (e) {
			const error = _castError(e);
			logger.error(
				`Failed to delete LLM provider from SQLite: ${error.message}`,
			);
			return error;
		}
	};

	const _castError = (e: unknown): Error => {
		if (e instanceof Error) {
			return e;
		}
		return new Error(String(e));
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
