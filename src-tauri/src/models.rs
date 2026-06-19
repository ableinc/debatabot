use serde::{Deserialize, Serialize};
use crate::personality::Personality;

/// What side of the topic the bot argues
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum DebateViewpoint {
    For,
    Against,
}

/// Configuration for a single bot in the debate
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BotConfig {
    pub name: String,
    pub personality: Personality,
    pub viewpoint: DebateViewpoint,
}

/// The current state of a debate session
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub enum DebateState {
    #[default]
    Idle,
    SettingUp,
    InProgress {
        turn: u32,
    },
    Finished {
        winner: Option<String>, // None = Nil/draw
    },
}

/// A single message in the debate
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DebateMessage {
    pub speaker: String,
    pub personality_name: String,
    pub message: String,
    pub turn: u32,
    pub timestamp: u64,
}

/// The result of a finished debate
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DebateResult {
    pub topic: String,
    pub winner: Option<String>, // None = Nil/draw
    pub messages: Vec<DebateMessage>,
    pub total_turns: u32,
}
