import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { createEffect, createSignal, For, Show } from "solid-js";
import type { DebateMessage, DebateResult, DebateState } from "../types";

interface DebateScreenProps {
	topic: string;
	botA: { name: string; personalityName: string };
	botB: { name: string; personalityName: string };
	onBack: () => void;
}

export default function DebateScreen({
	topic,
	botA,
	botB,
	onBack,
}: DebateScreenProps) {
	const [messages, setMessages] = createSignal<DebateMessage[]>([]);
	const [state, setState] = createSignal<DebateState>({ value: "idle" });
	const [isThinking, setIsThinking] = createSignal(false);
	const [lastSpeaker, setLastSpeaker] = createSignal<string | null>(null);
	const [messageListRef, setMessageListRef] =
		createSignal<HTMLDivElement | null>(null);

	const scrollToBottom = () => {
		setTimeout(() => {
			const el = messageListRef();
			if (el) {
				el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
			}
		}, 50);
	};

	createEffect(async () => {
		// Listen for debate messages
		const unlistenMessage = await listen<DebateMessage>(
			"debate_message",
			(event) => {
				setMessages((prev) => [...prev, event.payload]);
				setLastSpeaker(event.payload.speaker);
				setIsThinking(false);
				scrollToBottom();
			},
		);

		// Listen for state changes
		const unlistenState = await listen<DebateState>(
			"debate_state_changed",
			(event) => {
				setState(event.payload);
				if (event.payload.value === "in_progress") {
					setIsThinking(true);
				}
			},
		);

		// Listen for debate finished
		const unlistenFinished = await listen<DebateResult>(
			"debate_finished",
			() => {
				onBack();
			},
		);

		// Initial thinking state
		setState({ value: "setting_up" });

		return () => {
			unlistenMessage();
			unlistenState();
			unlistenFinished();
		};
	});

	const stopDebate = async () => {
		try {
			await invoke("stop_debate");
		} catch (e) {
			console.error("Failed to stop debate:", e);
		}
	};

	const declareWinner = async (botName: string) => {
		try {
			await invoke("declare_winner", { botName });
			onBack();
		} catch (e) {
			console.error("Failed to declare winner:", e);
		}
	};

	return (
		<div class="debate-screen">
			<header class="debate-header">
				<div class="debate-info">
					<h2 class="topic-text">{topic}</h2>
					<span class="turn-indicator">Turn: {state().turn || 0}</span>
				</div>
				<div class="debate-controls">
					<button
						type="button"
						class="control-btn stop-btn"
						onClick={stopDebate}
					>
						⏹ Stop
					</button>
					<Show when={state().value === "in_progress"}>
						<div class="declare-winner">
							<span class="winner-text">🏆 Declare Winner:</span>
							<button
								type="button"
								class="control-btn winner-btn"
								onClick={() => declareWinner(botA.name)}
							>
								{botA.name}
							</button>
							<button
								type="button"
								class="control-btn winner-btn"
								onClick={() => declareWinner(botB.name)}
							>
								{botB.name}
							</button>
						</div>
					</Show>
				</div>
			</header>

			<div class="message-list" ref={setMessageListRef}>
				<For each={messages()}>
					{(msg) => {
						const isBotA = msg.speaker === botA.name;
						const botStyle = isBotA ? "bot-a" : "bot-b";
						return (
							<div class={`message-bubble ${botStyle}`}>
								<div class="message-header">
									<span class="message-speaker">{msg.speaker}</span>
									<span class="message-personality">{msg.personalityName}</span>
									<span class="message-turn">Turn {msg.turn}</span>
								</div>
								<p class="message-content">{msg.message}</p>
							</div>
						);
					}}
				</For>

				<Show when={isThinking()}>
					<div class="thinking-indicator">
						<div class="thinking-dots">
							<span></span>
							<span></span>
							<span></span>
						</div>
						<span>{lastSpeaker()} is thinking...</span>
					</div>
				</Show>
			</div>

			<Show when={state().value === "idle"}>
				<div class="debate-start-prompt">
					<p>Ready to debate? The bots will begin shortly...</p>
				</div>
			</Show>
		</div>
	);
}
