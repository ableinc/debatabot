import { invoke } from "@tauri-apps/api/core";
import {
	ArrowLeft,
	ChevronLeft,
	ChevronRight,
	Clock,
	Handshake,
	MessageSquare,
	Trophy,
} from "lucide-solid";
import {
	createMemo,
	createSignal,
	For,
	onMount,
	Show,
	Suspense,
} from "solid-js";
import logger from "../lib/logger";
import type { DebatePage, DebateRecord, HistoryMessage } from "../types";
import { InvokeEnum } from "../types";

const PAGE_SIZE = 10;

/* ── Helpers ───────────────────────────────────────────────────── */
function formatDate(iso: string): string {
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return iso;
	return d.toLocaleDateString(undefined, {
		month: "short",
		day: "numeric",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
}

function formatTime(unix: number): string {
	return new Date(unix * 1000).toLocaleTimeString(undefined, {
		hour: "2-digit",
		minute: "2-digit",
	});
}

/* ── Props ─────────────────────────────────────────────────────── */
interface HistoryScreenProps {
	onBack: () => void;
}

/* ── Component ─────────────────────────────────────────────────── */
export default function HistoryScreen({ onBack }: HistoryScreenProps) {
	// ── List state ──────────────────────────────────────────────
	const [page, setPage] = createSignal(0);
	const [debatePage, setDebatePage] = createSignal<DebatePage>({
		debates: [],
		total: 0,
	});
	const [listLoading, setListLoading] = createSignal(false);
	const [listError, setListError] = createSignal<string | null>(null);

	// ── Detail state ────────────────────────────────────────────
	const [selected, setSelected] = createSignal<DebateRecord | null>(null);
	const [messages, setMessages] = createSignal<HistoryMessage[]>([]);
	const [detailLoading, setDetailLoading] = createSignal(false);

	// ── Derived ─────────────────────────────────────────────────
	const totalPages = createMemo(() =>
		Math.max(1, Math.ceil(debatePage().total / PAGE_SIZE)),
	);

	// ── Data loading ────────────────────────────────────────────
	const loadPage = async (p: number) => {
		setListLoading(true);
		setListError(null);
		try {
			const result = await invoke<DebatePage>(InvokeEnum.GetDebateHistory, {
				page: p,
				pageSize: PAGE_SIZE,
			});
			setDebatePage(result);
			setPage(p);
		} catch (e) {
			const msg = String(e);
			setListError(msg);
			logger.error("Failed to load history:", e);
		} finally {
			setListLoading(false);
		}
	};

	const openDebate = async (debate: DebateRecord) => {
		setSelected(debate);
		setDetailLoading(true);
		try {
			const msgs = await invoke<HistoryMessage[]>(InvokeEnum.GetDebateDetail, {
				debateId: debate.id,
			});
			setMessages(msgs);
		} catch (e) {
			logger.error("Failed to load debate detail:", e);
			setMessages([]);
		} finally {
			setDetailLoading(false);
		}
	};

	const closeDetail = () => {
		setSelected(null);
		setMessages([]);
	};

	onMount(() => loadPage(0));

	/* ── Detail view ──────────────────────────────────────────── */
	const DetailView = () => {
		const debate = selected()!;
		const isBotA = (speaker: string) => speaker === debate.botA;
		const aInit = debate.botA.charAt(0).toUpperCase();
		const bInit = debate.botB.charAt(0).toUpperCase();

		return (
			<div class="flex flex-col h-full overflow-hidden">
				{/* Header */}
				<header class="bg-surface border-b border-border px-5 py-3 flex items-center gap-3 shrink-0">
					<button
						type="button"
						class="w-8 h-8 flex items-center justify-center rounded-lg border border-border text-text-muted cursor-pointer hover:bg-surface-light transition-colors shrink-0"
						onClick={closeDetail}
					>
						<ArrowLeft size={15} />
					</button>

					<div class="flex-1 min-w-0">
						<h2 class="text-sm font-semibold text-text truncate">
							{debate.topic}
						</h2>
						<p class="text-xs text-text-faint mt-0.5">
							{debate.botA} vs {debate.botB} · {formatDate(debate.timestamp)}
						</p>
					</div>

					<Show
						when={debate.winner !== null}
						fallback={
							<div class="flex items-center gap-1.5 px-2.5 py-1 bg-warning-muted border border-warning/30 rounded-full shrink-0">
								<Handshake size={12} class="text-warning" />
								<span class="text-xs text-warning font-medium">Draw</span>
							</div>
						}
					>
						<div class="flex items-center gap-1.5 px-2.5 py-1 bg-success-muted border border-success/30 rounded-full shrink-0">
							<Trophy size={12} class="text-success" />
							<span class="text-xs text-success font-medium">
								{debate.winner}
							</span>
						</div>
					</Show>
				</header>

				{/* Messages */}
				<div class="flex-1 overflow-y-auto px-5 py-6 flex flex-col gap-4">
					<Show
						when={!detailLoading()}
						fallback={
							<div class="flex-1 flex items-center justify-center">
								<div class="flex flex-col items-center gap-3 text-text-faint">
									<div class="w-6 h-6 border-2 border-primary/40 border-t-primary rounded-full animate-spin" />
									<span class="text-sm">Loading messages…</span>
								</div>
							</div>
						}
					>
						<Show
							when={messages().length > 0}
							fallback={
								<div class="flex-1 flex items-center justify-center text-text-faint text-sm">
									No messages found for this debate.
								</div>
							}
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
												{a ? aInit : bInit}
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
													<span class="text-text-faint">
														{msg.personalityName}
													</span>
													<span class="ml-auto text-text-faint">
														#{msg.turn} · {formatTime(msg.timestamp)}
													</span>
												</div>
												<p class="text-sm leading-relaxed text-text whitespace-pre-wrap">
													{msg.message}
												</p>
											</div>
										</div>
									);
								}}
							</For>
						</Show>
					</Show>
				</div>
			</div>
		);
	};

	/* ── List view ────────────────────────────────────────────── */
	const ListView = () => (
		<div class="flex flex-col h-full overflow-hidden">
			{/* Header */}
			<header class="bg-surface border-b border-border px-5 py-3 flex items-center gap-3 shrink-0">
				<button
					type="button"
					class="w-8 h-8 flex items-center justify-center rounded-lg border border-border text-text-muted cursor-pointer hover:bg-surface-light transition-colors shrink-0"
					onClick={onBack}
				>
					<ArrowLeft size={15} />
				</button>
				<div class="flex items-center gap-2 flex-1 min-w-0">
					<Clock size={15} class="text-primary shrink-0" />
					<h2 class="text-sm font-semibold text-text">Debate History</h2>
					<Show when={debatePage().total > 0}>
						<span class="text-xs text-text-faint bg-surface-light px-2 py-0.5 rounded-full">
							{debatePage().total}
						</span>
					</Show>
				</div>
			</header>

			{/* Body */}
			<div class="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-3">
				<Show
					when={!listLoading()}
					fallback={
						<div class="flex-1 flex items-center justify-center">
							<div class="flex flex-col items-center gap-3 text-text-faint">
								<div class="w-6 h-6 border-2 border-primary/40 border-t-primary rounded-full animate-spin" />
								<span class="text-sm">Loading history…</span>
							</div>
						</div>
					}
				>
					<Show
						when={listError() === null}
						fallback={
							<div class="flex-1 flex items-center justify-center">
								<div class="text-center text-error text-sm">
									<p class="font-medium mb-1">Failed to load history</p>
									<p class="text-text-faint">{listError()}</p>
									<button
										type="button"
										class="mt-3 px-4 py-2 text-xs font-medium border border-border rounded-lg hover:bg-surface-light cursor-pointer transition-colors"
										onClick={() => loadPage(page())}
									>
										Retry
									</button>
								</div>
							</div>
						}
					>
						<Show
							when={debatePage().debates.length > 0}
							fallback={
								<div class="flex-1 flex items-center justify-center">
									<div class="text-center text-text-faint">
										<MessageSquare size={48} class="mx-auto mb-3 opacity-30" />
										<p class="text-sm">No debates yet.</p>
										<p class="text-xs mt-1 text-text-faint/70">
											Completed debates will appear here.
										</p>
									</div>
								</div>
							}
						>
							<For each={debatePage().debates}>
								{(debate) => (
									<button
										type="button"
										class="w-full text-left bg-surface border border-border rounded-xl px-4 py-3.5 cursor-pointer transition-all hover:border-primary/40 hover:bg-surface-light group"
										onClick={() => openDebate(debate)}
									>
										<div class="flex items-start justify-between gap-3">
											{/* Left: topic + bots */}
											<div class="flex-1 min-w-0">
												<p class="text-sm font-semibold text-text truncate group-hover:text-primary transition-colors">
													{debate.topic}
												</p>
												<p class="text-xs text-text-faint mt-0.5">
													<span class="text-primary/80">{debate.botA}</span>
													<span class="mx-1.5 opacity-50">vs</span>
													<span class="text-accent/80">{debate.botB}</span>
												</p>
											</div>

											{/* Right: winner badge + meta */}
											<div class="flex flex-col items-end gap-1.5 shrink-0">
												<Show
													when={debate.winner !== null}
													fallback={
														<div class="flex items-center gap-1 px-2 py-0.5 bg-warning-muted border border-warning/30 rounded-full">
															<Handshake size={10} class="text-warning" />
															<span class="text-[10px] text-warning font-medium">
																Draw
															</span>
														</div>
													}
												>
													<div class="flex items-center gap-1 px-2 py-0.5 bg-success-muted border border-success/30 rounded-full">
														<Trophy size={10} class="text-success" />
														<span class="text-[10px] text-success font-medium truncate max-w-[80px]">
															{debate.winner}
														</span>
													</div>
												</Show>
												<span class="text-[10px] text-text-faint">
													{formatDate(debate.timestamp)}
												</span>
											</div>
										</div>

										{/* Footer row: turns + messages */}
										<div class="flex items-center gap-3 mt-2.5 pt-2.5 border-t border-border/50 text-[11px] text-text-faint">
											<span>{debate.totalTurns} turns</span>
											<span class="opacity-40">·</span>
											<span>{debate.messageCount} messages</span>
										</div>
									</button>
								)}
							</For>
						</Show>
					</Show>
				</Show>
			</div>

			{/* Pagination */}
			<Show when={debatePage().total > PAGE_SIZE}>
				<div class="border-t border-border px-5 py-3 flex items-center justify-between shrink-0 bg-surface">
					<span class="text-xs text-text-faint">
						Page {page() + 1} of {totalPages()}
					</span>
					<div class="flex items-center gap-2">
						<button
							type="button"
							disabled={page() === 0 || listLoading()}
							class="w-8 h-8 flex items-center justify-center rounded-lg border border-border text-text-muted cursor-pointer hover:bg-surface-light transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
							onClick={() => loadPage(page() - 1)}
						>
							<ChevronLeft size={15} />
						</button>
						<button
							type="button"
							disabled={page() + 1 >= totalPages() || listLoading()}
							class="w-8 h-8 flex items-center justify-center rounded-lg border border-border text-text-muted cursor-pointer hover:bg-surface-light transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
							onClick={() => loadPage(page() + 1)}
						>
							<ChevronRight size={15} />
						</button>
					</div>
				</div>
			</Show>
		</div>
	);

	/* ── Render ───────────────────────────────────────────────── */
	return (
		<Show when={selected() !== null} fallback={<ListView />}>
			<DetailView />
		</Show>
	);
}
