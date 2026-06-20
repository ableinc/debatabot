use rusqlite::{params, Connection, Result};

/// Application settings stored in SQLite
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LLMProvider {
    pub provider: String,
    pub api_key: String,
    pub base_url: String,
    pub model: String,
    pub max_tokens: u32,
    pub temperature: f32,
    pub is_default: bool,
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
        "CREATE TABLE IF NOT EXISTS providers (
            provider TEXT NOT NULL UNIQUE,
            api_key TEXT NOT NULL,
            base_url TEXT NOT NULL,
            model TEXT NOT NULL,
            max_tokens INTEGER NOT NULL,
            temperature REAL NOT NULL DEFAULT 0.7,
            is_default INTEGER NOT NULL DEFAULT 0
        )",
        (),
    )?;

    // Migration: if the table exists but lacks the temperature column, add it
    conn.execute(
        "ALTER TABLE providers ADD COLUMN temperature REAL NOT NULL DEFAULT 0.7",
        (),
    )
    .ok(); // ignore error if column already exists

    Ok(())
}

/// Upsert the default settings row
pub fn save_providers(llm_providers: &Vec<LLMProvider>) -> Result<()> {
    let conn = get_connection()?;
    for setting in llm_providers {
        conn.execute(
            "INSERT OR REPLACE INTO providers (provider, api_key, base_url, model, max_tokens, temperature, is_default) VALUES (?, ?, ?, ?, ?, ?, ?)",
            params![setting.provider.clone(), setting.api_key.clone(), setting.base_url.clone(), setting.model.clone(), setting.max_tokens, setting.temperature, setting.is_default],
        )?;
    }
    Ok(())
}

/// Load all settings rows
pub fn get_providers() -> Result<Vec<LLMProvider>, rusqlite::Error> {
    let conn = get_connection()?;
    let mut stmt = conn.prepare("SELECT * FROM providers")?;
    let settings_iter = stmt.query_map([], |row| {
        Ok(LLMProvider {
            provider: row.get(0)?,
            api_key: row.get(1)?,
            base_url: row.get(2)?,
            model: row.get(3)?,
            max_tokens: row.get(4)?,
            temperature: row.get::<_, f32>(5).unwrap_or(0.7),
            is_default: row.get(6)?,
        })
    })?;
    let settings: Vec<LLMProvider> = settings_iter.collect::<Result<_, _>>()?;
    Ok(settings)
}

/// Delete a provider by name
pub fn delete_provider(provider_name: &str) -> Result<()> {
    get_connection()?.execute(
        "DELETE FROM providers WHERE provider = ?",
        params![provider_name],
    )?;
    Ok(())
}
