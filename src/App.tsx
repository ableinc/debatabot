import { Settings } from "lucide-solid";
import { onMount, Show } from "solid-js";
import ToastContainer from "./components/ToastContainer";
import DebateScreen from "./screens/DebateScreen";
import ResultsScreen from "./screens/ResultsScreen";
import SettingsScreen from "./screens/SettingsScreen";
import SetupScreen from "./screens/SetupScreen";
import { createDebateStore } from "./stores/DebateStore";
import type { BotConfig, DebateResult } from "./types";
import "./App.css";

function App() {
	const store = createDebateStore();

	const startDebate = (
		debTopic: string,
		debBotA: BotConfig,
		debBotB: BotConfig,
	) => {
		store.setTopic(debTopic);
		store.setBots([debBotA, debBotB]);
		store.setScreen("debate");
		store.setMessages([]);
		store.setDebateState({ value: "idle" });
	};

	const newDebate = () => {
		store.resetDebate();
		store.setScreen("setup");
	};

	const openSettings = () => {
		store.setScreen("settings");
	};

	const closeSettings = () => {
		store.setScreen("setup");
	};

	/* ── 6.5 Keyboard Shortcuts ──────────────────────────────────── */
	onMount(() => {
		const handler = (e: KeyboardEvent) => {
			// Don't intercept when typing in inputs/textareas
			const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
			const isInput =
				tag === "input" ||
				tag === "textarea" ||
				tag === "select" ||
				(e.target as HTMLElement)?.isContentEditable;

			if (e.key === "Escape") {
				e.preventDefault();
				if (store.screen() === "settings") {
					closeSettings();
				} else if (store.screen() === "results") {
					newDebate();
				} else if (store.screen() === "debate") {
					// Escape during debate → go to results
					store.setScreen("results");
				}
			}

			// Enter to start debate (only on setup screen, not in inputs)
			if (e.key === "Enter" && !isInput && store.screen() === "setup") {
				e.preventDefault();
				// Dispatch a custom event that SetupScreen can listen on
				window.dispatchEvent(new CustomEvent("app:enter-start"));
			}

			// Space to stop debate (only on debate screen)
			if (e.key === " " && !isInput && store.screen() === "debate") {
				e.preventDefault();
				window.dispatchEvent(new CustomEvent("app:space-stop"));
			}
		};

		window.addEventListener("keydown", handler);
		return () => window.removeEventListener("keydown", handler);
	});

	/* ── Render ─────────────────────────────────────────────────── */
	return (
		<main class="app-container">
			{/* 6.2 Toast notifications */}
			<ToastContainer />

			{/* Settings gear — always visible except on settings screen */}
			<Show when={store.screen() !== "settings"}>
				<button
					type="button"
					class="fixed top-4 right-4 z-50 w-11 h-11 flex items-center justify-center bg-surface border border-border rounded-full cursor-pointer transition-transform duration-200 hover:rotate-30"
					onClick={openSettings}
				>
					<Settings size={20} class="text-text-muted" />
				</button>
			</Show>

			{/* 6.1 Screen transitions */}
			<Show when={store.screen() === "setup"}>
				<div class="screen-enter">
					<SetupScreen
						onBack={startDebate}
						onOpenSettings={openSettings}
						userProviders={store.userProviders}
					/>
				</div>
			</Show>

			<Show when={store.screen() === "debate"}>
				<div class="screen-enter">
					<DebateScreen
						topic={store.topic()}
						botA={{
							name: store.bots()[0].name,
							personalityName: store.bots()[0].personality.name,
						}}
						botB={{
							name: store.bots()[1].name,
							personalityName: store.bots()[1].personality.name,
						}}
						onBack={() => store.setScreen("results")}
						setResults={store.setResults}
					/>
				</div>
			</Show>

			<Show when={store.screen() === "results"}>
				<div class="screen-enter">
					<ResultsScreen
						result={store.results() as DebateResult}
						onNewDebate={newDebate}
					/>
				</div>
			</Show>

			<Show when={store.screen() === "settings"}>
				<div class="screen-enter">
					<SettingsScreen
						userProviders={store.userProviders}
						acceptedProviders={store.acceptedProviders}
						onSave={store.saveUserProviders}
						onDelete={store.deleteUserProvider}
						onBack={closeSettings}
					/>
				</div>
			</Show>
		</main>
	);
}

export default App;
