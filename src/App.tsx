import { Show } from "solid-js";
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

	return (
		<main class="app-container">
			<Show when={store.screen() !== "settings"}>
				<button type="button" class="settings-gear" onClick={openSettings}>
					⚙️
				</button>
			</Show>

			<Show when={store.screen() === "setup"}>
				<SetupScreen
					onBack={startDebate}
					onOpenSettings={openSettings}
					userProviders={store.userProviders}
				/>
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
					setResults={store.setResults}
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
					userProviders={store.userProviders}
					acceptedProviders={store.acceptedProviders}
					onSave={store.saveUserProviders}
					onDelete={store.deleteUserProvider}
					onBack={closeSettings}
				/>
			</Show>
		</main>
	);
}

export default App;
