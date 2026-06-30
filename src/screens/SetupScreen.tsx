import { invoke } from "@tauri-apps/api/core";
import {
	createEffect,
	createMemo,
	createSignal,
	For,
	Show,
} from "solid-js";
import {
	Dices,
	AlertTriangle,
	MessageSquare,
	Settings,
	Zap,
} from "lucide-solid";
import logger from "../lib/logger";
import type { BotConfig, LLMProvider, Personality } from "../types";
import { DebateViewpoint, InvokeEnum } from "../types";

/* ── Topic suggestions ─────────────────────────────────────────── */
const TOPIC_SUGGESTIONS = [
	"Should AI have rights?",
	"Is universal basic income viable?",
	"Nuclear energy: solution or risk?",
	"Should social media be regulated?",
	"Is college education worth it?",
	"Space exploration vs. Earth problems",
];

/* ── Props ─────────────────────────────────────────────────────── */
interface SetupScreenProps {
	onBack: (topic: string, botA: BotConfig, botB: BotConfig) => void;
	onOpenSettings: () => void;
	userProviders: () => LLMProvider[];
}

/* ── Component ─────────────────────────────────────────────────── */
export default function SetupScreen({
	onBack,
	onOpenSettings,
	userProviders: getUserProviders,
}: SetupScreenProps) {
	const [defaultProvider, setDefaultProvider] =
		createSignal<LLMProvider | null>(null);
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
			const _defaultProvider =
				getUserProviders().filter((s: LLMProvider) => s.isDefault)[0] ||
				null;
			setDefaultProvider(_defaultProvider);
			const personals = await invoke<Personality[]>(
				InvokeEnum.GetPersonalities,
			);
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
		return names[Math.floor(Math.random() * names.length)];
	};

	const handleRandomBot1 = () => {
		const name = randomName();
		const pool = personalities();
		const personality = pool[Math.floor(Math.random() * pool.length)];
		setBot1Name(name);
		setBot1Personality(personality?.name || "");
	};

	const handleRandomBot2 = () => {
		const name = randomName();
		const pool = personalities();
		const personality = pool[Math.floor(Math.random() * pool.length)];
		setBot2Name(name);
		setBot2Personality(personality?.name || "");
	};

	const isValid = createMemo(
		() =>
			defaultProvider() &&
			topic().trim().length > 0 &&
			topic().trim().length <= 200 &&
			bot1Name().trim().length > 0 &&
			bot2Name().trim().length > 0 &&
			bot1Personality() &&
			bot2Personality(),
	);

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

			const trimmedTopic = topic().trim();

			await invoke(InvokeEnum.StartDebate, {
				topic: trimmedTopic,
				botA: botConfig1,
				botB: botConfig2,
				setting: defaultProvider(),
			});

			onBack(trimmedTopic, botConfig1, botConfig2);
		} catch (e) {
			logger.error("Failed to start debate:", e);
			setError(`Failed to start debate: ${e}`);
		}
	};

	/* ── Helpers for bot card colouring ────────────────────────── */
	const botAInitials = () =>
		(bot1Name().charAt(0) || "?").toUpperCase();
	const botBInitials = () =>
		(bot2Name().charAt(0) || "?").toUpperCase();

	/* ── Render ────────────────────────────────────────────────── */
	return (
		<div class="flex flex-col items-center px-8 py-10 overflow-y-auto flex-1 gap-8 max-w-5xl mx-auto w-full">
			{/* ── 2.1 Hero Section ──────────────────────────────── */}
			<div class="text-center pt-4 pb-2">
				<div class="flex items-center justify-center gap-3 mb-2">
					<MessageSquare
						size={40}
						strokeWidth={1.5}
						class="text-primary"
					/>
					<h1 class="text-4xl font-bold font-display tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent animate-gradient-x">
						Debatabot
					</h1>
				</div>
				<p class="text-text-muted text-base">
					Pit two AI personalities against each other in a live debate
				</p>
			</div>

			{/* ── Error / Warning Banners ───────────────────────── */}
			<Show when={error()}>
				<div class="w-full max-w-lg bg-error-muted border border-error text-error px-4 py-3 rounded-md text-center text-sm">
					<AlertTriangle size={16} class="inline mr-2 -mt-0.5" />
					{error()}
				</div>
			</Show>

			<Show when={!defaultProvider() && !loading()}>
				<div class="w-full max-w-lg bg-warning-muted border border-warning text-warning px-4 py-3 rounded-md text-center text-sm flex items-center justify-center gap-2 flex-wrap">
					<AlertTriangle size={16} class="shrink-0" />
					<span>
						LLM settings not configured. Debate cannot start without an API key
						and base URL.
					</span>
					<button
						type="button"
						class="shrink-0 bg-warning/20 border border-warning text-warning px-3 py-1.5 rounded-md cursor-pointer font-medium text-xs transition-all hover:bg-warning hover:text-bg"
						onClick={onOpenSettings}
					>
						<Settings size={14} class="inline -mt-0.5 mr-1" />
						Open Settings
					</button>
				</div>
			</Show>

			{/* ── 2.2 Topic Input ───────────────────────────────── */}
			<div class="w-full max-w-2xl flex flex-col gap-2">
				<label for="topic-input" class="text-sm font-medium text-text-muted">
					Debate Topic
				</label>
				<input
					id="topic-input"
					type="text"
					placeholder='e.g., "Should AI have rights?"'
					value={topic()}
					onInput={(e) => setTopic(e.currentTarget.value)}
					class="w-full px-4 py-3.5 bg-surface border border-border rounded-md text-text text-lg placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
				/>
				{/* Suggestion chips */}
				<div class="flex flex-wrap gap-2 pt-1">
					<For each={TOPIC_SUGGESTIONS}>
						{(s) => (
							<button
								type="button"
								class="px-3 py-1 text-xs font-medium bg-surface-light border border-border rounded-full text-text-muted cursor-pointer transition-all hover:border-primary hover:text-primary"
								onClick={() => setTopic(s)}
							>
								{s}
							</button>
						)}
					</For>
				</div>
			</div>

			{/* ── 2.3 Bot Cards ─────────────────────────────────── */}
			<div class="grid grid-cols-2 gap-6 w-full max-w-3xl">
				{/* ── Bot A Card ──────────────────────────────── */}
				<div class="bg-surface border border-bot-a-border rounded-md p-5 flex flex-col gap-4 border-l-[3px] border-l-bot-a shadow-glow-a">
					{/* Avatar + heading */}
					<div class="flex items-center gap-3">
						<div class="w-10 h-10 rounded-full bg-bot-a-bg border border-bot-a-border flex items-center justify-center text-primary font-bold text-sm shrink-0">
							{botAInitials()}
						</div>
						<div class="min-w-0">
							<h2 class="text-lg font-semibold text-primary truncate">
								Bot A
							</h2>
						</div>
					</div>

					{/* Name */}
					<div class="flex flex-col gap-1.5">
						<label for="bot1-name" class="text-xs font-medium text-text-muted">
							Name
						</label>
						<div class="flex gap-2">
							<input
								id="bot1-name"
								type="text"
								placeholder={
									personalities().find(
										(p) => p.name === bot1Personality(),
									)?.botName || "Bot name"
								}
								value={bot1Name()}
								onInput={(e) => setBot1Name(e.currentTarget.value)}
								class="flex-1 px-3 py-2 bg-surface-light border border-border rounded-md text-text text-sm placeholder:text-text-faint focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
							/>
							<button
								type="button"
								class="w-10 flex items-center justify-center bg-surface-light border border-border rounded-md cursor-pointer transition-all hover:bg-surface-hover hover:border-primary"
								title="Randomize name & personality"
								onClick={handleRandomBot1}
							>
								<Dices size={18} class="text-text-muted" />
							</button>
						</div>
					</div>

					{/* Personality — visual cards */}
					<div class="flex flex-col gap-1.5">
						<span class="text-xs font-medium text-text-muted">
							Personality
						</span>
						<div class="grid grid-cols-2 gap-1.5 max-h-44 overflow-y-auto pr-1">
							<For each={personalities()}>
								{(p) => (
									<button
										type="button"
										class={`text-left px-2.5 py-2 rounded-md border text-xs cursor-pointer transition-all ${
											bot1Personality() === p.name
												? "bg-primary-muted border-primary text-primary"
												: "bg-surface-light border-border text-text-muted hover:border-primary/50 hover:text-text"
										}`}
										onClick={() => setBot1Personality(p.name)}
									>
										<div class="font-semibold truncate">{p.name}</div>
										<div class="text-[10px] text-text-faint truncate">
											{p.description}
										</div>
									</button>
								)}
							</For>
						</div>
					</div>

					{/* Viewpoint — segmented control */}
					<div class="flex flex-col gap-1.5">
						<span class="text-xs font-medium text-text-muted">
							Viewpoint
						</span>
						<div class="flex bg-surface-light rounded-md p-0.5 border border-border">
							<button
								type="button"
								class={`flex-1 py-1.5 text-sm font-medium rounded-md cursor-pointer transition-all ${
									bot1Viewpoint() === DebateViewpoint.For
										? "bg-primary text-white shadow-glow-a"
										: "text-text-muted hover:text-text"
								}`}
								onClick={() => setBot1Viewpoint(DebateViewpoint.For)}
							>
								For
							</button>
							<button
								type="button"
								class={`flex-1 py-1.5 text-sm font-medium rounded-md cursor-pointer transition-all ${
									bot1Viewpoint() === DebateViewpoint.Against
										? "bg-primary text-white shadow-glow-a"
										: "text-text-muted hover:text-text"
								}`}
								onClick={() =>
									setBot1Viewpoint(DebateViewpoint.Against)
								}
							>
								Against
							</button>
						</div>
					</div>
				</div>

				{/* ── Bot B Card ──────────────────────────────── */}
				<div class="bg-surface border border-bot-b-border rounded-md p-5 flex flex-col gap-4 border-l-[3px] border-l-bot-b shadow-glow-b">
					{/* Avatar + heading */}
					<div class="flex items-center gap-3">
						<div class="w-10 h-10 rounded-full bg-bot-b-bg border border-bot-b-border flex items-center justify-center text-accent font-bold text-sm shrink-0">
							{botBInitials()}
						</div>
						<div class="min-w-0">
							<h2 class="text-lg font-semibold text-accent truncate">
								Bot B
							</h2>
						</div>
					</div>

					{/* Name */}
					<div class="flex flex-col gap-1.5">
						<label for="bot2-name" class="text-xs font-medium text-text-muted">
							Name
						</label>
						<div class="flex gap-2">
							<input
								id="bot2-name"
								type="text"
								placeholder={
									personalities().find(
										(p) => p.name === bot2Personality(),
									)?.botName || "Bot name"
								}
								value={bot2Name()}
								onInput={(e) => setBot2Name(e.currentTarget.value)}
								class="flex-1 px-3 py-2 bg-surface-light border border-border rounded-md text-text text-sm placeholder:text-text-faint focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
							/>
							<button
								type="button"
								class="w-10 flex items-center justify-center bg-surface-light border border-border rounded-md cursor-pointer transition-all hover:bg-surface-hover hover:border-accent"
								title="Randomize name & personality"
								onClick={handleRandomBot2}
							>
								<Dices size={18} class="text-text-muted" />
							</button>
						</div>
					</div>

					{/* Personality — visual cards */}
					<div class="flex flex-col gap-1.5">
						<span class="text-xs font-medium text-text-muted">
							Personality
						</span>
						<div class="grid grid-cols-2 gap-1.5 max-h-44 overflow-y-auto pr-1">
							<For each={personalities()}>
								{(p) => (
									<button
										type="button"
										class={`text-left px-2.5 py-2 rounded-md border text-xs cursor-pointer transition-all ${
											bot2Personality() === p.name
												? "bg-accent-muted border-accent text-accent"
												: "bg-surface-light border-border text-text-muted hover:border-accent/50 hover:text-text"
										}`}
										onClick={() => setBot2Personality(p.name)}
									>
										<div class="font-semibold truncate">{p.name}</div>
										<div class="text-[10px] text-text-faint truncate">
											{p.description}
										</div>
									</button>
								)}
							</For>
						</div>
					</div>

					{/* Viewpoint — segmented control */}
					<div class="flex flex-col gap-1.5">
						<span class="text-xs font-medium text-text-muted">
							Viewpoint
						</span>
						<div class="flex bg-surface-light rounded-md p-0.5 border border-border">
							<button
								type="button"
								class={`flex-1 py-1.5 text-sm font-medium rounded-md cursor-pointer transition-all ${
									bot2Viewpoint() === DebateViewpoint.For
										? "bg-accent text-white shadow-glow-b"
										: "text-text-muted hover:text-text"
								}`}
								onClick={() => setBot2Viewpoint(DebateViewpoint.For)}
							>
								For
							</button>
							<button
								type="button"
								class={`flex-1 py-1.5 text-sm font-medium rounded-md cursor-pointer transition-all ${
									bot2Viewpoint() === DebateViewpoint.Against
										? "bg-accent text-white shadow-glow-b"
										: "text-text-muted hover:text-text"
								}`}
								onClick={() =>
									setBot2Viewpoint(DebateViewpoint.Against)
								}
							>
								Against
							</button>
						</div>
					</div>
				</div>
			</div>

			{/* ── 2.4 Start Button ──────────────────────────────── */}
			<button
				type="button"
				class={`group relative px-12 py-4 rounded-md text-lg font-semibold border-none cursor-pointer transition-all duration-200 ${
					isValid()
						? "bg-gradient-to-r from-primary to-accent text-white shadow-glow-a hover:scale-105 hover:shadow-[0_0_30px_rgba(99,102,241,0.4),0_0_30px_rgba(244,63,94,0.3)]"
						: "bg-surface-light border border-border text-text-faint cursor-not-allowed"
				}`}
				onClick={startDebate}
				disabled={!isValid()}
			>
				<Zap size={20} class="inline -mt-0.5 mr-2" />
				{loading()
					? "Loading..."
					: !defaultProvider()
						? "Configure LLM Settings"
						: "Start Debate"}
			</button>
		</div>
	);
}
