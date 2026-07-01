use std::collections::VecDeque;
use tokio::sync::mpsc;
use tokio::sync::oneshot;

use crate::db::LLMProvider;
use crate::llm::{ChatMessage, LlmError};
use crate::models::*;
use crate::personality::build_system_prompt;

/// A single bot agent that can respond to debate prompts
pub struct BotAgent {
    config: BotConfig,
    llm_provider: LLMProvider,
}

impl BotAgent {
    pub fn new(config: BotConfig, llm_provider: LLMProvider) -> Self {
        Self {
            config,
            llm_provider,
        }
    }

    pub fn config(&self) -> &BotConfig {
        &self.config
    }

    /// Generate a response for the bot given the topic and conversation history
    pub async fn respond(
        &self,
        topic: &str,
        history: &[&DebateMessage],
    ) -> Result<String, LlmError> {
        let viewpoint_str = match self.config.viewpoint {
            DebateViewpoint::For => "FOR",
            DebateViewpoint::Against => "AGAINST",
        };

        let system_prompt = build_system_prompt(&self.config.personality, topic, viewpoint_str);

        // Build conversation messages with proper role alternation
        let mut messages = vec![ChatMessage {
            role: "system".to_string(),
            content: system_prompt.clone(),
        }];

        // Reconstruct proper user/assistant role alternation from history.
        // This bot's own turns are "assistant"; the opponent's turns are "user".
        for entry in history {
            let role = if entry.speaker == self.config.personality.bot_name {
                "assistant"
            } else {
                "user"
            };
            messages.push(ChatMessage {
                role: role.to_string(),
                content: format!(
                    "{} ({}): {}",
                    entry.speaker, entry.personality_name, entry.message
                ),
            });
        }

        // Send the next turn as "user" to signal it's the bot's turn to respond
        messages.push(ChatMessage {
            role: "user".to_string(),
            content: format!(
                "It's your turn. Respond to the debate:

Topic: {}\nYour stance: {}",
                topic, viewpoint_str
            ),
        });

        let response = self.llm_provider.chat(&messages).await?;
        Ok(response)
    }

    /// Mock response for development
    pub async fn respond_mock(
        &self,
        _topic: &str,
        _history: &[&DebateMessage],
    ) -> Result<String, LlmError> {
        let viewpoint_str = match self.config.viewpoint {
            DebateViewpoint::For => "FOR",
            DebateViewpoint::Against => "AGAINST",
        };
        Ok(format!(
            "[{}] I argue {} this topic with great conviction.",
            self.config.personality.bot_name, viewpoint_str
        ))
    }
}

/// The debate engine that orchestrates turns between two bots
pub struct DebateEngine {
    state: std::sync::Arc<std::sync::Mutex<DebateState>>,
    topic: String,
    bot_a: BotAgent,
    bot_b: BotAgent,
    message_history: VecDeque<DebateMessage>,
    turn_limit: u32, // max exchanges per side (20 = 40 total messages)
    use_mock: bool,  // use mock responses for dev
    tx: mpsc::UnboundedSender<DebateMessage>,
}

impl DebateEngine {
    pub fn new(
        topic: String,
        bot_a_config: BotConfig,
        bot_b_config: BotConfig,
        llm_provider: LLMProvider,
        tx: mpsc::UnboundedSender<DebateMessage>,
        use_mock: bool,
    ) -> Self {
        let turn_limit = std::env::var("DEBATE_TURN_LIMIT")
            .ok()
            .and_then(|v| v.parse().ok())
            .unwrap_or(10);

        Self {
            state: std::sync::Arc::new(std::sync::Mutex::new(DebateState::Idle)),
            topic,
            bot_a: BotAgent::new(bot_a_config, llm_provider.clone()),
            bot_b: BotAgent::new(bot_b_config, llm_provider),
            message_history: VecDeque::new(),
            turn_limit,
            use_mock,
            tx,
        }
    }

    /// Run the debate — this is the main event loop
    pub async fn run(mut self, mut stop_rx: oneshot::Receiver<()>) -> DebateResult {
        let mut turn: u32 = 0;
        let mut is_a_turn = false;

        // Update state to SettingUp
        {
            let mut state = self.state.lock().unwrap();
            *state = DebateState::SettingUp;
        }
        tokio::task::yield_now().await;

        loop {
            // Check stop signal
            if stop_rx.try_recv().is_ok() {
                break;
            }

            // Determine whose turn it is
            let bot = if is_a_turn { &self.bot_a } else { &self.bot_b };
            is_a_turn = !is_a_turn;

            turn += 1;

            // Update state
            {
                let mut state = self.state.lock().unwrap();
                *state = DebateState::InProgress { turn };
            }

            // Get the response — history is VecDeque<DebateMessage> for proper role alternation
            let msg_content = if self.use_mock {
                bot.respond_mock(
                    &self.topic,
                    &self.message_history.iter().collect::<Vec<_>>(),
                )
                .await
            } else {
                bot.respond(
                    &self.topic,
                    &self.message_history.iter().collect::<Vec<_>>(),
                )
                .await
            };

            let msg_content = match msg_content {
                Ok(text) => text,
                Err(e) => {
                    eprintln!("Bot {} error: {}", bot.config().personality.bot_name, e);
                    format!("[Error generating response: {}]", e)
                }
            };

            // Create the debate message
            let msg = DebateMessage {
                speaker: bot.config().personality.bot_name.clone(),
                personality_name: bot.config().personality.name.clone(),
                message: msg_content.clone(),
                turn,
                timestamp: std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .unwrap()
                    .as_secs(),
            };

            // Send message to frontend
            if self.tx.send(msg.clone()).is_err() {
                eprintln!("Failed to send message to frontend");
                break;
            }

            // Store in history (DebateMessage — preserves speaker, personality, etc.)
            self.message_history.push_back(msg);

            // Check if we've reached the turn limit
            if turn >= self.turn_limit {
                break;
            }
        }

        // Finalize and return result
        self.finalize(None)
    }

    /// Finalize the debate with an optional declared winner
    pub fn finalize(&self, winner: Option<String>) -> DebateResult {
        let messages: Vec<DebateMessage> = self.message_history.iter().cloned().collect();
        let total_turns = messages.iter().map(|m| m.turn).max().unwrap_or(0);

        {
            let mut state = self.state.lock().unwrap();
            *state = DebateState::Finished {
                winner: winner.clone(),
            };
        }

        DebateResult {
            topic: self.topic.clone(),
            winner,
            messages,
            total_turns,
        }
    }
}
