# 🗣️ Bot Debate — Project Plan

## Vision

A desktop app where two AI-powered bots debate a user-chosen topic, each with a unique personality and viewpoint. The debate flows turn-by-turn in real time. Users can watch, stop the debate, or declare a winner.

---

## Tech Stack

| Layer        | Technology                          |
| ------------ | ----------------------------------- |
| **UI**       | Solid.js + TypeScript + Vite        |
| **Desktop**  | Tauri 2 (Rust backend)              |
| **State**    | Solid.js signals + stores           |
| **Styling**  | CSS (with dark/light theme support) |
| **AI Backend** | Rust tasks via Tauri commands (see §5) |

> The debate logic, bot personalities, and turn orchestration live in Rust (Tauri backend). The frontend is purely a reactive UI that shows the debate state in real time via events/commands.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────┐
│                   Frontend (Solid.js)            │
│                                                  │
│  [Setup Screen] ──► [Debate Screen] ◄── [Results]│
│       │                    │                      │
│       └── sends topic, bot config ──►             │
│                              │                     │
│  listens for debate events from Rust              │
└──────────────────────┬────────────────────────────┘
                       │ Tauri Commands / Events
                       ▼
┌─────────────────────────────────────────────────┐
│           Backend (Rust / Tauri)                 │
│                                                  │
│  ┌──────────────┐    ┌──────────────────┐        │
│  │ DebateEngine  │───►│ Bot Agent A      │        │
│  │               │    │ Bot Agent B      │        │
│  │               │    └──────────────────┘        │
│  │ - Orchestrates turns                    │       │
│  │ - Manages state machine               │       │
│  │ - Handles timeouts / stop signals   │       │
│  └──────────────┘                            │       │
│                        │                        │       │
│                  LLM API calls (async)     │       │
└─────────────────────────────────────────────────┘
```

---

## Phase 0 — Project Foundations ✅ (Already Done)

- [x] Tauri 2 project initialized
- [x] Solid.js + TypeScript + Vite frontend scaffold
- [x] Basic `main.rs` and `lib.rs` structure
- [x] `package.json` with Solid & Tauri deps
- [x] Window configured (800×600)

---

## Phase 1 — Core Data Models & State

### 1.1 Personality Model (`src-tauri/src/personality.rs` — new file)

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Personality {
    pub name: String,           // personality display name (e.g. "Logical")
    pub bot_name: String,       // bot name loaded from personality file
    pub description: String,    // full personality description for the system prompt
    pub speech_style: String,   // how they speak
    pub weakness: String,       // argumentative weakness
}

impl Personality {
    /// Load a personality by filename (without .md extension)
    pub fn load(name: &str) -> Result<Self, PersonalityError>;

    /// Load all personalities from the bundled assets directory
    pub fn load_all() -> Vec<Self>;
}
```

**Loading mechanism:** `.md` files live in `src-tauri/assets/personalities/` and are bundled as Tauri binary assets (configured via `tauri.conf.json` `bundle.resources`). At runtime, `Personality::load_all()` discovers every `.md` file, parses it, and returns a `Vec<Personality>`.

**Parsing:** Each `.md` file follows the format shown in §1.2. A lightweight parser splits on `##` headers and extracts the content beneath each.

### 1.2 Personality Markdown Files (`src-tauri/assets/personalities/` — new directory)

Each personality is a `.md` file. Add, edit, or remove personalities without recompiling.

```
src-tauri/
└── assets/
    └── personalities/
        ├── logical.md
        ├── passionate.md
        ├── sarcastic.md
        ├── diplomatic.md
        ├── aggressive.md
        ├── witty.md
        ├── analytical.md
        └── charismatic.md
```

**Format (each `.md` file):**
```markdown
# DisplayName

## Name
BotName

## Personality
[Full personality description — who they are, what they believe, how they argue]

## Speech Style
[How they speak — tone, common phrases, rhetorical patterns]

## Weakness
[Their argumentative blind spot — what an opponent can exploit]
```

See `src-tauri/assets/personalities/` for all 8 personality files.

### 1.3 Rust Domain Types (`src-tauri/src/models.rs` — new file)

```rust
// Core types
pub struct DebateTopic {
    pub topic: String,
}

pub struct BotConfig {
    pub name: String,
    pub personality: Personality,   // loaded Personality struct, not a string
    pub viewpoint: DebateViewpoint,
}

pub enum DebateViewpoint {
    For,
    Against,
    Neutral,
}

pub enum DebateState {
    Idle,
    SettingUp,
    InProgress { turn: u32 },
    Finished { winner: Option<String> }, // None = nil/draw
}

pub struct DebateMessage {
    pub speaker: String,
    pub personality_name: String,     // display name (e.g. "Logical")
    pub message: String,
    pub turn: u32,
    pub timestamp: u64,
}
```

### 1.4 Frontend State Store (`src/stores/DebateStore.ts` — new file)

```typescript
// Solid.js store for debate state (TypeScript types mirror Rust structs)
interface DebateState {
  value: 'idle' | 'setting_up' | 'in_progress' | 'finished';
  turn?: number;
}

interface BotConfig {
  name: string;
  personality: {
    name: string;       // personality display name (e.g. "Logical")
    botName: string;    // bot's name (e.g. "Cortex")
  };
  viewpoint: 'for' | 'against' | 'neutral';
}

interface DebateMessage {
  speaker: string;      // bot name (e.g. "Cortex")
  personalityName: string; // personality (e.g. "Logical")
  message: string;
  turn: number;
  timestamp: number;
}

interface DebateStore {
  state: DebateState;
  topic: string;
  bots: [BotConfig, BotConfig];
  messages: DebateMessage[];
  currentTurn: number;
}
```

---

## Phase 2 — UI Screens

### 2.1 Setup Screen (`src/screens/SetupScreen.tsx`)

**Purpose:** User enters a topic and configures the debate.

**Layout:**
```
┌─────────────────────────────────────┐
│  🗣️  Bot Debate                    │
│                                     │
│  Topic:  [___________________]     │
│                                     │
│  ┌─ Bot 1 ─────────────────────┐   │
│  │ Name:    [___________]      │   │
│  │ [🎲 Random]                 │   │
│  │ Personality: [__________]   │   │
│  │ [🎲 Random]                 │   │
│  │ Viewpoint:  ▼ For / Against │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─ Bot 2 ─────────────────────┐   │
│  │ (same fields)               │   │
│  └─────────────────────────────┘   │
│                                     │
│           [▶ Start Debate]          │
└─────────────────────────────────────┘
```

- **Random buttons** 🎲: fill name + personality from loaded pools
- **Name pool**: ~20 fun bot names (Argus, Verity, etc.)
- **Personality pool**: loaded from `assets/personalities/*.md` — 8 personality files (Logical, Passionate, Sarcastic, Diplomatic, Aggressive, Witty, Analytical, Charismatic)
- **Viewpoint toggle**: user picks For/Against, or leaves for the app to auto-assign (Bot 1 = For, Bot 2 = Against by default)
- **Validation**: topic must be non-empty, max ~200 chars

### 2.2 Debate Screen (`src/screens/DebateScreen.tsx`)

**Purpose:** Live debate viewer with real-time message streaming.

**Layout:**
```
┌────────────────────────────────────────────────────┐
│  Topic: "Should AI have rights?"     Turn: 5       │
│                                                    │
│  ┌──────────────────────────────────────────────┐  │
│  │ 🔵 Cortex (Logical) — For                    │  │
│  │ The evidence suggests that AI systems...     │  │
│  ├──────────────────────────────────────────────┤  │
│  │ 🔴 Nova (Passionate) — Against               │  │
│  │ But we must not ignore the human cost...     │  │
│  ├──────────────────────────────────────────────┤  │
│  │ 🔵 Cortex (Logical) — For                    │  │
│  │ That's precisely why rational frameworks...  │  │
│  ├──────────────────────────────────────────────┤  │
│  │ (latest message)                             │  │
│  └──────────────────────────────────────────────┘  │
│                                                    │
│  [⏹ Stop]  [🏆 Declare Winner ▼]                  │
│  Thinking... ⏳ (while waiting for response)       │
└────────────────────────────────────────────────────┘
```

- Messages appear sequentially in a scrollable message list (like a chat)
- Each bot's messages styled with a distinct color/avatar
- "Thinking..." indicator shown while waiting for bot response
- Auto-scroll to latest message
- Responsive to window resize

### 2.3 Results Screen (`src/screens/ResultsScreen.tsx`)

**Purpose:** Debate end state — winner or nil.

**Options when debate ends:**
1. **User stops** → shows summary + "Who won?" buttons for each bot
2. **Auto-end (nil)** → shows "No consensus reached" with debate summary
3. **User declares winner** → highlights the chosen bot, shows closing statements

**Layout:**
```
┌─────────────────────────────────────────┐
│  🏁 Debate Complete                      │
│                                         │
│  Topic: "Should AI have rights?"        │
│  Turns: 12                              │
│                                         │
│  ┌─ Argus wins! ─────────────────────┐  │
│  │ "Final summary..."                │  │
│  └───────────────────────────────────┘  │
│                                         │
│           [🔄 New Debate]               │
└─────────────────────────────────────────┘
```

---

## Phase 3 — Rust Debate Engine (`src-tauri/src/debate_engine.rs`)

### 3.1 State Machine

```
     ┌──────────┐
     │   Idle   │
     └────┬─────┘
          │ StartDebate(topic, bot1, bot2)
          ▼
    ┌──────────────┐
    │  SettingUp   │  ← Generate personalities & viewpoints
    └──────┬───────┘
           │ Ready
           ▼
    ┌──────────────┐
    │ InProgress   │  ← Bot 1 speaks → Bot 2 speaks → ...
    │  (turn N)    │
    └──────┬───────┘
           │ StopRequested / TurnLimit
           ▼
    ┌──────────────┐
    │  Finished    │  ← winner: Some(name) or None (nil)
    └──────────────┘
```

### 3.2 Bot Agent

Each bot is an async task that:
1. **Receives** its personality, viewpoint, the debate topic, and the full conversation history
2. **Sends** a prompt to an LLM (see §4)
3. **Returns** a response string
4. **Emits** a `DebateMessage` event back to the frontend

```rust
pub struct BotAgent {
    config: BotConfig,
    llm_client: LlmClient,
}

impl BotAgent {
    pub async fn respond(&self, topic: &str, history: &[String]) -> Result<String, LlmError>;
}
```

### 3.3 Turn Orchestration

```rust
pub struct DebateEngine {
    state: Arc<Mutex<DebateState>>,
    topic: String,
    bot_a: BotAgent,
    bot_b: BotAgent,
    message_history: VecDeque<DebateMessage>,
    turn_limit: u32,         // e.g. 10 exchanges per side (20 turns)
    timeout_secs: u64,       // per-response timeout
    tx: Sender<DebateMessage>,  // channel to emit messages to frontend
}

impl DebateEngine {
    pub fn new(topic, bot_a_config, bot_b_config, tx: Sender<DebateMessage>) -> Self;
    pub async fn run(&mut self, stop_rx: oneshot::Receiver<()>) -> DebateResult;  /* main loop, returns result */
    pub fn stop(&self);  /* signal the running engine to stop */
}
```

### 3.4 Winner Determination

```rust
pub struct DebateResult {
    pub topic: String,
    pub winner: Option<String>,  // None = Nil/draw
    pub messages: Vec<DebateMessage>,
    pub total_turns: u32,
}

impl DebateEngine {
    // Called when user declares a winner or debate auto-ends
    fn finalize(&self, winner: Option<String>) -> DebateResult {
        // If user explicitly chose: return that bot's name
        // If auto-ended without agreement: None (Nil)
    }
}
```

---

## Phase 4 — LLM Integration

### 4.1 Backend (`src-tauri/src/llm.rs` — new file)

```rust
pub struct LlmClient {
    api_key: String,
    base_url: String,        // configurable (OpenAI, local model, etc.)
    model: String,            // e.g. "gpt-4o-mini" or local model
    timeout: Duration,
}

impl LlmClient {
    pub async fn chat(&self, messages: &[ChatMessage]) -> Result<String, LlmError>;
}

pub struct ChatMessage {
    pub role: String,    // "system" | "user" | "assistant"
    pub content: String,
}
```

### 4.2 System Prompts (Generated from Personality Files)

System prompts are **constructed at runtime** by combining the personality file data with the debate context. A helper in `personality.rs` builds the prompt:

```rust
pub fn build_system_prompt(personality: &Personality, topic: &str, viewpoint: &str) -> String {
    format!(
        "You are {} ({}). {}\n\nYour speech style: {}\n\nYour argumentative weakness: {}\n\nYou argue {} the topic: \"{}\"\n\nRespond concisely (2-3 sentences max). Be persuasive and try to WIN the debate. Previous debate messages are below — respond directly to them.",
        personality.name,
        personality.bot_name,
        personality.description,
        personality.speech_style,
        personality.weakness,
        viewpoint,
        topic
    )
}
```

This means every personality's unique voice, speech patterns, and argumentative style come directly from the markdown file — no code changes needed.

### 4.3 Configuration

- LLM API key stored in Tauri config or env var
- Model configurable via `tauri.conf.json` or a `.env` file
- Fallback: mock/responses mode for development without an API key

---

## Phase 5 — Tauri Commands

### 5.1 Commands (`src-tauri/src/lib.rs` — inline with `run()`)

All Tauri commands are defined in `lib.rs` alongside the `run()` function. They are registered via the `invoke_handler` macro.

```rust
#[tauri::command]
async fn start_debate(
    app: tauri::AppHandle,
    topic: String,
    bot_a: BotConfig,
    bot_b: BotConfig,
) -> Result<(), String> {
    // Launch DebateEngine in a background tokio task
    // Use app.emit() to send "debate_message", "debate_state_changed", etc.
    // Return immediately; frontend receives events via tauri::Emitter
}

#[tauri::command]
async fn stop_debate(
    state: State<RefCell<DebateState>>,
) -> Result<DebateResult, String> {
    // Signal the running engine to stop and return the debate result
}

#[tauri::command]
async fn declare_winner(
    app: tauri::AppHandle,
    bot_name: String,
) -> Result<(), String> {
    // Mark the debate as finished with the chosen winner
}

#[tauri::command]
async fn get_debate_status(
    state: State<RefCell<DebateState>>,
) -> Result<DebateState, String> {
    // Return current state
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(RefCell::new(DebateState::Idle))  // shared state
        .invoke_handler(tauri::generate_handler![
            start_debate,
            stop_debate,
            declare_winner,
            get_debate_status,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

### 5.2 Events

```rust
// Emitted from Rust → Frontend via tauri::Emitter
// Event names: "debate_message", "debate_state_changed", "debate_finished"

let msg = DebateMessage {
    speaker: "Cortex".to_string(),
    personality_name: "Logical".to_string(),
    message: "Response text".to_string(),
    turn: 1,
    timestamp: std::time::SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs(),
};
app.emit("debate_message", &msg).unwrap();
```

Each event sends a serializable struct as the payload of a named Tauri event. The frontend subscribes via `listen()` from `@tauri-apps/api`.

---

## Phase 6 — App Wiring & Polish

### 6.1 Wire Commands into Frontend

- Import commands via `@tauri-apps/api`
- Connect `start_debate` to SetupScreen submit
- Subscribe to events on DebateScreen
- Handle `stop_debate` and `declare_winner` buttons

### 6.2 Styling & Themes

- Dark/light mode via CSS variables
- Bot A: blue accent
- Bot B: red accent
- Smooth message animations (slide-in, fade)
- Custom scrollbar for message list
- Responsive layout

### 6.3 Window Sizing

- Increase default to `1000×700` for debate screen comfort
- Title: "Bot Debate"

### 6.4 Error Handling

- Show toast/alert on LLM errors
- Graceful degradation if API unreachable
- "Retry" option for failed messages

---

## File Structure (Target)

```
debatabot/
├── PLAN.md                          ← this file
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── src/
│   ├── index.tsx
│   ├── App.tsx                      ← route to screens
│   ├── App.css
│   ├── stores/
│   │   └── DebateStore.ts           ← Phase 1.4
│   ├── screens/
│   │   ├── SetupScreen.tsx          ← Phase 2.1
│   │   ├── DebateScreen.tsx         ← Phase 2.2
│   │   └── ResultsScreen.tsx        ← Phase 2.3
│   ├── assets/
│   │   └── logo.svg
│   └── vite-env.d.ts
└── src-tauri/
    ├── Cargo.toml
    ├── tauri.conf.json
    ├── capabilities/
    ├── icons/
    ├── gen/schemas/
    ├── assets/
    │   └── personalities/           ← Phase 1.2 (bundled as binary assets)
    │       ├── logical.md
    │       ├── passionate.md
    │       ├── sarcastic.md
    │       ├── diplomatic.md
    │       ├── aggressive.md
    │       ├── witty.md
    │       ├── analytical.md
    │       └── charismatic.md
    └── src/
        ├── main.rs
        ├── lib.rs
        ├── models.rs                ← Phase 1.3
        ├── personality.rs           ← Phase 1.1 (parser + loader)
        ├── debate_engine.rs         ← Phase 3
        ├── llm.rs                   ← Phase 4
        └── lib.rs                   ← Phase 1.1 + 1.3 + 3 + 4 + 5 (all commands + run)
```

---

## Implementation Order

| Step | What | Phase |
|------|------|-------|
| 1 | Create `personality.rs` — parser, `load_all()`, `build_system_prompt()` | 1.1 |
| 2 | Create `assets/personalities/*.md` — 8 personality files | 1.2 |
| 3 | Update `tauri.conf.json` — add `bundle.resources` to embed `assets/personalities/*.md` in binary | config |
| 4 | Create `models.rs` — core debate types | 1.3 |
| 5 | Finalize `lib.rs` — register all commands, load personalities, set up shared state & event bus | 5 |
| 6 | Build `DebateEngine` state machine (mock LLM first) | 3 |
| 7 | Implement `LlmClient` with OpenAI-compatible API | 4 |
| 8 | Build SetupScreen UI | 2.1 |
| 9 | Build DebateScreen UI | 2.2 |
| 10 | Build ResultsScreen UI | 2.3 |
| 11 | Wire frontend ↔ Rust commands & events | 6 |
| 12 | Style, theme, polish, animations | 6 |
| 13 | Add stop-declare-winner flow end-to-end | 3 + 5 |

> **Note:** `tauri.conf.json` `bundle.resources` should include:
> ```json
> {
>   "bundle": {
>     ...
>     "resources": ["assets/personalities/*.md"]
>   }
> }
> ```
> This ensures personality markdown files are shipped with the compiled binary and accessible at runtime via Tauri's resource path API.

---

## Future Considerations (Not in V1)

- **Multiple debate formats**: knockout, round-robin, audience poll
- **Debate history**: saved debates, watch later
- **Custom prompts**: let users add constraints or rules
- **Multiple LLM backends**: OpenAI, Anthropic, local (Ollama)
- **Transcript export**: save debates as text/markdown
- **Spectator mode**: watch others' debates
- **Difficulty scaling**: harder-to-convince bot behavior
- **Avatar images**: generated per personality
