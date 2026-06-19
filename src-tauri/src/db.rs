use rusqlite::{Connection, Result, OptionalExtension};

/// Application settings stored in SQLite
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct AppSettings {
	pub api_key: String,
	pub base_url: String,
	pub model: String,
}

impl Default for AppSettings {
	fn default() -> Self {
		Self {
			api_key: String::new(),
			base_url: "https://api.openai.com/v1/chat/completions".to_string(),
			model: "gpt-4o-mini".to_string(),
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
	conn.execute_batch(
		"CREATE TABLE IF NOT EXISTS settings (
			key   TEXT PRIMARY KEY,
			value TEXT NOT NULL
		);",
	)?;
	Ok(())
}

/// Get a setting value by key
pub fn get_setting(key: &str) -> Result<Option<String>> {
	get_connection()?.query_row(
		"SELECT value FROM settings WHERE key = ?",
		[key],
		|row| row.get(0),
	).optional()
}

/// Set a setting value by key
pub fn set_setting(key: &str, value: &str) -> Result<()> {
	get_connection()?.execute(
		"INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
		[key, value],
	)?;
	Ok(())
}

/// Load all settings into AppSettings
pub fn load_settings() -> Result<AppSettings> {
	let key: Option<String> = get_setting("api_key")?;
	let url: Option<String> = get_setting("base_url")?;
	let model: Option<String> = get_setting("model")?;

	Ok(AppSettings {
		api_key: key.unwrap_or_default(),
		base_url: url.unwrap_or_else(|| "https://api.openai.com/v1/chat/completions".to_string()),
		model: model.unwrap_or_else(|| "gpt-4o-mini".to_string()),
	})
}

/// Save all settings
pub fn save_settings(settings: &AppSettings) -> Result<()> {
	set_setting("api_key", &settings.api_key)?;
	set_setting("base_url", &settings.base_url)?;
	set_setting("model", &settings.model)?;
	Ok(())
}
