use serde::{Deserialize, Serialize};

/// A single message in an LLM conversation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatMessage {
    pub role: String,    // "system" | "user" | "assistant"
    pub content: String,
}

/// Configuration for the LLM backend
#[derive(Debug, Clone)]
pub struct LlmClient {
    pub api_key: String,
    pub base_url: String,
    pub model: String,
}

/// An error from LLM communication
#[derive(Debug, thiserror::Error)]
pub enum LlmError {
    #[error("HTTP error: {0}")]
    Http(#[from] reqwest::Error),

    #[error("Response error: {0}")]
    Response(String),

    #[error("Invalid response format: {0}")]
    InvalidFormat(String),

    #[error("API key not configured")]
    ApiKeyNotConfigured,
}

impl LlmClient {
    pub fn new(api_key: String, base_url: String, model: String) -> Self {
        Self {
            api_key,
            base_url,
            model,
        }
    }

    /// Send a chat completion request to the LLM
    pub async fn chat(
        &self,
        messages: &[ChatMessage],
    ) -> Result<String, LlmError> {
        if self.api_key.is_empty() {
            return Err(LlmError::ApiKeyNotConfigured);
        }

        let client = reqwest::Client::new();
        let body = serde_json::json!({
            "model": self.model,
            "messages": messages.iter().map(|m| {
                serde_json::json!({
                    "role": m.role,
                    "content": m.content,
                })
            }).collect::<Vec<_>>(),
            "max_tokens": 500,
            "temperature": 0.8,
        });

        let response = client
            .post(&self.base_url)
            .header("Authorization", format!("Bearer {}", self.api_key))
            .header("Content-Type", "application/json")
            .json(&body)
            .send()
            .await
            .map_err(|e| LlmError::Http(e))?;

        let status = response.status();
        if !status.is_success() {
            let body = response
                .text()
                .await
                .unwrap_or_else(|_| "<unable to read error response>".to_string());
            return Err(LlmError::Response(format!(
                "HTTP {}: {}",
                status, body
            )));
        }

        let json: serde_json::Value = response
            .json::<serde_json::Value>()
            .await
            .map_err(|e| LlmError::Http(e))?;

        let choices = json.get("choices")
            .and_then(|v| v.as_array())
            .ok_or_else(|| LlmError::InvalidFormat("No choices array".to_string()))?;

        let first = choices.first()
            .ok_or_else(|| LlmError::InvalidFormat("No choices in response".to_string()))?;

        let content = first.get("message")
            .and_then(|m| m.get("content"))
            .and_then(|c| c.as_str())
            .ok_or_else(|| LlmError::InvalidFormat("No message content".to_string()))?;

        Ok(content.trim().to_string())
    }
}
