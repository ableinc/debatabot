use serde::{Deserialize, Serialize};

/// A single personality loaded from a .md file
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Personality {
    pub name: String,           // e.g. "Logical"
    pub bot_name: String,       // e.g. "Cortex"
    pub description: String,    // full personality description for the system prompt
    pub speech_style: String,   // how they speak
    pub weakness: String,       // argumentative weakness
}

/// Errors that can occur during personality loading/parsing
#[derive(Debug, thiserror::Error)]
pub enum PersonalityError {
    #[error("failed to read personality file: {0}")]
    Io(#[from] std::io::Error),

    #[error("missing '{0}' section in personality file")]
    MissingSection(String),

    #[error("empty personality file: {0}")]
    Empty(String),
}

impl Personality {
    /// Parse a single personality from markdown content
    pub fn parse(content: &str) -> Result<Self, PersonalityError> {
        let lines: Vec<&str> = content.lines().collect();
        let mut sections: std::collections::HashMap<String, String> =
            std::collections::HashMap::new();

        // Split content into sections by ## headers
        let mut current_section = String::new();
        let mut current_content = String::new();

        for line in &lines {
            if line.starts_with("## ") {
                // Save previous section if any
                if !current_section.is_empty() {
                    sections.insert(
                        current_section.trim().to_lowercase(),
                        current_content.trim().to_string(),
                    );
                }
                current_section = line[3..].to_string();
                current_content = String::new();
            } else {
                if !current_content.is_empty() {
                    current_content.push('\n');
                }
                current_content.push_str(line);
            }
        }
        // Save last section
        if !current_section.is_empty() {
            sections.insert(
                current_section.trim().to_lowercase(),
                current_content.trim().to_string(),
            );
        }

        // Extract the display name from the first line (before ## headers)
        let display_name = lines
            .iter()
            .find(|line| !line.starts_with("## ") && !line.starts_with('#') && !line.is_empty())
            .ok_or_else(|| PersonalityError::MissingSection("Name".to_string()))?;

        let bot_name = sections
            .get("name")
            .cloned()
            .ok_or_else(|| PersonalityError::MissingSection("Name".to_string()))?;

        let description = sections
            .get("personality")
            .cloned()
            .ok_or_else(|| PersonalityError::MissingSection("Personality".to_string()))?;

        let speech_style = sections
            .get("speech style")
            .cloned()
            .ok_or_else(|| PersonalityError::MissingSection("Speech Style".to_string()))?;

        let weakness = sections
            .get("weakness")
            .cloned()
            .ok_or_else(|| PersonalityError::MissingSection("Weakness".to_string()))?;

        Ok(Personality {
            name: display_name.trim().to_string(),
            bot_name,
            description,
            speech_style,
            weakness,
        })
    }

    /// Load all personalities from the bundled assets directory
    pub fn load_all() -> Result<Vec<Self>, PersonalityError> {
        // Try to find personality files relative to the executable
        let exe_path = std::env::current_exe()?;
        let exe_dir = exe_path.parent().unwrap_or(std::path::Path::new("."));

        // In dev mode, assets are in src-tauri/assets/personalities/
        // In release mode, they're in the resources directory next to the binary
        let candidates = [
            exe_dir.join("resources").join("assets").join("personalities"),
            exe_dir.join("..").join("src-tauri").join("assets").join("personalities"),
        ];

        let personalities_dir = candidates
            .iter()
            .find(|p| p.is_dir())
            .cloned()
            .unwrap_or_else(|| std::path::PathBuf::from("assets/personalities"));

        let mut personalities = Vec::new();

        if !personalities_dir.is_dir() {
            return Ok(personalities);
        }

        for entry in std::fs::read_dir(&personalities_dir)? {
            let entry = entry?;
            let path = entry.path();
            if path.extension().map_or(false, |ext| ext == "md") {
                let content = std::fs::read_to_string(&path)?;
                let personality = Personality::parse(&content)?;
                personalities.push(personality);
            }
        }

        // Sort by name for consistent ordering
        personalities.sort_by(|a, b| a.name.cmp(&b.name));
        Ok(personalities)
    }
}

/// Build a system prompt for a bot given its personality, viewpoint, and topic
pub fn build_system_prompt(personality: &Personality, topic: &str, viewpoint: &str) -> String {
    format!(
        "You are {} ({}). {}

Your speech style: {}

Your argumentative weakness: {}

You argue {} the topic: \"{}\"

Respond concisely (2-3 sentences max). Be persuasive and try to WIN the debate. Previous debate messages are below — respond directly to them.",
        personality.name,
        personality.bot_name,
        personality.description,
        personality.speech_style,
        personality.weakness,
        viewpoint,
        topic
    )
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_personality() {
        let content = r#"# Logical

## Name
Cortex

## Personality
Logical and Analytical. You approach every topic with cold, hard reasoning.

## Speech Style
Precise, measured, and formal.

## Weakness
Can appear cold and dismissive of human emotion.
"#;
        let p = Personality::parse(content).unwrap();
        assert_eq!(p.name, "Logical");
        assert_eq!(p.bot_name, "Cortex");
        assert_eq!(p.speech_style, "Precise, measured, and formal.");
        assert!(p.description.contains("cold, hard reasoning"));
    }

    #[test]
    fn test_missing_section() {
        let content = "# Test\n\n## Name\nBot\n\n## Personality\nTest\n\n## Speech Style\nTalks.\n";
        let result = Personality::parse(content);
        assert!(result.is_err());
        assert!(matches!(result.unwrap_err(), PersonalityError::MissingSection(_)));
    }
}
