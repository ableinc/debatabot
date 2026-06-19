import { Show } from "solid-js";
import DebateScreen from "./screens/DebateScreen";
import ResultsScreen from "./screens/ResultsScreen";
import SettingsScreen from "./screens/SettingsScreen";
import SetupScreen from "./screens/SetupScreen";
import { createDebateStore } from "./stores/DebateStore";
import type { DebateResult, LlmSettings } from "./types";
import "./App.css";

function App() {
	const store = createDebateStore();

	const startDebate = () => {
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

	const saveSettings = (settings: LlmSettings) => {
		store.setLlmSettings(settings);
	};

	return (
		<main class="app-container">
			<Show when={store.screen() !== "settings"}>
				<button type="button" class="settings-gear" onClick={openSettings}>
					⚙️
				</button>
			</Show>

			<Show when={store.screen() === "setup"}>
				<SetupScreen onBack={startDebate} onOpenSettings={openSettings} />
			</Show>

			<Show when={store.screen() === "debate"}>
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
				/>
			</Show>

			<Show when={store.screen() === "results"}>
				<ResultsScreen
					result={store.results() as DebateResult}
					onNewDebate={newDebate}
				/>
			</Show>

			<Show when={store.screen() === "settings"}>
				<SettingsScreen
					settings={store.llmSettings()}
					onSave={saveSettings}
					onBack={closeSettings}
				/>
			</Show>
		</main>
	);
}

export default App;
