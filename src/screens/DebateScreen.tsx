import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { createMemo, createSignal, For, Show } from "solid-js";
import {
	StopCircle,
	Trophy,
	MessageSquare,
	Sparkles,
} from "lucide-solid";
import logger from "../lib/logger";
import {
	type DebateMessage,
	type DebateResult,
	type DebateState,
	InvokeEnum,
} from "../types";

/* ── Constants ─────────────────────────────────────────────────── */
/** Matches the Rust default turn_limit (DEBATE_TURN_LIMIT env var). */
const DEFAULT_MAX_TURNS = 10;

/* ── Props ─────────────────────────────────────────────────────── */
interface DebateScreenProps {
	topic: string;
	botA: { name: string; personalityName: string };
	botB: { name: string; personalityName: string };
	onBack: () => void;
	setResults: (result: DebateResult) => void;
}

/* ── Component ─────────────────────────────────────────────────── */
export default function DebateScreen({
	topic,
	botA,
	botB,
	onBack,
	setResults,
}: DebateScreenProps) {
	const [messages, setMessages] = createSignal<DebateMessage[]>([]);
	const [state, setState] = createSignal<DebateState>({ value: "idle" });
	const [isThinking, setIsThinking] = createSignal<boolean>(false);
	const [lastSpeaker, setLastSpeaker] = createSignal<string | null>(null);
	const [messageListRef, setMessageListRef] =
		createSignal<HTMLDivElement | null>(null);

	const scrollToBottom = () => {
		setTimeout(() => {
			const el = messageListRef();
			if (el) {
				el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
			}
		}, 60);
	};

	// ── Event listeners ────────────────────────────────────────
	const unsub = createMemo(async () => {
		const unlistenMessage = await listen<DebateMessage>(
			"debate_message",
			(event) => {
				setMessages((prev) => [...prev, event.payload]);
				setLastSpeaker(event.payload.speaker);
				setIsThinking(false);
				scrollToBottom();
			},
		);

		const unlistenState = await listen<DebateState>(
			"debate_state_changed",
			(event) => {
				setState(event.payload);
				if (event.payload.value === "in_progress") {
					setIsThinking(true);
				}
			},
		);

		const unlistenFinished = await listen<DebateResult>(
			"debate_finished",
			(event) => {
				setResults(event.payload);
				onBack();
			},
		);

		setState({ value: "setting_up" });

		return () => {
			unlistenMessage();
			unlistenState();
			unlistenFinished();
		};
	});

	// Trigger the memo so listeners are set up
	createMemo(() => unsub);

	// ── Actions ────────────────────────────────────────────────
	const stopDebate = async () => {
		try {
			await invoke(InvokeEnum.StopDebate);
		} catch (e) {
			logger.error("Failed to stop debate:", e);
		}
	};

	const declareWinner = async (botName: string) => {
		try {
			await invoke(InvokeEnum.DeclareWinner, { botName });
			onBack();
		} catch (e) {
			logger.error("Failed to declare winner:", e);
		}
	};

	// ── Derived values ─────────────────────────────────────────
	const currentTurn = createMemo(() => state().turn || 0);
	const maxTurns = createMemo(() => {
		const msgMax = messages().length;
		return msgMax > 0 ? msgMax : DEFAULT_MAX_TURNS;
	});
	const progressPct = createMemo(
		() => Math.min((currentTurn() / maxTurns()) * 100, 100),
	);

	const botAInitials = createMemo(() =>
		botA.name.charAt(0).toUpperCase(),
	);
	const botBInitials = createMemo(() =>
		botB.name.charAt(0).toUpperCase(),
	);

	const lastMessage = createMemo(() => messages()[messages().length - 1]);

	// ── Helpers ────────────────────────────────────────────────
	const isBotA = (speaker: string) => speaker === botA.name;

	/* ── Render ───────────────────────────────────────────────── */
	return (
		<div class="flex flex-col flex-1 overflow-hidden">
			/* ── 3.1 Header ──────────────────────────────────────── */
			<header class="bg-surface border-b border-border px-5 py-3 flex items-center gap-4 shrink-0">
				{/* Topic (left) */}
				<div class="min-w-0 flex items-center gap-2 shrink-0">
					<MessageSquare size={16} class="text-primary shrink-0" />
					<h2 class="text-sm font-semibold text-text truncate">
						{topic}
					</h2>
				</div>

				{/* Turn progress bar (center) */}
				<div class="flex-1 flex items-center gap-3 max-w-xs mx-auto">
					<span class="text-xs text-text-faint whitespace-nowrap shrink-0">
						Turn {currentTurn()}
					</span>
					<div class="flex-1 h-2 bg-surface-light rounded-full overflow-hidden">
						<div
							class="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-500 ease-out"
							style={{ width: `${progressPct}%` }}
						/>
					</div>
					<span class="text-xs text-text-faint whitespace-nowrap shrink-0">
						/{maxTurns()}
					</span>
				</div>

				{/* Controls (right) */}
				<div class="flex items-center gap-2 shrink-0">
					{/* Stop — red-outlined ghost button */}
					<button
						type="button"
						class="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium border border-error/60 text-error rounded-md cursor-pointer transition-all hover:bg-error hover:text-white"
						onClick={stopDebate}
					>
						<StopCircle size={15} />
						Stop
					</button>

					{/* Declare Winner */}
					<Show when={state().value === "in_progress"}>
						<div class="flex items-center gap-1.5">
							<Trophy size={14} class="text-text-faint" />
							<button
								type="button"
								class="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-bot-a-bg border border-bot-a-border text-primary rounded-full cursor-pointer transition-all hover:bg-primary hover:text-white"
								onClick={() => declareWinner(botA.name)}
								title={`Declare ${botA.name} the winner`}
							>
								<span class="w-4 h-4 rounded-full bg-bot-a-bg border border-bot-a-border flex items-center justify-center text-[9px] font-bold shrink-0">
									{botAInitials()}
								</span>
								{botA.name}
							</button>
							<button
								type="button"
								class="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-bot-b-bg border border-bot-b-border text-accent rounded-full cursor-pointer transition-all hover:bg-accent hover:text-white"
								onClick={() => declareWinner(botB.name)}
								title={`Declare ${botB.name} the winner`}
							>
								<span class="w-4 h-4 rounded-full bg-bot-b-bg border border-bot-b-border flex items-center justify-center text-[9px] font-bold shrink-0">
									{botBInitials()}
								</span>
								{botB.name}
							</button>
						</div>
					</Show>
				</div>
			</header>

			/* ── 3.2 Message List ──────────────────────────────────── */
			<div
				class="flex-1 overflow-y-auto px-5 py-6 flex flex-col gap-4"
				ref={setMessageListRef}
			>
				<For each={messages()}>
					{(msg) => {
						const a = isBotA(msg.speaker);
						const isLast =
							lastMessage()?.timestamp === msg.timestamp &&
							lastMessage()?.turn === msg.turn;
						return (
							<div
								class={`flex items-start gap-3 animate-slide-in ${
									a ? "" : "flex-row-reverse"
								}`}
							>
								{/* Avatar circle */}
								<div
									class={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
										a
											? "bg-bot-a-bg border border-bot-a-border text-primary"
											: "bg-bot-b-bg border border-bot-b-border text-accent"
									}`}
								>
									{a ? botAInitials() : botBInitials()}
								</div>

								{/* Bubble */}
								<div
									class={`max-w-[75%] rounded-md px-4 py-3 ${
										a
											? "border border-bot-a-border rounded-bl-sm"
											: "border border-bot-b-border rounded-br-sm"
									}`}
									style={
										a
											? {
													background:
														"linear-gradient(135deg, var(--color-bot-a-bg), rgba(99,102,241,0.06))",
												}
											: {
													background:
														"linear-gradient(135deg, var(--color-bot-b-bg), rgba(244,63,94,0.06))",
												}
									}
								>
									{/* Speaker header */}
									<div
										class={`flex items-center gap-2 mb-1.5 text-xs ${
											a ? "" : "flex-row-reverse"
										}`}
									>
										<span
											class={`font-semibold ${
												a ? "text-primary" : "text-accent"
											}`}
										>
											{msg.speaker}
										</span>
										<span class="text-text-faint">
											{msg.personalityName}
										</span>
										<span class="ml-auto text-text-faint">
											Turn {msg.turn}
										</span>
									</div>

									{/* Message content */}
									<p
										class={`text-sm leading-relaxed text-text whitespace-pre-wrap ${
											isLast && isThinking()
												? "animate-typewriter"
												: ""
										}`}
									>
										{msg.message}
									</p>
								</div>
							</div>
						);
					}}
				</For>

				/* ── 3.3 Thinking Indicator ──────────────────────────── */
				<Show when={isThinking()}>
					<div class="flex items-center justify-center gap-3 py-2">
						<div
							class={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold animate-pulse-slow ${
								lastSpeaker() === botA.name
									? "bg-bot-a-bg border border-bot-a-border text-primary"
									: "bg-bot-b-bg border border-bot-b-border text-accent"
							}`}
						>
							<Sparkles size={14} />
						</div>
						<span class="text-sm text-text-muted">
							{lastSpeaker() || "Bot"} is thinking...
						</span>
					</div>
				</Show>

				/* Idle state */
				<Show when={state().value === "idle"}>
					<div class="flex-1 flex items-center justify-center">
						<div class="text-center text-text-muted">
							<MessageSquare
								size={48}
								class="mx-auto mb-3 opacity-30"
							/>
							<p class="text-base">
								Ready to debate — bots will begin shortly...
							</p>
						</div>
					</div>
				</Show>
			</div>
		</div>
	);
}
