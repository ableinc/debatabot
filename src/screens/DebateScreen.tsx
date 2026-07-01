import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { Handshake, MessageSquare, StopCircle, Trophy } from "lucide-solid";
import { createMemo, createSignal, For, onMount, Show } from "solid-js";
import logger from "../lib/logger";
import {
	type DebateMessage,
	type DebateResult,
	type DebateState,
	InvokeEnum,
} from "../types";

/* ── Constants ─────────────────────────────────────────────────── */
const DEFAULT_MAX_TURNS = 10;

/* ── Types ─────────────────────────────────────────────────────── */
interface ConfirmAction {
	title: string;
	message: string;
	confirmLabel: string;
	danger: boolean;
	onConfirm: () => void;
}

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
	const [isThinking, setIsThinking] = createSignal(false);
	const [isStopping, setIsStopping] = createSignal(false);
	const [lastSpeaker, setLastSpeaker] = createSignal<string | null>(null);
	const [declaredWinner, setDeclaredWinner] = createSignal<string | null>(null);
	const [pendingResult, setPendingResult] = createSignal<DebateResult | null>(
		null,
	);
	const [confirmAction, setConfirmAction] = createSignal<ConfirmAction | null>(
		null,
	);
	const [messageListRef, setMessageListRef] =
		createSignal<HTMLDivElement | null>(null);

	const scrollToBottom = () => {
		setTimeout(() => {
			const el = messageListRef();
			if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
		}, 60);
	};

	// ── Event listeners ────────────────────────────────────────
	const unsub = createMemo(async () => {
		const unlistenMessage = await listen<DebateMessage>(
			"debate_message",
			(event) => {
				setIsThinking(false);
				setMessages((prev) => [...prev, event.payload]);
				setLastSpeaker(event.payload.speaker);
				scrollToBottom();
				// Only start the next thinking bubble if we're not already stopping
				if (!isStopping()) {
					setIsThinking(true);
				}
			},
		);

		const unlistenState = await listen<DebateState>(
			"debate_state_changed",
			(event) => {
				setState(event.payload);
				if (event.payload.value === "finished") {
					setIsThinking(false);
				}
			},
		);

		const unlistenFinished = await listen<DebateResult>(
			"debate_finished",
			(event) => {
				setIsThinking(false);
				setIsStopping(false);
				const result = event.payload;
				if (declaredWinner() !== null) {
					// Winner was pre-declared via the header buttons — go straight to results
					setResults({ ...result, winner: declaredWinner() });
					onBack();
				} else {
					// No winner yet — hold on the debate screen and prompt the user
					setPendingResult(result);
				}
			},
		);

		setState({ value: "setting_up" });
		setIsThinking(true);

		return () => {
			unlistenMessage();
			unlistenState();
			unlistenFinished();
		};
	});

	createMemo(() => unsub);

	// ── Keyboard shortcut: Space to stop debate ────────────────
	onMount(() => {
		const handler = () => {
			if (state().value === "in_progress") handleStop();
		};
		window.addEventListener("app:space-stop", handler);
		return () => window.removeEventListener("app:space-stop", handler);
	});

	// ── Confirmation-guarded actions ───────────────────────────
	const handleStop = () => {
		if (isStopping()) return;
		setConfirmAction({
			title: "Stop the debate?",
			message: "The current bot's response will finish before the debate ends.",
			confirmLabel: "Stop debate",
			danger: true,
			onConfirm: () => {
				setIsStopping(true);
				setIsThinking(false);
				invoke(InvokeEnum.StopDebate).catch((e) => {
					logger.error("Failed to stop debate:", e);
					setIsStopping(false);
				});
			},
		});
	};

	const handleDeclareWinner = (botName: string) => {
		if (isStopping()) return;
		setConfirmAction({
			title: `Declare ${botName} the winner?`,
			message: "The debate will stop and this bot will be declared the winner.",
			confirmLabel: "Declare winner",
			danger: false,
			onConfirm: () => {
				setDeclaredWinner(botName);
				setIsStopping(true);
				setIsThinking(false);
				invoke(InvokeEnum.DeclareWinner, { botName }).catch((e) => {
					logger.error("Failed to declare winner:", e);
					setIsStopping(false);
					setDeclaredWinner(null);
				});
			},
		});
	};

	// ── Winner selection (end-of-debate dialog) ───────────────
	const finishWithWinner = (winner: string | null) => {
		const result = pendingResult()!;
		setPendingResult(null);
		setResults({ ...result, winner });
		// Persist the chosen winner (or null for draw) to the DB row
		if (result.debateId !== null) {
			invoke(InvokeEnum.FinalizeDebateWinner, {
				debateId: result.debateId,
				winner,
			}).catch((e) => logger.error("Failed to persist winner:", e));
		}
		onBack();
	};
	const currentTurn = createMemo(() => messages().length);
	const progressPct = createMemo(() =>
		Math.min((currentTurn() / DEFAULT_MAX_TURNS) * 100, 100),
	);
	const botAInitials = createMemo(() => botA.name.charAt(0).toUpperCase());
	const botBInitials = createMemo(() => botB.name.charAt(0).toUpperCase());
	const nextIsA = createMemo(
		() => lastSpeaker() === null || lastSpeaker() === botB.name,
	);
	const isBotA = (speaker: string) => speaker === botA.name;

	/* ── Render ───────────────────────────────────────────────── */
	return (
		<div class="flex flex-col h-full overflow-hidden">
			{/* ── Winner selection dialog (end of debate) ────────── */}
			<Show when={pendingResult() !== null}>
				<div class="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
					<div class="bg-surface border border-border rounded-xl p-6 max-w-sm w-full mx-4 shadow-2xl">
						<div class="text-center mb-5">
							<Trophy size={30} class="mx-auto mb-3 text-primary" />
							<h3 class="text-base font-semibold text-text">
								Who won the debate?
							</h3>
							<p class="text-sm text-text-muted mt-1">
								Declare a winner or call it a draw.
							</p>
						</div>

						<div class="flex flex-col gap-2">
							{/* Bot A */}
							<button
								type="button"
								class="flex items-center gap-3 px-4 py-3 rounded-xl border border-bot-a-border bg-bot-a-bg text-primary cursor-pointer transition-all hover:bg-primary hover:text-white hover:border-primary"
								onClick={() => finishWithWinner(botA.name)}
							>
								<span class="w-7 h-7 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-xs font-bold shrink-0">
									{botAInitials()}
								</span>
								<span class="font-medium text-sm">{botA.name} wins</span>
								<Trophy size={14} class="ml-auto opacity-60" />
							</button>

							{/* Bot B */}
							<button
								type="button"
								class="flex items-center gap-3 px-4 py-3 rounded-xl border border-bot-b-border bg-bot-b-bg text-accent cursor-pointer transition-all hover:bg-accent hover:text-white hover:border-accent"
								onClick={() => finishWithWinner(botB.name)}
							>
								<span class="w-7 h-7 rounded-full bg-accent/20 border border-accent/40 flex items-center justify-center text-xs font-bold shrink-0">
									{botBInitials()}
								</span>
								<span class="font-medium text-sm">{botB.name} wins</span>
								<Trophy size={14} class="ml-auto opacity-60" />
							</button>

							{/* Divider */}
							<div class="flex items-center gap-3 py-1">
								<div class="flex-1 h-px bg-border" />
								<span class="text-xs text-text-faint">or</span>
								<div class="flex-1 h-px bg-border" />
							</div>

							{/* Draw */}
							<button
								type="button"
								class="flex items-center gap-3 px-4 py-3 rounded-xl border border-border text-text-muted cursor-pointer transition-all hover:bg-surface-light hover:border-border hover:text-text"
								onClick={() => finishWithWinner(null)}
							>
								<Handshake size={16} class="shrink-0" />
								<span class="font-medium text-sm">Declare a Draw</span>
							</button>
						</div>
					</div>
				</div>
			</Show>

			{/* ── Confirmation dialog ─────────────────────────── */}
			<Show when={confirmAction() !== null}>
				<div class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
					<div class="bg-surface border border-border rounded-xl p-6 max-w-sm w-full mx-4 shadow-2xl">
						<h3 class="text-base font-semibold text-text mb-2">
							{confirmAction()!.title}
						</h3>
						<p class="text-sm text-text-muted mb-5">
							{confirmAction()!.message}
						</p>
						<div class="flex gap-3 justify-end">
							<button
								type="button"
								class="px-4 py-2 text-sm font-medium border border-border text-text-muted rounded-lg cursor-pointer transition-colors hover:bg-surface-light"
								onClick={() => setConfirmAction(null)}
							>
								Cancel
							</button>
							<button
								type="button"
								class={`px-4 py-2 text-sm font-medium rounded-lg cursor-pointer transition-colors text-white ${
									confirmAction()!.danger
										? "bg-error hover:bg-error/80"
										: "bg-primary hover:bg-primary-hover"
								}`}
								onClick={() => {
									const action = confirmAction();
									setConfirmAction(null);
									action?.onConfirm();
								}}
							>
								{confirmAction()!.confirmLabel}
							</button>
						</div>
					</div>
				</div>
			</Show>

			{/* ── Header ─────────────────────────────────────── */}
			<header class="bg-surface border-b border-border px-5 py-3 flex items-center gap-3 shrink-0">
				{/* Topic */}
				<div class="flex items-center gap-2 min-w-0 flex-1">
					<MessageSquare size={15} class="text-primary shrink-0" />
					<h2 class="text-sm font-semibold text-text truncate">{topic}</h2>
				</div>

				{/* Progress bar */}
				<div class="flex items-center gap-2 shrink-0 w-44">
					<span class="text-xs text-text-faint whitespace-nowrap">
						{currentTurn()} / {DEFAULT_MAX_TURNS}
					</span>
					<div class="flex-1 h-1.5 bg-surface-light rounded-full overflow-hidden">
						<div
							class="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-500 ease-out"
							style={{ width: `${progressPct()}%` }}
						/>
					</div>
				</div>

				{/* Controls */}
				<div class="flex items-center gap-2 shrink-0">
					<button
						type="button"
						disabled={isStopping()}
						class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-error/60 text-error rounded-md cursor-pointer transition-all hover:bg-error hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
						onClick={handleStop}
					>
						<StopCircle size={13} />
						Stop
					</button>

					<Show when={messages().length > 0 && !isStopping()}>
						<div class="w-px h-5 bg-border shrink-0" />
						<div class="flex items-center gap-1.5">
							<Trophy size={12} class="text-text-faint shrink-0" />
							<button
								type="button"
								class="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-bot-a-bg border border-bot-a-border text-primary rounded-full cursor-pointer transition-all hover:bg-primary hover:text-white"
								onClick={() => handleDeclareWinner(botA.name)}
								title={`Declare ${botA.name} the winner`}
							>
								<span class="w-3.5 h-3.5 rounded-full bg-bot-a-bg border border-bot-a-border flex items-center justify-center text-[8px] font-bold shrink-0">
									{botAInitials()}
								</span>
								{botA.name}
							</button>
							<button
								type="button"
								class="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-bot-b-bg border border-bot-b-border text-accent rounded-full cursor-pointer transition-all hover:bg-accent hover:text-white"
								onClick={() => handleDeclareWinner(botB.name)}
								title={`Declare ${botB.name} the winner`}
							>
								<span class="w-3.5 h-3.5 rounded-full bg-bot-b-bg border border-bot-b-border flex items-center justify-center text-[8px] font-bold shrink-0">
									{botBInitials()}
								</span>
								{botB.name}
							</button>
						</div>
					</Show>
				</div>
			</header>

			{/* ── Chat area ──────────────────────────────────── */}
			<div
				class="flex-1 overflow-y-auto px-5 py-6 flex flex-col gap-4"
				ref={setMessageListRef}
			>
				<For each={messages()}>
					{(msg) => {
						const a = isBotA(msg.speaker);
						return (
							<div
								class={`flex items-start gap-3 animate-slide-in ${
									a ? "" : "flex-row-reverse"
								}`}
							>
								{/* Avatar */}
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
									class={`max-w-[75%] rounded-xl px-4 py-3 ${
										a
											? "border border-bot-a-border rounded-tl-sm"
											: "border border-bot-b-border rounded-tr-sm"
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
										<span class="text-text-faint">{msg.personalityName}</span>
										<span class="ml-auto text-text-faint">#{msg.turn}</span>
									</div>
									<p class="text-sm leading-relaxed text-text whitespace-pre-wrap">
										{msg.message}
									</p>
								</div>
							</div>
						);
					}}
				</For>

				{/* Typing indicator — hidden while stopping */}
				<Show when={isThinking() && !isStopping()}>
					<div
						class={`flex items-end gap-3 animate-slide-in ${
							nextIsA() ? "" : "flex-row-reverse"
						}`}
					>
						<div
							class={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
								nextIsA()
									? "bg-bot-a-bg border border-bot-a-border text-primary"
									: "bg-bot-b-bg border border-bot-b-border text-accent"
							}`}
						>
							{nextIsA() ? botAInitials() : botBInitials()}
						</div>
						<div
							class={`rounded-xl px-4 py-3 ${
								nextIsA()
									? "border border-bot-a-border rounded-tl-sm"
									: "border border-bot-b-border rounded-tr-sm"
							}`}
							style={
								nextIsA()
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
							<div class="flex items-center gap-1.5 h-5 px-0.5">
								{[0, 160, 320].map((delay) => (
									<span
										class="w-2 h-2 rounded-full animate-dot-bounce"
										style={{
											"background-color": nextIsA()
												? "var(--color-primary)"
												: "var(--color-accent)",
											"animation-delay": `${delay}ms`,
										}}
									/>
								))}
							</div>
						</div>
					</div>
				</Show>

				{/* Stopping indicator */}
				<Show when={isStopping()}>
					<div class="flex items-center justify-center gap-2 py-3 animate-fade-in">
						<div class="w-1.5 h-1.5 rounded-full bg-text-faint animate-pulse" />
						<span class="text-xs text-text-faint">
							Finishing current response…
						</span>
					</div>
				</Show>

				<Show when={state().value === "idle"}>
					<div class="flex-1 flex items-center justify-center">
						<div class="text-center text-text-muted">
							<MessageSquare size={48} class="mx-auto mb-3 opacity-30" />
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
