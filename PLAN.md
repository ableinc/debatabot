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

### 1.1 Rust Domain Types (`src-tauri/src/models.rs` — new file)

```rust
// Core types
pub struct DebateTopic {
    pub topic: String,
}

pub struct BotConfig {
    pub name: String,
    pub personality: String,   // e.g. "Logical & Analytical"
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
    pub personality: String,
    pub message: String,
    pub turn: u32,
    pub timestamp: u64,
}
```

### 1.2 Frontend State Store (`src/stores/DebateStore.ts` — new file)

```typescript
// Solid.js store for debate state
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

- **Random buttons** 🎲: fill name + personality from predefined pools
- **Name pool**: ~20 fun bot names (Argus, Verity, Cortex, Nova, etc.)
- **Personality pool**: 8-10 archetypes (Logical, Passionate, Sarcastic, Diplomatic, Aggressive, Witty, Analytical, Charismatic)
- **Viewpoint toggle**: user picks For/Against, or leaves for the app to auto-assign (Bot 1 = For, Bot 2 = Against by default)
- **Validation**: topic must be non-empty, max ~200 chars

### 2.2 Debate Screen (`src/screens/DebateScreen.tsx`)

**Purpose:** Live debate viewer with real-time message streaming.

**Layout:**
```
┌──────────────────────────────────────────────┐
│  Topic: "Should AI have rights?"             │
│  Turn: 5                                     │
│                                              │
│  ┌─ Argus (Logical & Analytical) — For ───┐  │
│  │ AI should have rights because...       │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  ┌─ Nova (Passionate & Charismatic) — Against ┐│
│  │ Rights require consciousness, which AI     ││
│  │ doesn't truly have.                        ││
│  └───────────────────────────────────────────┘│
│                                              │
│  [⏹ Stop]  [🏆 Declare Winner ▼]             │
│                                              │
│  Thinking... ⏳  (shown while waiting)        │
└──────────────────────────────────────────────┘
```

- Messages appear sequentially (animated slide-in)
- Each bot's messages styled with a distinct color/avatar
- "Thinking..." indicator while waiting for bot response
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
    pub async fn respond(&self, topic: &str, history: &[String]) -> String;
}
```

### 3.3 Turn Orchestration

```rust
pub struct DebateEngine {
    state: AtomicState<DebateState>,
    topic: String,
    bot_a: BotAgent,
    bot_b: BotAgent,
    message_history: VecDeque<DebateMessage>,
    turn_limit: u32,         // e.g. 10 exchanges per side (20 turns)
    timeout_secs: u64,       // per-response timeout
}

impl DebateEngine {
    pub fn new(topic, bot_a_config, bot_b_config) -> Self;
    pub async fn run(&mut self, stop_rx: oneshot::Receiver<()>) { /* main loop */ }
    pub async fn stop(&self) -> Option<String>;  /* determine winner */
}
```

### 3.4 Winner Determination

```rust
impl DebateEngine {
    // Called when user declares a winner or debate auto-ends
    fn determine_winner(&self) -> Option<String> {
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

### 4.2 System Prompts

**Bot A system prompt:**
```
You are {name}, a {personality} debater.
You argue FOR the topic: "{topic}"
Respond concisely (2-3 sentences max).
Be persuasive and try to WIN the debate.
Previous debate messages are below. Respond directly to them.
```

**Bot B system prompt:**
```
You are {name}, a {personality} debater.
You argue AGAINST the topic: "{topic}"
Respond concisely (2-3 sentences max).
Be persuasive and try to WIN the debate.
Previous debate messages are below. Respond directly to them.
```

### 4.3 Configuration

- LLM API key stored in Tauri config or env var
- Model configurable via `tauri.conf.json` or a `.env` file
- Fallback: mock/responses mode for development without an API key

---

## Phase 5 — Tauri Commands

### 5.1 Commands (`src-tauri/src/commands.rs` — new file)

```rust
#[tauri::command]
async fn start_debate(
    topic: String,
    bot_a: BotConfig,
    bot_b: BotConfig,
    event_emitter: Emitter,
) -> Result<String, String> {
    // Launch DebateEngine in background task
    // Return immediately; frontend receives events
}

#[tauri::command]
async fn stop_debate() -> Result<DebateResult, String> {
    // Signal the running engine to stop
}

#[tauri::command]
async fn declare_winner(bot_name: String) -> Result<DebateResult, String> {
    // Mark the debate as finished with winner
}

#[tauri::command]
async fn get_debate_status() -> Result<DebateState, String> {
    // Return current state
}
```

### 5.2 Events

```rust
// Emitted from Rust → Frontend
struct DebateMessageEvent {
    message: DebateMessage,
}

struct DebateStateChangedEvent {
    state: DebateState,
}

struct DebateFinishedEvent {
    result: DebateResult,
}
```

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
│   │   └── DebateStore.ts           ← Phase 1.2
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
    └── src/
        ├── main.rs
        ├── lib.rs
        ├── models.rs                ← Phase 1.1
        ├── debate_engine.rs         ← Phase 3
        ├── llm.rs                   ← Phase 4
        ├── commands.rs              ← Phase 5
        └── personalities.rs         ← name/personality pools
```

---

## Implementation Order

| Step | What | Phase |
|------|------|-------|
| 1 | Create `models.rs`, `personalities.rs` with types + pools | 1 |
| 2 | Wire up `lib.rs` — register commands, set up event bus | 5 |
| 3 | Build `DebateEngine` state machine (mock LLM) | 3 |
| 4 | Implement `LlmClient` with OpenAI-compatible API | 4 |
| 5 | Build SetupScreen UI | 2.1 |
| 6 | Build DebateScreen UI | 2.2 |
| 7 | Build ResultsScreen UI | 2.3 |
| 8 | Wire frontend ↔ Rust commands & events | 6 |
| 9 | Style, theme, polish, animations | 6 |
| 10 | Add stop-declare-winner flow end-to-end | 3 + 5 |

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
