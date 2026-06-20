use rusqlite::{params, Connection, Result};

/// Application settings stored in SQLite
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct AppSetting {
    pub provider: String,
    pub api_key: String,
    pub base_url: String,
    pub model: String,
    pub max_tokens: u32,
    pub is_default: bool,
}

impl Default for AppSetting {
    fn default() -> Self {
        Self {
            provider: "openai".to_string(),
            api_key: String::new(),
            base_url: "https://api.openai.com/v1/chat/completions".to_string(),
            model: "gpt-4o-mini".to_string(),
            max_tokens: 256000,
            is_default: true,
        }
    }
}

/// Get or create the database connection
fn get_connection() -> Result<Connection> {
    let home = std::env::var("HOME").unwrap_or_else(|_| ".".to_string());
    let db_path = std::path::PathBuf::from(home)
        .join(".debatabot")
        .join("debatabot.db");

    let dir = db_path.parent().expect("db path must have a parent");
    std::fs::create_dir_all(dir).ok();
    Connection::open(db_path)
}

/// Initialize the database schema
pub fn init_db() -> Result<()> {
    let conn = get_connection()?;
    conn.execute(
        "CREATE TABLE IF NOT EXISTS settings (
        	provider TEXT NOT NULL UNIQUE,
			api_key TEXT NOT NULL,
			base_url TEXT NOT NULL,
			model TEXT NOT NULL,
			max_tokens INTEGER NOT NULL,
			is_default INTEGER NOT NULL UNIQUE
		)",
        (),
    )?;
    Ok(())
}

/// Set a setting value by key
pub fn save_settings(settings: &AppSetting) -> Result<()> {
    get_connection()?.execute(
        "INSERT OR REPLACE INTO settings (provider, api_key, base_url, model, max_tokens, is_default) VALUES (?, ?, ?, ?, ?, ?)",
        params![settings.provider.clone(), settings.api_key.clone(), settings.base_url.clone(), settings.model.clone(), settings.max_tokens.to_string(), settings.is_default],
    )?;
    Ok(())
}

/// Load all settings into AppSettings using a single connection
pub fn get_settings() -> Result<Vec<AppSetting>, rusqlite::Error> {
    let conn = get_connection()?;
    let mut stmt = conn.prepare("SELECT * FROM settings")?;
    let settings_iter = stmt.query_map([], |row| {
        Ok(AppSetting {
            provider: row.get(0)?,
            api_key: row.get(1)?,
            base_url: row.get(2)?,
            model: row.get(3)?,
            max_tokens: row.get(4)?,
            is_default: row.get(5)?,
        })
    })?;
    let settings: Vec<AppSetting> = settings_iter.collect::<Result<_, _>>()?;
    Ok(settings)
}
