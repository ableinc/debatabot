import { invoke } from "@tauri-apps/api/core";
import { createEffect, createSignal, For, Show } from "solid-js";
import logger from "../lib/logger";
import type { BotConfig, LLMProvider, Personality } from "../types";
import { DebateViewpoint } from "../types";

interface SetupScreenProps {
	onBack: () => void;
	onOpenSettings: () => void;
	settings: LLMProvider[];
}

export default function SetupScreen({
	onBack,
	onOpenSettings,
	settings,
}: SetupScreenProps) {
	const defaultProvider = settings.filter((s) => s.isDefault)[0] || null;
	const [topic, setTopic] = createSignal<string>("");
	const [bot1Name, setBot1Name] = createSignal<string>("");
	const [bot2Name, setBot2Name] = createSignal<string>("");
	const [bot1Personality, setBot1Personality] = createSignal<string>("");
	const [bot2Personality, setBot2Personality] = createSignal<string>("");
	const [bot1Viewpoint, setBot1Viewpoint] = createSignal<DebateViewpoint>(
		DebateViewpoint.For,
	);
	const [bot2Viewpoint, setBot2Viewpoint] = createSignal<DebateViewpoint>(
		DebateViewpoint.Against,
	);
	const [personalities, setPersonalities] = createSignal<Personality[]>([]);
	const [error, setError] = createSignal<string>("");
	const [loading, setLoading] = createSignal<boolean>(true);

	// Fetch personalities from Rust backend
	createEffect(async () => {
		try {
			const personals = await invoke<Personality[]>("get_personalities");
			setPersonalities(personals);
		} catch (e) {
			logger.error("Failed to load personalities:", e);
		} finally {
			setLoading(false);
		}
	});

	// Pre-fill bot names with personality defaults
	createEffect(() => {
		const p1 = personalities().find((p) => p.name === bot1Personality());
		if (p1 && !bot1Name()) {
			setBot1Name(p1.botName);
		}
		const p2 = personalities().find((p) => p.name === bot2Personality());
		if (p2 && !bot2Name()) {
			setBot2Name(p2.botName);
		}
	});

	const randomName = () => {
		const names = [
			"Argus",
			"Verity",
			"Nova",
			"Echo",
			"Zephyr",
			"Orion",
			"Lyra",
			"Rex",
			"Aria",
			"Phoenix",
			"Atlas",
			"Willow",
			"Kai",
			"Sage",
			"Blaze",
			"Iris",
			"Jasper",
			"Luna",
			"Mira",
			"Onyx",
		];
		const name = names[Math.floor(Math.random() * names.length)];
		return name;
	};

	const handleRandomBot1 = () => {
		const name = randomName();
		const personality =
			personalities()[Math.floor(Math.random() * personalities().length)];
		setBot1Name(name);
		setBot1Personality(personality?.name || "");
	};

	const handleRandomBot2 = () => {
		const name = randomName();
		const personality =
			personalities()[Math.floor(Math.random() * personalities().length)];
		setBot2Name(name);
		setBot2Personality(personality?.name || "");
	};

	const isValid = () => {
		return (
			isLlmConfigured() &&
			topic().trim().length > 0 &&
			topic().trim().length <= 200 &&
			bot1Name().trim().length > 0 &&
			bot2Name().trim().length > 0 &&
			bot1Personality() &&
			bot2Personality()
		);
	};

	const isLlmConfigured = () => {
		return (
			defaultProvider?.apiKey.trim().length > 0 &&
			defaultProvider?.baseUrl.trim().length > 0
		);
	};

	const startDebate = async () => {
		setError("");
		try {
			const p1 = personalities().find((p) => p.name === bot1Personality());
			const p2 = personalities().find((p) => p.name === bot2Personality());

			if (!p1 || !p2) {
				setError("Please select personalities for both bots.");
				return;
			}

			const botConfig1: BotConfig = {
				name: bot1Name().trim(),
				personality: {
					name: p1.name,
					botName: bot1Name().trim(),
				},
				viewpoint: bot1Viewpoint(),
			};

			const botConfig2: BotConfig = {
				name: bot2Name().trim(),
				personality: {
					name: p2.name,
					botName: bot2Name().trim(),
				},
				viewpoint: bot2Viewpoint(),
			};

			await invoke("start_debate", {
				topic: topic().trim(),
				botA: botConfig1,
				botB: botConfig2,
				setting: defaultProvider,
			});

			onBack();
		} catch (e) {
			logger.error("Failed to start debate:", e);
			setError(`Failed to start debate: ${e}`);
		}
	};

	return (
		<div class="setup-screen">
			<h1>🗣️ Debatabot</h1>

			<Show when={error()}>
				<div class="error-banner">{error()}</div>
			</Show>

			<Show when={!isLlmConfigured() && !loading()}>
				<div class="warning-banner">
					⚠️ LLM settings not configured. Debate cannot start without an API key
					and base URL.
					<button type="button" class="settings-link" onClick={onOpenSettings}>
						⚙️ Open Settings
					</button>
				</div>
			</Show>

			<div class="form-group">
				<label for="topic-input">Debate Topic</label>
				<input
					id="topic-input"
					type="text"
					placeholder='e.g., "Should AI have rights?"'
					value={topic()}
					onInput={(e) => setTopic(e.currentTarget.value)}
				/>
			</div>

			<div class="bot-config">
				<div class="bot-card">
					<h2>🤖 Bot 1</h2>

					<div class="form-group">
						<label for="bot1-name">Name</label>
						<div class="input-with-button">
							<input
								id="bot1-name"
								type="text"
								placeholder={
									personalities().find((p) => p.name === bot1Personality())
										?.botName || "Bot name"
								}
								value={bot1Name()}
								onInput={(e) => setBot1Name(e.currentTarget.value)}
							/>
							<button
								type="button"
								class="random-btn"
								onClick={handleRandomBot1}
							>
								🎲
							</button>
						</div>
					</div>

					<div class="form-group">
						<label for="bot1-personality">Personality</label>
						<select
							id="bot1-personality"
							value={bot1Personality()}
							onChange={(e) => setBot1Personality(e.currentTarget.value)}
						>
							<option value="">Select personality</option>
							<For each={personalities()}>
								{(p) => <option value={p.name}>{p.name}</option>}
							</For>
						</select>
					</div>

					<div class="form-group">
						<div class="viewpoint-toggle">
							<button
								type="button"
								class={bot1Viewpoint() === DebateViewpoint.For ? "active" : ""}
								onClick={() => setBot1Viewpoint(DebateViewpoint.For)}
							>
								For
							</button>
							<button
								type="button"
								class={
									bot1Viewpoint() === DebateViewpoint.Against ? "active" : ""
								}
								onClick={() => setBot1Viewpoint(DebateViewpoint.Against)}
							>
								Against
							</button>
						</div>
					</div>
				</div>

				<div class="bot-card">
					<h2>🤖 Bot 2</h2>

					<div class="form-group">
						<label for="bot2-name">Name</label>
						<div class="input-with-button">
							<input
								id="bot2-name"
								type="text"
								placeholder={
									personalities().find((p) => p.name === bot2Personality())
										?.botName || "Bot name"
								}
								value={bot2Name()}
								onInput={(e) => setBot2Name(e.currentTarget.value)}
							/>
							<button
								type="button"
								class="random-btn"
								onClick={handleRandomBot2}
							>
								🎲
							</button>
						</div>
					</div>

					<div class="form-group">
						<label for="bot2-personality">Personality</label>
						<select
							id="bot2-personality"
							value={bot2Personality()}
							onChange={(e) => setBot2Personality(e.currentTarget.value)}
						>
							<option value="">Select personality</option>
							<For each={personalities()}>
								{(p) => <option value={p.name}>{p.name}</option>}
							</For>
						</select>
					</div>

					<div class="form-group">
						<div class="viewpoint-toggle">
							<button
								type="button"
								class={bot2Viewpoint() === DebateViewpoint.For ? "active" : ""}
								onClick={() => setBot2Viewpoint(DebateViewpoint.For)}
							>
								For
							</button>
							<button
								type="button"
								class={
									bot2Viewpoint() === DebateViewpoint.Against ? "active" : ""
								}
								onClick={() => setBot2Viewpoint(DebateViewpoint.Against)}
							>
								Against
							</button>
						</div>
					</div>
				</div>
			</div>

			<button
				type="button"
				class="start-btn"
				onClick={startDebate}
				disabled={!isValid()}
			>
				{loading()
					? "Loading..."
					: !isLlmConfigured()
						? "⚠️ Configure LLM Settings"
						: "▶ Start Debate"}
			</button>
		</div>
	);
}
