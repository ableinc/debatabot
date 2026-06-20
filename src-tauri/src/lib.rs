mod db;
mod debate_engine;
mod llm;
mod models;
mod personality;

use db::AppSetting;
use debate_engine::DebateEngine;
use llm::LlmClient;
use models::*;
use personality::Personality;
use std::sync::{Arc, Mutex};
use tauri::Emitter;
use tokio::sync::mpsc;
use tokio::sync::oneshot;

/// Shared debate state accessible across commands
#[derive(Default)]
pub struct DebateSharedState {
    pub state: DebateState,
    pub stop_tx: Mutex<Option<tokio::sync::oneshot::Sender<()>>>,
    pub topic: Mutex<Option<String>>,
}

/// Get LLM settings from SQLite
#[tauri::command]
async fn get_llm_settings() -> Result<Vec<AppSetting>, String> {
    db::init_db().map_err(|e| e.to_string())?;
    db::get_settings().map_err(|e| e.to_string())
}

/// Save LLM settings to SQLite
#[tauri::command]
async fn save_llm_settings(settings: AppSetting) -> Result<(), String> {
    db::init_db().map_err(|e| e.to_string())?;
    db::save_settings(&settings).map_err(|e| e.to_string())
}

/// Start a new debate between two bots
#[tauri::command]
async fn start_debate(
    app: tauri::AppHandle,
    topic: String,
    bot_a: BotConfig,
    bot_b: BotConfig,
    setting: AppSetting,
    state: tauri::State<'_, Arc<Mutex<DebateSharedState>>>,
) -> Result<(), String> {
    let (msg_tx, mut msg_rx) = mpsc::unbounded_channel::<DebateMessage>();
    let (stop_tx, stop_rx) = oneshot::channel();

    // Load full personalities from personality files
    let all_personalities = Personality::load_all().map_err(|e| e.to_string())?;
    let full_a = all_personalities
        .iter()
        .find(|p| p.name == bot_a.personality.name)
        .cloned()
        .unwrap_or(bot_a.personality.clone());
    let full_b = all_personalities
        .iter()
        .find(|p| p.name == bot_b.personality.name)
        .cloned()
        .unwrap_or(bot_b.personality.clone());

    let bot_config_a = BotConfig {
        name: bot_a.name.clone(),
        personality: full_a,
        viewpoint: bot_a.viewpoint.clone(),
    };
    let bot_config_b = BotConfig {
        name: bot_b.name.clone(),
        personality: full_b,
        viewpoint: bot_b.viewpoint.clone(),
    };

    // Load LLM settings from SQLite and validate
    if setting.api_key.is_empty() || setting.base_url.is_empty() {
        return Err(
            "LLM settings not configured. Please set API key and base URL in Settings.".into(),
        );
    }
    let use_mock = false;
    let llm_client = LlmClient::new(
        setting.api_key,
        setting.base_url,
        setting.model,
        setting.max_tokens,
    );

    // Update shared state
    {
        let mut shared = state.lock().unwrap();
        shared.state = DebateState::SettingUp;
        *shared.stop_tx.lock().unwrap() = Some(stop_tx);
        *shared.topic.lock().unwrap() = Some(topic.clone());
    }

    // Emit state change
    if let Err(e) = app.emit("debate_state_changed", &DebateState::SettingUp) {
        eprintln!("Failed to emit state change: {}", e);
    }

    // Clone app handle for use in the background task
    let app_for_messages = app.clone();
    let app_for_result = app.clone();

    // Spawn the debate in a background task
    let engine = DebateEngine::new(
        topic.clone(),
        bot_config_a,
        bot_config_b,
        llm_client,
        msg_tx,
        use_mock,
    );

    tokio::spawn(async move {
        // Forward messages from engine to frontend
        tokio::spawn(async move {
            while let Some(msg) = msg_rx.recv().await {
                if let Err(e) = app_for_messages.emit("debate_message", &msg) {
                    eprintln!("Failed to emit debate message: {}", e);
                }
            }
        });

        let result = engine.run(stop_rx).await;

        // Emit final state and result
        if let Err(e) = app_for_result.emit("debate_finished", &result) {
            eprintln!("Failed to emit debate finished: {}", e);
        }
    });

    Ok(())
}

/// Stop the currently running debate
#[tauri::command]
async fn stop_debate(
    state: tauri::State<'_, Arc<Mutex<DebateSharedState>>>,
    app: tauri::AppHandle,
) -> Result<DebateResult, String> {
    // Send stop signal
    {
        let shared = state.lock().unwrap();
        let mut tx_guard = shared.stop_tx.lock().unwrap();
        if let Some(tx) = tx_guard.take() {
            let _ = tx.send(());
        }
    }

    // Update state
    {
        let mut shared = state.lock().unwrap();
        shared.state = DebateState::Finished { winner: None };
    }

    // Emit state change
    if let Err(e) = app.emit(
        "debate_state_changed",
        &DebateState::Finished { winner: None },
    ) {
        eprintln!("Failed to emit state change: {}", e);
    }

    Ok(DebateResult {
        topic: state
            .lock()
            .unwrap()
            .topic
            .lock()
            .unwrap()
            .clone()
            .unwrap_or_default(),
        winner: None, // Nil
        messages: Vec::new(),
        total_turns: 0,
    })
}

/// Declare a winner for the current debate
#[tauri::command]
async fn declare_winner(
    bot_name: String,
    state: tauri::State<'_, Arc<Mutex<DebateSharedState>>>,
    app: tauri::AppHandle,
) -> Result<(), String> {
    {
        let mut shared = state.lock().unwrap();
        shared.state = DebateState::Finished {
            winner: Some(bot_name.clone()),
        };
    }

    if let Err(e) = app.emit(
        "debate_state_changed",
        &DebateState::Finished {
            winner: Some(bot_name),
        },
    ) {
        eprintln!("Failed to emit state change: {}", e);
    }

    Ok(())
}

/// Get the current debate state
#[tauri::command]
async fn get_debate_status(
    state: tauri::State<'_, Arc<Mutex<DebateSharedState>>>,
) -> Result<DebateState, String> {
    Ok(state.lock().unwrap().state.clone())
}

/// Get available personalities (from bundled assets)
#[tauri::command]
async fn get_personalities() -> Result<Vec<Personality>, String> {
    Personality::load_all().map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Initialize SQLite database on startup
    if let Err(e) = db::init_db() {
        eprintln!("Failed to initialize database: {}", e);
    }

    tauri::Builder::default()
        .plugin(
            tauri_plugin_log::Builder::new()
                .target(tauri_plugin_log::Target::new(
                    tauri_plugin_log::TargetKind::Stdout,
                ))
                .level(tauri_plugin_log::log::LevelFilter::Info)
                .build(),
        )
        .plugin(tauri_plugin_opener::init())
        .manage(Arc::new(Mutex::new(DebateSharedState::default())))
        .invoke_handler(tauri::generate_handler![
            get_llm_settings,
            save_llm_settings,
            start_debate,
            stop_debate,
            declare_winner,
            get_debate_status,
            get_personalities,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
