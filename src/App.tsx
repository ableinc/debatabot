import { Show } from "solid-js";
import DebateScreen from "./screens/DebateScreen";
import ResultsScreen from "./screens/ResultsScreen";
import SetupScreen from "./screens/SetupScreen";
import { createDebateStore } from "./stores/DebateStore";
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

	return (
		<main class="app-container">
			<Show when={store.screen() === "setup"}>
				<SetupScreen onBack={startDebate} />
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
				<ResultsScreen result={store.results()!} onNewDebate={newDebate} />
			</Show>
		</main>
	);
}

export default App;
