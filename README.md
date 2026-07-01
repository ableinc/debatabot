# 🗣️ Debatabot

**Debatabot** is a desktop application where two AI-powered bots debate a user-chosen topic, each with a unique personality and viewpoint. Watch them go back and forth turn-by-turn in real time, declare a winner mid-debate or at the end, and review the full history of past debates.

![Debatabot](/screenshots/debate.png "Debate Screen")

---

## Features

- **Two AI Bots Debate**: Enter any topic and two AI-powered bots with distinct personalities argue opposing viewpoints in real time
- **8 Personalities**: Aggressive (Vanguard), Analytical (Rigor), Charismatic (Aurelius), Diplomatic (Sage), Logical (Cortex), Passionate (Nova), Sarcastic (Wry), and Witty (Jest)
- **18 AI Providers**: Configure any OpenAI-compatible backend — OpenAI, Ollama, OpenRouter, Groq, DeepSeek, Mistral, Perplexity, LM Studio, vLLM, Fireworks AI, and more (with support for custom endpoints)
- **Animated Typing Indicator**: A color-matched bouncing-dot bubble shows while the next bot is generating its response
- **Declare a Winner**: Stop the debate any time — a confirmation dialog prevents accidental stops. When the debate ends naturally, a winner-selection dialog lets you pick the winner or call a draw
- **Full Transcript**: Review the entire debate with per-turn timestamps on the Results screen
- **Debate History**: Paginated history screen shows all past debates. Click any row to replay the full conversation
- **Persistent Storage**: LLM configuration and all debate history (including messages) saved locally in SQLite
- **Dark Theme**: Sleek dark UI with color-coded bot messages (indigo for Bot A, rose for Bot B)

---

## Screenshots

### Setup Screen
Choose your topic, pick personalities for both bots, and select their viewpoints. Use the 🎲 button for random bot names and personalities.

### Debate Screen
Watch the debate unfold in real time. Messages alternate between bots, color-coded by speaker. An animated typing bubble shows while the next bot is thinking. Stop the debate or declare a winner at any time — both actions show a confirmation dialog first.

### Results Screen
See the winner (with confetti) or a draw banner, a 3-card summary (topic, total turns, result), and a collapsible full transcript. If no winner was declared during the debate, a winner-selection dialog appears before navigating here.

### History Screen
Browse all past debates in a paginated list. Each row shows the topic, bot names, winner badge, date, and turn/message counts. Click any row to open the full debate transcript.

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

1. Click the ⚙️ **Settings** button (top-right gear icon)
2. Select an **OpenAI-Compatible Provider** from the list — this auto-fills the Base URL and Model fields
3. Enter your **API Key** (stored locally, sent only to the selected API)
4. Optionally customize the **Base URL** and **Model**
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
| Cloudflare AI Gateway | `https://api.cloudflare.com/.../ai/gateway/chat/completions` | `gpt-4o-mini` |
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
2. **Configure Bot 1**: give it a name (or click 🎲 for a random one), pick a personality, and toggle **For** or **Against**
3. **Configure Bot 2** with a different personality
4. Click **▶ Start Debate**

> **Tip**: Contrasting personalities produce the most interesting debates (e.g., Logical vs Passionate, Aggressive vs Diplomatic).

### 3. Watch the Debate

- Bots alternate turns, each responding to what the other just said
- An animated typing bubble (color-matched to the next speaker) shows while a response is being generated
- Messages are color-coded: **indigo** for Bot A, **rose** for Bot B

During the debate you can:
- **⏹ Stop** — shows a confirmation dialog, then ends the debate
- **🏆 Declare Winner** — shows a confirmation dialog, stops the debate, and marks the chosen bot as winner

### 4. End of Debate

When the debate concludes (naturally or via Stop):
- If a winner was pre-declared, the Results screen opens immediately
- If no winner was chosen, a **winner-selection dialog** appears — pick Bot A, Bot B, or declare a Draw

### 5. Results

The Results screen shows:
- **Winner banner** with confetti, or a **Draw** banner
- A summary card: topic, total turns, and result
- The full **transcript** (collapsible) with per-turn timestamps
- Click **⚡ New Debate** to start over

### 6. History

Click the 🕐 **History** button (top-right, next to Settings) to browse all past debates:
- Paginated list showing topic, bots, winner, date, and turn count
- Click any row to open the full conversation transcript
- History is stored locally and persists across app restarts

---

## Personalities

Each personality has a distinct bot name, debate style, and argumentative weakness:

| Personality | Bot Name | Style | Weakness |
|-------------|----------|-------|----------|
| **Aggressive** | Vanguard | Combative, relentless, never concedes | Can read as bullying; dismisses valid counterpoints |
| **Analytical** | Rigor | Structured breakdowns, names logical fallacies | Gets lost in detail; loses the audience |
| **Charismatic** | Aurelius | Storytelling, relatable framing, inclusive | Charm masks weak arguments under scrutiny |
| **Diplomatic** | Sage | Acknowledges both sides, finds nuance | Can seem indecisive; hard to commit to a position |
| **Logical** | Cortex | Pure deductive reasoning, no emotion | Cold delivery alienates; right but unpersuasive |
| **Passionate** | Nova | Moral urgency, vivid imagery, rallying calls | Overreached claims collapse under fact-checking |
| **Sarcastic** | Wry | Deadpan irony, makes opponent sound absurd | Alienates undecided audiences; argument gets lost |
| **Witty** | Jest | Unexpected reframes, clever analogies | Audiences remember the joke, forget the argument |

---

## Architecture

Debatabot is built with a **Rust backend** (Tauri 2) and a **Solid.js frontend**:

```
┌──────────────────────────────────────────────────┐
│                Frontend (Solid.js)                │
│                                                    │
│  Setup → Debate → Results → History               │
│              ↕                                     │
│  Settings ──► LLM Config · History Screen         │
└──────────────────┬───────────────────────────────┘
                   │  Tauri Commands & Events
                   ▼
┌──────────────────────────────────────────────────┐
│              Backend (Rust / Tauri 2)             │
│                                                    │
│  DebateEngine ──► BotAgent A ──► LLM API         │
│       │          BotAgent B ──► LLM API           │
│       │                                            │
│  SQLite (providers · debates · debate_messages)   │
└──────────────────────────────────────────────────┘
```

**Key components:**

- **Personality system** — 8 personality profiles loaded from bundled `.md` files at `src-tauri/assets/personalities/`. Each defines a bot name, personality, speech style, and argumentative weakness. The debate engine injects these into the system prompt for each bot
- **Debate engine** — Rust state machine that orchestrates alternating turns between two `BotAgent`s. Default 10 turns, configurable via the `DEBATE_TURN_LIMIT` environment variable. History is passed to each bot as a proper `user`/`assistant` role-alternating conversation so responses build on prior turns
- **LLM client** — Async HTTP requests to any OpenAI-compatible `/v1/chat/completions` endpoint (non-streaming, 10-minute timeout)
- **SQLite persistence** — All data in `~/.debatabot/debatabot.db`:
  - `providers` — LLM provider configs
  - `debates` — One row per completed debate (topic, bots, winner, turn count)
  - `debate_messages` — All messages for every debate, linked by `debate_id`

---

## Configuration

### Database Location

```
~/.debatabot/debatabot.db
```

### Turn Limit

The default debate length is 10 turns (5 per bot). Override with an environment variable before launching:

```bash
DEBATE_TURN_LIMIT=20 pnpm tauri:dev
```

### Security

- API keys are stored **locally only** — never sent anywhere except the configured provider's endpoint
- The database lives in your home directory, not bundled with the app

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **UI** | Solid.js + TypeScript + Vite |
| **Desktop** | Tauri 2 (Rust) |
| **Styling** | Tailwind CSS v4 (dark theme, CSS custom properties) |
| **State** | Solid.js signals |
| **AI Backend** | OpenAI-compatible LLM APIs |
| **Persistence** | SQLite via rusqlite |
| **Linting** | Biome |

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
