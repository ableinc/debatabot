import {
	ChevronDown,
	ChevronUp,
	Handshake,
	MessageSquare,
	Sparkles,
	Trophy,
	Zap,
} from "lucide-solid";
import { createMemo, createSignal, For, Show } from "solid-js";
import type { DebateResult } from "../types";

/* ── Props ─────────────────────────────────────────────────────── */
interface ResultsScreenProps {
	result: DebateResult;
	onNewDebate: () => void;
}

/* ── Confetti particle colours ─────────────────────────────────── */
const CONFETTI_COLORS = [
	"#6366f1", // primary (indigo)
	"#f43f5e", // accent (rose)
	"#22c55e", // success (emerald)
	"#f59e0b", // warning (amber)
	"#818cf8", // primary-hover
	"#fb7185", // accent-hover
];

/** Generate N confetti particles with randomised CSS properties. */
function createParticles(count: number) {
	return Array.from({ length: count }, (_, i) => ({
		id: i,
		left: `${Math.random() * 100}%`,
		width: `${4 + Math.random() * 6}px`,
		height: `${4 + Math.random() * 6}px`,
		background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
		animationDelay: `${Math.random() * 2}s`,
		animationDuration: `${2 + Math.random() * 2}s`,
		borderRadius: Math.random() > 0.5 ? "50%" : "2px",
	}));
}

/* ── Component ─────────────────────────────────────────────────── */
export default function ResultsScreen({
	result,
	onNewDebate,
}: ResultsScreenProps) {
	const hasWinner = result.winner !== null;
	const particles = createParticles(40);

	// Determine which speaker is Bot A (first speaker in messages).
	const botAName = createMemo(() => {
		if (result.messages.length === 0) return "";
		return result.messages[0].speaker;
	});
	const isBotA = (speaker: string) => speaker === botAName();

	const formatDate = (timestamp: number) => {
		return new Date(timestamp * 1000).toLocaleTimeString();
	};

	// ── Transcript collapse state ─────────────────────────────
	const [transcriptOpen, setTranscriptOpen] = createSignal(true);

	/* ── Render ──────────────────────────────────────────────── */
	return (
		<div class="flex flex-col h-full overflow-y-auto">
			<div class="flex flex-col items-center px-8 py-10 gap-8 max-w-4xl mx-auto w-full">
				{/* ── 4.1 / 4.2 Winner Celebration / Draw Banner ─── */}
				<Show
					when={hasWinner}
					fallback={
						/* ── Draw state ─────────────────────────────── */
						<div class="w-full rounded-lg border border-warning/40 bg-gradient-to-br from-surface via-surface-light to-surface text-center py-12 px-8 relative overflow-hidden">
							<div class="relative z-10 flex flex-col items-center gap-3">
								<div class="w-20 h-20 rounded-full bg-warning-muted border-2 border-warning flex items-center justify-center mb-2">
									<Handshake size={40} class="text-warning" />
								</div>
								<h2 class="text-3xl font-bold font-display text-text">
									No Consensus Reached
								</h2>
								<p class="text-text-muted text-base">
									The debate ended in a draw — neither side prevailed
								</p>
							</div>
						</div>
					}
				>
					{/* ── Winner banner with confetti ──────────────── */}
					<div class="w-full rounded-lg border border-primary/40 bg-gradient-to-br from-primary/20 via-surface-light to-accent/20 text-center py-12 px-8 relative overflow-hidden">
						{/* Confetti particles */}
						<div class="confetti-container absolute inset-0 overflow-hidden pointer-events-none">
							<For each={particles}>
								{(p) => (
									<div
										class="confetti-particle absolute"
										style={{
											left: p.left,
											top: "-10px",
											width: p.width,
											height: p.height,
											background: p.background,
											"animation-delay": p.animationDelay,
											"animation-duration": p.animationDuration,
											"border-radius": p.borderRadius,
										}}
									/>
								)}
							</For>
						</div>

						<div class="relative z-10 flex flex-col items-center gap-3">
							<div class="w-20 h-20 rounded-full bg-primary-muted border-2 border-primary flex items-center justify-center mb-2 shadow-glow-a">
								<Trophy size={40} class="text-primary" />
							</div>
							<h2 class="text-3xl font-bold font-display bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
								{result.winner} Wins!
							</h2>
							<p class="text-text-muted text-base">The debate has concluded</p>
						</div>
					</div>
				</Show>

				{/* ── 4.3 Summary Cards (glass-morphism) ──────────── */}
				<div class="grid grid-cols-3 gap-4 w-full">
					{/* Topic */}
					<div class="bg-surface/60 backdrop-blur-sm border border-border/60 rounded-lg px-5 py-4 flex flex-col items-center gap-2 text-center">
						<MessageSquare size={20} class="text-primary" />
						<span class="text-xs text-text-muted font-medium uppercase tracking-wider">
							Topic
						</span>
						<span class="text-sm font-semibold text-text truncate max-w-full">
							{result.topic}
						</span>
					</div>

					{/* Total Turns */}
					<div class="bg-surface/60 backdrop-blur-sm border border-border/60 rounded-lg px-5 py-4 flex flex-col items-center gap-2 text-center">
						<Sparkles size={20} class="text-accent" />
						<span class="text-xs text-text-muted font-medium uppercase tracking-wider">
							Total Turns
						</span>
						<span class="text-2xl font-bold font-display text-text">
							{result.totalTurns}
						</span>
					</div>

					{/* Winner */}
					<div class="bg-surface/60 backdrop-blur-sm border border-border/60 rounded-lg px-5 py-4 flex flex-col items-center gap-2 text-center">
						<Trophy
							size={20}
							class={hasWinner ? "text-success" : "text-warning"}
						/>
						<span class="text-xs text-text-muted font-medium uppercase tracking-wider">
							Result
						</span>
						<span class="text-sm font-semibold text-text">
							{hasWinner ? result.winner : "Draw (Nil)"}
						</span>
					</div>
				</div>

				{/* ── 4.4 Transcript (collapsible accordion) ──────── */}
				<div class="w-full bg-surface/60 backdrop-blur-sm border border-border/60 rounded-lg overflow-hidden">
					{/* Accordion header */}
					<button
						type="button"
						class="w-full flex items-center justify-between px-5 py-4 cursor-pointer transition-colors hover:bg-surface-hover/50"
						onClick={() => setTranscriptOpen((v) => !v)}
					>
						<div class="flex items-center gap-2.5">
							<MessageSquare size={18} class="text-text-muted" />
							<h3 class="text-sm font-semibold text-text">Debate Transcript</h3>
							<span class="text-xs text-text-faint bg-surface-light px-2 py-0.5 rounded-full">
								{result.messages.length} messages
							</span>
						</div>
						<Show
							when={transcriptOpen()}
							fallback={<ChevronDown size={18} class="text-text-muted" />}
						>
							<ChevronUp size={18} class="text-text-muted" />
						</Show>
					</button>

					{/* Accordion body */}
					<Show when={transcriptOpen()}>
						<div class="border-t border-border/60 px-5 py-4 max-h-[400px] overflow-y-auto flex flex-col gap-3">
							<For each={result.messages}>
								{(msg) => {
									const a = isBotA(msg.speaker);
									const isWinner = result.winner === msg.speaker;
									return (
										<div
											class={`flex items-start gap-3 rounded-md px-3 py-2.5 transition-colors ${
												isWinner
													? a
														? "bg-bot-a-bg border border-bot-a-border"
														: "bg-bot-b-bg border border-bot-b-border"
													: "bg-surface-light/40"
											}`}
										>
											{/* Avatar */}
											<div
												class={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
													a
														? "bg-bot-a-bg border border-bot-a-border text-primary"
														: "bg-bot-b-bg border border-bot-b-border text-accent"
												}`}
											>
												{msg.speaker.charAt(0).toUpperCase()}
											</div>

											{/* Content */}
											<div class="flex-1 min-w-0">
												<div
													class={`flex items-center gap-2 mb-1 text-xs ${
														isWinner ? "" : ""
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
													<span class="text-text-faint ml-auto shrink-0">
														Turn {msg.turn} · {formatDate(msg.timestamp)}
													</span>
												</div>
												<p
													class={`text-sm leading-relaxed whitespace-pre-wrap ${
														isWinner ? "text-text" : "text-text-muted"
													}`}
												>
													{msg.message}
												</p>
											</div>
										</div>
									);
								}}
							</For>
						</div>
					</Show>
				</div>

				{/* ── 4.5 New Debate button (same as Setup screen) ── */}
				<button
					type="button"
					class="group relative px-10 py-4 rounded-md text-lg font-semibold border-none bg-gradient-to-r from-primary to-accent text-white shadow-glow-a cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-[0_0_30px_rgba(99,102,241,0.4),0_0_30px_rgba(244,63,94,0.3)]"
					onClick={onNewDebate}
				>
					<Zap size={20} class="inline -mt-0.5 mr-2" />
					New Debate
				</button>

				{/* Bottom spacer */}
				<div class="h-8" />
			</div>
		</div>
	);
}
