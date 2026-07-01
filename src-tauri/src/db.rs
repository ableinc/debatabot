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
    pub temperature: f64,
    pub is_default: bool,
}

/// A row from the debates table (for history list)
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DebateRecord {
    pub id: i64,
    pub topic: String,
    pub bot_a: String,
    pub bot_b: String,
    pub winner: Option<String>,
    pub total_turns: i64,
    pub timestamp: String,
    pub message_count: i64,
}

/// Paginated response for the history list
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DebatePage {
    pub debates: Vec<DebateRecord>,
    pub total: i64,
}

/// A single message row for the debate detail view
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DebateHistoryMessage {
    pub id: i64,
    pub speaker: String,
    pub personality_name: String,
    pub message: String,
    pub turn: u32,
    pub timestamp: u64,
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
    conn.execute("PRAGMA foreign_keys = ON", ())?;

    // ── LLM providers ──────────────────────────────────────────────
    conn.execute(
        "CREATE TABLE IF NOT EXISTS providers (
            provider TEXT NOT NULL UNIQUE,
            api_key TEXT NOT NULL,
            base_url TEXT NOT NULL,
            model TEXT NOT NULL,
            max_tokens INTEGER NOT NULL,
            temperature DOUBLE NOT NULL DEFAULT 0.7,
            is_default INTEGER NOT NULL DEFAULT 0
        )",
        (),
    )?;
    conn.execute(
        "ALTER TABLE providers ADD COLUMN temperature REAL NOT NULL DEFAULT 0.7",
        (),
    )
    .ok();

    // ── Debates history ────────────────────────────────────────────
    // Drop old broken tables (they were never populated — FK pointed at
    // non-existent "debate" table and insert used wrong table name).
    conn.execute("DROP TABLE IF EXISTS debate_messages", ())?;
    conn.execute("DROP TABLE IF EXISTS debate", ())?;
    // Recreate with the correct schema
    conn.execute(
        "CREATE TABLE IF NOT EXISTS debates (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            topic       TEXT    NOT NULL,
            bot_a       TEXT    NOT NULL,
            bot_b       TEXT    NOT NULL,
            winner      TEXT,
            total_turns INTEGER NOT NULL DEFAULT 0,
            timestamp   DATETIME DEFAULT CURRENT_TIMESTAMP
        )",
        (),
    )?;
    conn.execute(
        "CREATE TABLE IF NOT EXISTS debate_messages (
            id               INTEGER PRIMARY KEY AUTOINCREMENT,
            debate_id        INTEGER NOT NULL REFERENCES debates(id) ON DELETE CASCADE,
            speaker          TEXT    NOT NULL,
            personality_name TEXT    NOT NULL,
            message          TEXT    NOT NULL,
            turn             INTEGER NOT NULL,
            timestamp        INTEGER NOT NULL
        )",
        (),
    )?;

    Ok(())
}

/// Upsert LLM provider rows
pub fn save_providers(llm_providers: &Vec<LLMProvider>) -> Result<()> {
    let conn = get_connection()?;
    for setting in llm_providers {
        let temp = (setting.temperature * 100.0).round() / 100.0;
        conn.execute(
            "INSERT OR REPLACE INTO providers
             (provider, api_key, base_url, model, max_tokens, temperature, is_default)
             VALUES (?, ?, ?, ?, ?, ?, ?)",
            params![
                setting.provider,
                setting.api_key,
                setting.base_url,
                setting.model,
                setting.max_tokens,
                temp,
                setting.is_default
            ],
        )?;
    }
    Ok(())
}

/// Load all provider rows
pub fn get_providers() -> Result<Vec<LLMProvider>> {
    let conn = get_connection()?;
    let mut stmt = conn.prepare("SELECT * FROM providers")?;
    let iter = stmt.query_map([], |row| {
        Ok(LLMProvider {
            provider: row.get(0)?,
            api_key: row.get(1)?,
            base_url: row.get(2)?,
            model: row.get(3)?,
            max_tokens: row.get(4)?,
            temperature: row.get::<_, f64>(5).unwrap_or(0.7),
            is_default: row.get(6)?,
        })
    })?;
    iter.collect::<Result<_, _>>()
}

/// Delete a provider by name
pub fn delete_provider(provider_name: &str) -> Result<()> {
    get_connection()?.execute(
        "DELETE FROM providers WHERE provider = ?",
        params![provider_name],
    )?;
    Ok(())
}

/// Create a debate record; returns the new row id
pub fn create_debate(
    topic: &str,
    bot_a: &str,
    bot_b: &str,
    winner: Option<&str>,
    total_turns: u32,
) -> Result<i64> {
    let conn = get_connection()?;
    conn.execute(
        "INSERT INTO debates (topic, bot_a, bot_b, winner, total_turns)
         VALUES (?, ?, ?, ?, ?)",
        params![topic, bot_a, bot_b, winner, total_turns],
    )?;
    Ok(conn.last_insert_rowid())
}

/// Save a single debate message
pub fn save_debate_message(
    debate_id: i64,
    speaker: &str,
    personality_name: &str,
    message: &str,
    turn: u32,
    timestamp: u64,
) -> Result<()> {
    get_connection()?.execute(
        "INSERT INTO debate_messages
         (debate_id, speaker, personality_name, message, turn, timestamp)
         VALUES (?, ?, ?, ?, ?, ?)",
        params![debate_id, speaker, personality_name, message, turn, timestamp],
    )?;
    Ok(())
}

/// Return a page of debates ordered newest-first, with message counts
pub fn get_debates(page: u32, page_size: u32) -> Result<DebatePage> {
    let offset = page * page_size;

    // Count total rows with a short-lived connection borrow
    let total: i64 = {
        let conn = get_connection()?;
        conn.query_row("SELECT COUNT(*) FROM debates", [], |r| r.get(0))?
    };

    let conn = get_connection()?;
    let mut stmt = conn.prepare(
        "SELECT d.id, d.topic, d.bot_a, d.bot_b, d.winner, d.total_turns,
                strftime('%Y-%m-%dT%H:%M:%SZ', d.timestamp) as ts,
                COUNT(dm.id) as message_count
         FROM debates d
         LEFT JOIN debate_messages dm ON dm.debate_id = d.id
         GROUP BY d.id
         ORDER BY d.timestamp DESC
         LIMIT ? OFFSET ?",
    )?;
    let mapped = stmt.query_map(params![page_size, offset], |row| {
        Ok(DebateRecord {
            id: row.get(0)?,
            topic: row.get(1)?,
            bot_a: row.get(2)?,
            bot_b: row.get(3)?,
            winner: row.get(4)?,
            total_turns: row.get(5)?,
            timestamp: row.get::<_, String>(6).unwrap_or_default(),
            message_count: row.get(7)?,
        })
    })?;
    let mut debates = Vec::new();
    for row in mapped {
        debates.push(row?);
    }

    Ok(DebatePage { debates, total })
}

/// Return all messages for a debate, ordered by turn
pub fn get_debate_messages(debate_id: i64) -> Result<Vec<DebateHistoryMessage>> {
    let conn = get_connection()?;
    let mut stmt = conn.prepare(
        "SELECT id, speaker, personality_name, message, turn, timestamp
         FROM debate_messages
         WHERE debate_id = ?
         ORDER BY turn ASC",
    )?;
    let mapped = stmt.query_map(params![debate_id], |row| {
        Ok(DebateHistoryMessage {
            id: row.get(0)?,
            speaker: row.get(1)?,
            personality_name: row.get(2)?,
            message: row.get(3)?,
            turn: row.get(4)?,
            timestamp: row.get(5)?,
        })
    })?;
    let mut msgs = Vec::new();
    for row in mapped {
        msgs.push(row?);
    }
    Ok(msgs)
}
