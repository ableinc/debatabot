import { invoke } from "@tauri-apps/api/core";
import { createEffect, createSignal, For, Show } from "solid-js";
import type { LlmSettings } from "../types";

interface SettingsScreenProps {
	settings: LlmSettings;
	onSave: (settings: LlmSettings) => void;
	onBack: () => void;
}

const providers: { name: string; baseUrl: string; placeholder: string }[] = [
	{
		name: "OpenAI",
		baseUrl: "https://api.openai.com/v1/chat/completions",
		placeholder: "gpt-4o-mini",
	},
	{
		name: "Ollama",
		baseUrl: "http://localhost:11434/v1/chat/completions",
		placeholder: "llama3",
	},
	{
		name: "OpenRouter",
		baseUrl: "https://openrouter.ai/api/v1/chat/completions",
		placeholder: "anthropic/claude-sonnet-4",
	},
	{
		name: "Together AI",
		baseUrl: "https://api.together.xyz/v1/chat/completions",
		placeholder: "mistralai/Mistral-7B-Instruct-v0.7",
	},
	{
		name: "LiteLLM",
		baseUrl: "http://localhost:4000/v1/chat/completions",
		placeholder: "gpt-4o-mini",
	},
	{
		name: "Groq",
		baseUrl: "https://api.groq.com/openai/v1/chat/completions",
		placeholder: "llama3-8b-8192",
	},
	{
		name: "DeepSeek",
		baseUrl: "https://api.deepseek.com/v1/chat/completions",
		placeholder: "deepseek-chat",
	},
	{
		name: "LM Studio",
		baseUrl: "http://localhost:1234/v1/chat/completions",
		placeholder: "gpt-4o-mini",
	},
	{
		name: "vLLM",
		baseUrl: "http://localhost:8000/v1/chat/completions",
		placeholder: "meta-llama/Llama-3-8B",
	},
	{
		name: "Mistral AI",
		baseUrl: "https://api.mistral.ai/v1/chat/completions",
		placeholder: "mistral-small-latest",
	},
	{
		name: "Perplexity",
		baseUrl: "https://api.perplexity.ai/chat/completions",
		placeholder: "sonar",
	},
	{
		name: "Cloudflare AI Gateway",
		baseUrl: "https://api.gateway.ai.cloudflare.com/chat/v1/completions",
		placeholder: "cf_cloudflare-clarity",
	},
	{
		name: "Portkey",
		baseUrl: "https://api.portkey.ai/v1/chat/completions",
		placeholder: "gpt-4o-mini",
	},
	{
		name: "Anyscale",
		baseUrl: "https://api.endpoints.anyscale.com/v1/chat/completions",
		placeholder: "meta-llama/Llama-2-7b-chat",
	},
	{
		name: "Fireworks AI",
		baseUrl: "https://api.fireworks.ai/inference/v1/chat/completions",
		placeholder: "accounts/fireworks/models/llama-v3-8b-instruct",
	},
	{
		name: "LocalAI",
		baseUrl: "http://localhost:8080/v1/chat/completions",
		placeholder: "llama-2-7b-chat",
	},
	{
		name: "Llama.cpp",
		baseUrl: "http://localhost:8080/v1/chat/completions",
		placeholder: "llama-2-7b-chat",
	},
];

export default function SettingsScreen({
	settings,
	onSave,
	onBack,
}: SettingsScreenProps) {
	const [apiKey, setApiKey] = createSignal(settings.apiKey);
	const [baseUrl, setBaseUrl] = createSignal(settings.baseUrl);
	const [model, setModel] = createSignal(settings.model);
	const [maxTokens, setMaxTokens] = createSignal(settings.maxTokens);
	const [provider, setProvider] = createSignal("");
	const [saving, setSaving] = createSignal(false);
	const [saved, setSaved] = createSignal(false);
	const [error, setError] = createSignal("");

	// Detect which provider matches current baseUrl
	createEffect(() => {
		const matched = providers.find((p) => p.baseUrl === settings.baseUrl);
		setProvider(matched?.name || "");
	});

	createEffect(() => {
		setApiKey(settings.apiKey);
		setBaseUrl(settings.baseUrl);
		setModel(settings.model);
		setMaxTokens(settings.maxTokens);
		setSaved(false);
	});

	// Update baseUrl and model when provider is selected
	const handleProviderChange = (e: Event) => {
		const selectedName = (e.currentTarget as HTMLSelectElement).value;
		setProvider(selectedName);
		const matched = providers.find((p) => p.name === selectedName);
		if (matched) {
			setBaseUrl(matched.baseUrl);
			setModel(matched.placeholder);
		}
	};

	const handleSave = async () => {
		setError("");
		setSaved(false);
		setSaving(true);
		try {
			const newSettings: LlmSettings = {
				apiKey: apiKey().trim(),
				baseUrl: baseUrl().trim(),
				model: model().trim(),
				maxTokens: Number(maxTokens()),
			};
			await invoke("save_llm_settings", { settings: newSettings });
			onSave(newSettings);
			setSaved(true);
			setTimeout(() => setSaved(false), 2000);
		} catch (e) {
			console.error("Failed to save settings:", e);
			setError(`Failed to save: ${e}`);
		} finally {
			setSaving(false);
		}
	};

	const handleCancel = () => {
		setApiKey(settings.apiKey);
		setBaseUrl(settings.baseUrl);
		setModel(settings.model);
		setMaxTokens(settings.maxTokens);
		onBack();
	};

	return (
		<div class="settings-screen">
			<div class="settings-header">
				<h1>⚙️ Settings</h1>
				<button type="button" class="back-btn" onClick={onBack}>
					← Back
				</button>
			</div>

			<Show when={error()}>
				<div class="error-banner">{error()}</div>
			</Show>

			<Show when={saved()}>
				<div class="success-banner">✅ Settings saved!</div>
			</Show>

			<div class="settings-content">
				<div class="settings-section">
					<h2>🤖 OpenAI Configuration</h2>
					<p class="section-desc">
						Configure the LLM backend used for generating debate responses.
						Settings are persisted locally via SQLite.
					</p>

					<div class="form-group">
						<label for="api-key">API Key</label>
						<input
							id="api-key"
							type="password"
							placeholder="sk-..."
							value={apiKey()}
							onInput={(e) => setApiKey(e.currentTarget.value)}
						/>
						<span class="field-hint">
							Your key is stored locally and never sent anywhere except the
							OpenAI API.
						</span>
					</div>

					<div class="form-group">
						<label for="provider">Provider</label>
						<select
							id="provider"
							class="provider-select"
							value={provider()}
							onChange={handleProviderChange}
						>
							<option value="">Custom / Other</option>
							<For each={providers}>
								{(p) => <option value={p.name}>{p.name}</option>}
							</For>
						</select>
						<span class="field-hint">
							Select an OpenAI-compatible provider. You can still customize the
							Base URL and Model below.
						</span>
					</div>

					<div class="form-group">
						<label for="base-url">Base URL</label>
						<input
							id="base-url"
							type="text"
							placeholder="https://api.openai.com/v1/chat/completions"
							value={baseUrl()}
							onInput={(e) => setBaseUrl(e.currentTarget.value)}
						/>
						<span class="field-hint">OpenAI-compatible API endpoint.</span>
					</div>

					<div class="form-group">
						<label for="model">Model</label>
						<input
							id="model"
							type="text"
							placeholder="gpt-4o-mini"
							value={model()}
							onInput={(e) => setModel(e.currentTarget.value)}
						/>
						<span class="field-hint">
							Model ID for the API. Enter a custom model or leave blank.
						</span>
					</div>

					<div class="form-group">
						<label for="max-tokens">Max Tokens</label>
						<input
							id="max-tokens"
							type="number"
							min="1"
							max="16384"
							value={maxTokens()}
							onInput={(e) => setMaxTokens(Number(e.currentTarget.value))}
						/>
						<span class="field-hint">
							Maximum response length in tokens (1-16,384). Higher values allow
							longer responses but cost more.
						</span>
					</div>
				</div>

				<div class="settings-actions">
					<button
						type="button"
						class="save-btn"
						onClick={handleSave}
						disabled={saving()}
					>
						{saving() ? "Saving..." : "💾 Save Settings"}
					</button>
					<button type="button" class="cancel-btn" onClick={handleCancel}>
						Cancel
					</button>
				</div>
			</div>
		</div>
	);
}
