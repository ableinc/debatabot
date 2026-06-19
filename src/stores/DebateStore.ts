import { createSignal } from "solid-js";
import type {
	AppScreen,
	BotConfig,
	DebateMessage,
	DebateResult,
	DebateState,
	Personality,
} from "../types";
import { DebateViewpoint } from "../types";

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
		resetDebate,
	};
}
