# 🗣️ Debatabot

**Debatabot** is a desktop application where two AI-powered bots debate a user-chosen topic, each with a unique personality and viewpoint. Watch them go back and forth turn-by-turn in real time. You can stop the debate at any time or even declare a winner yourself.

![Debatabot](/screenshots/debate.png "Debate Screen")

---

## Features

- **Two AI Bots Debate**: Enter any topic and two AI-powered bots with distinct personalities argue opposing viewpoints in real time
- **8 Personalities**: Choose from Logical, Passionate, Sarcastic, Diplomatic, Aggressive, Witty, Analytical, and Charismatic
- **18 AI Providers**: Configure your preferred OpenAI-compatible backend — OpenAI, Ollama, OpenRouter, Groq, DeepSeek, Mistral, Perplexity, LM Studio, vLLM, Fireworks AI, and more (with support for custom endpoints)
- **Live Debate**: Watch messages stream in real-time via Tauri events with a "thinking..." indicator while bots respond
- **Declare a Winner**: Stop the debate and pick a winner, or let it end in a draw
- **Full Transcript**: Review the entire debate with timestamps and a summary after it ends
- **Persistent Settings**: LLM configuration is saved locally in SQLite so you only configure it once
- **Dark Theme**: Sleek dark UI with color-coded bot messages (blue vs red)

---

## Screenshots

### Setup Screen
Choose your topic, pick personalities for both bots, and select their viewpoints. Use the 🎲 button for random bot names and personalities.

### Debate Screen
Watch the debate unfold in real time. Messages alternate between bots, color-coded by speaker. Stop the debate or declare a winner mid-debate.

### Settings Screen
Configure your LLM backend — select a provider, enter your API key, and choose a model. Settings persist across sessions.

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+ and [pnpm](https://pnpm.io/)
- [Rust](https://www.rust-lang.org/tools/) toolchain
- [Tauri CLI](https://tauri.app/v1/guides/getting-started/prerequisites/)

```bash
cargo install tauri-cli --version "^2"
```

> **Note:** If you encounter issues with the `^2` version specifier, try `cargo install tauri-cli@2` or check the [Tauri documentation](https://tauri.app/v2/guides/getting-started/prerequisites/) for the latest installation instructions.

### Installation

```bash
pnpm install
```

### Development

Run the app in development mode with live reload:

```bash
pnpm tauri:dev
```

This starts both the Vite dev server and the Tauri frontend.

### Build

Build for production:

```bash
pnpm tauri:build
```

The bundled app will be in `src-tauri/target/release/bundle/`.

---

## How to Use

### 1. Configure Your LLM Provider

Before starting a debate, configure the LLM backend:

1. Click the ⚙️ **Settings** button (top-right gear icon) or navigate to Settings from the Setup screen
2. Select an **OpenAI-Compatible Provider** from the dropdown. This auto-fills the Base URL and Model fields
3. Enter your **API Key** (stored locally, sent only to the selected API)
4. Optionally customize the **Base URL** and **Model** for advanced configurations
5. Click **💾 Save Settings**

**Supported Providers:**

| Provider | Default URL | Example Model |
|----------|-------------|---------------|
| OpenAI | `https://api.openai.com/v1/chat/completions` | `gpt-4` |
| Ollama | `http://localhost:11434/v1/chat/completions` | `llama3` |
| OpenRouter | `https://openrouter.ai/api/v1/chat/completions` | `anthropic/claude-sonnet-4` |
| Together AI | `https://api.together.xyz/v1/chat/completions` | `mistralai/Mistral-7B-Instruct-v0.7` |
| LiteLLM | `http://localhost:4000/v1/chat/completions` | `gpt-4o-mini` |
| Groq | `https://api.groq.com/openai/v1/chat/completions` | `llama3-8b-8192` |
| DeepSeek | `https://api.deepseek.com/v1/chat/completions` | `deepseek-chat` |
| LM Studio | `http://localhost:1234/v1/chat/completions` | `gpt-4o-mini` |
| vLLM | `http://localhost:8000/v1/chat/completions` | `meta-llama/Llama-3-8B` |
| Mistral AI | `https://api.mistral.ai/v1/chat/completions` | `mistral-small-latest` |
| Perplexity | `https://api.perplexity.ai/chat/completions` | `sonar` |
| Cloudflare AI Gateway | `https://api.cloudflare.com/client/v4/accounts/{account_id}/ai/gateway/chat/completions` | `gpt-4o-mini` |
| Portkey | `https://api.portkey.ai/v1/chat/completions` | `gpt-4o-mini` |
| Anyscale | `https://api.anyscale.com/v1/chat/completions` | `gpt-4o-mini` |
| Fireworks AI | `https://api.fireworks.ai/v1/chat/completions` | `gpt-4o-mini` |
| LocalAI | `http://localhost:8080/v1/chat/completions` | `gpt-4o-mini` |
| Llama.cpp | `http://localhost:8080/v1/chat/completions` | `llama-3-8b` |
| Custom | _(enter manually)_ | _(enter manually)_ |

> **Note:** A non-empty API key and base URL are **required** to start a debate. Local providers like Ollama and LM Studio require the server to be running on the specified port.

### 2. Set Up a Debate

On the Setup screen:

1. **Enter a Topic** — e.g., "Should AI have rights?"
2. **Configure Bot 1**:
   - Give it a name or click 🎲 for a random one
   - Pick a personality from the dropdown (e.g., Logical, Sarcastic)
   - Toggle **For** or **Against** their viewpoint
3. **Configure Bot 2** with a different personality
4. Click **▶ Start Debate**

> **Tip**: Pick contrasting personalities (e.g., Logical vs Passionate) for the most entertaining debates.

### 3. Watch the Debate

The debate runs in real time:
- Bots alternate turns, responding to each other's arguments
- A "thinking..." indicator shows while a bot is generating a response
- Messages are color-coded: **blue** for Bot A, **red** for Bot B

During the debate, you can:
- **⏹ Stop** — End the debate and choose a winner
- **🏆 Declare Winner** — Pick which bot won the debate
- Wait for the debate to complete and see the results screen

### 4. Results

After the debate ends, you'll see:
- **Winner** (if declared) or **"No Consensus Reached"** (if ended without agreement)
- A summary: topic, total turns, and result
- The full **transcript** with timestamps for every message
- Click **🔄 New Debate** to start over

---

## Architecture

Debatabot is built with a **Rust backend** (Tauri 2) and a **Solid.js frontend**:

```
┌─────────────────────────────────────┐
│         Frontend (Solid.js)          │
│                                      │
│  Setup Screen → Debate Screen → Results Screen │
│         ↕              ↕                  │
│  Settings Screen ──► LLM Config UI   │
└──────────┬──────────────────────────┘
           │ Tauri Commands & Events
           ▼
┌─────────────────────────────────────┐
│         Backend (Rust / Tauri)       │
│                                      │
│  DebateEngine  ──►  Bot Agent A     │
│       │                Bot Agent B    │
│       │                          │   │
│  LLM API calls  ──►  SQLite (settings) │
└─────────────────────────────────────┘
```

**Key components:**
- **Personality system** — 8 personality profiles loaded from bundled `.md` files. Each defines a bot's name, description, speech style, and argumentative weakness
- **Debate engine** — Rust state machine that orchestrates turns between two bot agents (default 10 turns per side, configurable via `DEBATE_TURN_LIMIT` env var)
- **LLM client** — Makes async HTTP requests to any OpenAI-compatible API (non-streaming)
- **SQLite persistence** — LLM settings stored in `~/.debatabot/debatabot.db`

---

## Configuration

### Database Location

LLM settings are stored in a local SQLite database:

```
~/.debatabot/debatabot.db
```

This database has a single `providers` table with columns: `provider`, `api_key`, `base_url`, `model`, `max_tokens`, `temperature`, and `is_default`.

### Security

- Your API key is stored **locally only** — it's never sent anywhere except the configured LLM API
- The database lives in your home directory, not bundled with the app

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **UI** | Solid.js + TypeScript + Vite |
| **Desktop** | Tauri 2 (Rust) |
| **State** | Solid.js signals + stores |
| **Styling** | CSS (dark theme) |
| **AI Backend** | OpenAI-compatible LLM APIs |
| **Persistence** | SQLite (via rusqlite) |
| **Build Tools** | Biome for linting and formatting |

---

## Project Structure

```
debatabot/
├── src/
│   ├── screens/
│   │   ├── SetupScreen.tsx          ← Topic + bot configuration
│   │   ├── DebateScreen.tsx         ← Live debate viewer
│   │   ├── ResultsScreen.tsx        ← Debate results + transcript
│   │   └── SettingsScreen.tsx       ← LLM provider configuration
│   ├── stores/
│   │   └── DebateStore.ts           ← Global state management
│   ├── types.ts                     ← TypeScript type definitions
│   ├── App.tsx                      ← App shell + routing
│   └── App.css                      ← Dark theme styles
└── src-tauri/
    ├── assets/personalities/        ← 8 personality .md files
│   │   ├── logical.md
│   │   ├── passionate.md
│   │   ├── sarcastic.md
│   │   ├── diplomatic.md
│   │   ├── aggressive.md
│   │   ├── witty.md
│   │   ├── analytical.md
│   │   └── charismatic.md
    └── src/
        ├── lib.rs                   ← Tauri commands + event bus
        ├── models.rs                ← Debate domain types
        ├── personality.rs           ← Personality parser & loader
        ├── debate_engine.rs         ← Debate state machine
        ├── llm.rs                   ← LLM API client
        └── db.rs                    ← SQLite persistence
```

---

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm tauri:dev` | Run in development mode with live reload |
| `pnpm tauri:build` | Build for production |
| `pnpm tauri:bundle` | Create installer bundles |
| `pnpm lint` | Check code quality with Biome |
| `pnpm lint:fix` | Auto-fix lint issues |
| `pnpm format` | Format code with Biome |
| `pnpm tauri:info` | Show Tauri project information |

---

## License

MIT
