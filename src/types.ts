export enum DebateViewpoint {
	For = "for",
	Against = "against",
}

export interface BotConfig {
	name: string;
	personality: {
		name: string; // personality display name (e.g. "Logical")
		botName: string; // bot's name (e.g. "Cortex")
	};
	viewpoint: DebateViewpoint;
}

export type DebateStateValue =
	| "idle"
	| "setting_up"
	| "in_progress"
	| "finished";

export interface DebateState {
	value: DebateStateValue;
	turn?: number;
}

export interface DebateMessage {
	speaker: string; // bot name (e.g. "Cortex")
	personalityName: string; // personality (e.g. "Logical")
	message: string;
	turn: number;
	timestamp: number;
}

export interface DebateResult {
	topic: string;
	winner: string | null; // null = Nil/draw
	messages: DebateMessage[];
	totalTurns: number;
}

export interface Personality {
	name: string;
	botName: string;
	description: string;
	speechStyle: string;
	weakness: string;
}

export type AppScreen = "setup" | "debate" | "results" | "settings";

/** LLM settings persisted in SQLite */
export interface LlmSettings {
	apiKey: string;
	baseUrl: string;
	model: string;
}
