import { For, Show } from "solid-js";
import type { DebateResult } from "../types";

interface ResultsScreenProps {
	result: DebateResult;
	onNewDebate: () => void;
}

export default function ResultsScreen({
	result,
	onNewDebate,
}: ResultsScreenProps) {
	const hasWinner = result.winner !== null;

	const formatDate = (timestamp: number) => {
		return new Date(timestamp * 1000).toLocaleTimeString();
	};

	return (
		<div class="results-screen">
			<div class="results-header">
				<Show when={hasWinner}>
					<div class="winner-banner">
						<span class="winner-trophy">🏆</span>
						<h2>{result.winner} Wins!</h2>
						<p>The debate has concluded</p>
					</div>
				</Show>
				<Show when={!hasWinner}>
					<div class="draw-banner">
						<span class="draw-icon">🤝</span>
						<h2>No Consensus Reached</h2>
						<p>The debate ended in a draw</p>
					</div>
				</Show>
			</div>

			<div class="results-content">
				<div class="results-summary">
					<h3>Debate Summary</h3>
					<div class="summary-row">
						<span class="summary-label">Topic:</span>
						<span class="summary-value">{result.topic}</span>
					</div>
					<div class="summary-row">
						<span class="summary-label">Total Turns:</span>
						<span class="summary-value">{result.totalTurns}</span>
					</div>
					<div class="summary-row">
						<span class="summary-label">Result:</span>
						<span class="summary-value">
							{hasWinner ? `Victory for ${result.winner}` : "Draw (Nil)"}
						</span>
					</div>
				</div>

				<div class="debate-transcript">
					<h3>Debate Transcript</h3>
					<div class="transcript-list">
						<For each={result.messages}>
							{(msg) => {
								const isWinner = result.winner === msg.speaker;
								return (
									<div
										class={`transcript-entry ${isWinner ? "winner-msg" : ""}`}
									>
										<div class="transcript-header">
											<span class="transcript-speaker">
												{msg.speaker} ({msg.personalityName})
											</span>
											<span class="transcript-turn">Turn {msg.turn}</span>
											<span class="transcript-time">
												{formatDate(msg.timestamp)}
											</span>
										</div>
										<p class="transcript-content">{msg.message}</p>
									</div>
								);
							}}
						</For>
					</div>
				</div>
			</div>

			<div class="results-actions">
				<button type="button" class="new-debate-btn" onClick={onNewDebate}>
					🔄 New Debate
				</button>
			</div>
		</div>
	);
}
