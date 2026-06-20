import { invoke } from "@tauri-apps/api/core";
import { createSignal, For, Show } from "solid-js";
import logger from "../lib/logger";
import { type AppSetting, type LLMProvider, LLMProviderEnum } from "../types";

interface SettingsScreenProps {
	settings: AppSetting[];
	providerOptions: Record<LLMProviderEnum, LLMProvider>;
	onSave: (settings: AppSetting[]) => void;
	onBack: () => void;
}

export default function SettingsScreen({
	settings,
	providerOptions,
	onSave,
	onBack,
}: SettingsScreenProps) {
	const [defaultSetting, setDefaultSetting] = createSignal<AppSetting>(
		settings.filter((s) => s.is_default)[0] || {
			...providerOptions[LLMProviderEnum.OpenAI],
			is_default: true,
		},
	);
	const [newProvider, setNewProvider] = createSignal<string>("");
	const [newApiKey, setNewApiKey] = createSignal<string>("");
	const [newBaseUrl, setNewBaseUrl] = createSignal<string>("");
	const [newModel, setNewModel] = createSignal<string>("");
	const [newMaxTokens, setNewMaxTokens] = createSignal<number>(0);
	const [newIsDefault, setNewIsDefault] = createSignal<boolean>(false);
	const [saving, setSaving] = createSignal<boolean>(false);
	const [saved, setSaved] = createSignal<boolean>(false);
	const [error, setError] = createSignal<string>("");

	// Update baseUrl and model when provider is selected
	const handleProviderChange = (e: Event) => {
		const selectedName = (e.currentTarget as HTMLSelectElement)
			.value as LLMProviderEnum;
		const matched = providerOptions[selectedName];
		if (matched) {
			setNewProvider(matched.provider.trim());
			setNewBaseUrl(matched.baseUrl.trim());
			setNewApiKey("");
			setNewModel(matched.model.trim());
			setNewMaxTokens(matched.maxTokens);
		}
	};

	const handleSave = async () => {
		setError("");
		setSaved(false);
		setSaving(true);
		try {
			const newSettings: AppSetting = {
				provider: newProvider().trim() as LLMProviderEnum,
				apiKey: newApiKey().trim(),
				baseUrl: newBaseUrl().trim(),
				model: newModel().trim(),
				maxTokens: Number(newMaxTokens()),
				is_default: newIsDefault(),
			};
			if (newSettings.is_default) {
				setDefaultSetting(newSettings);
			}
			const updatedSettings = settings.filter(
				(s) => s.provider !== newSettings.provider,
			);
			updatedSettings.push(newSettings);
			await invoke("save_llm_settings", { settings: updatedSettings });
			onSave(updatedSettings);
			setSaved(true);
			setTimeout(() => setSaved(false), 2000);
		} catch (e) {
			logger.error("Failed to save settings:", e);
			setError(`Failed to save: ${e}`);
		} finally {
			setSaving(false);
		}
	};

	const handleCancel = () => {
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
							value={defaultSetting().apiKey || newApiKey()}
							onInput={(e) => setNewApiKey(e.currentTarget.value)}
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
							value={defaultSetting().provider || newProvider()}
							onChange={handleProviderChange}
						>
							<option value="">Custom / Other</option>
							<For each={Object.values(providerOptions)}>
								{(p) => <option value={p.provider}>{p.provider}</option>}
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
							value={defaultSetting().baseUrl || newBaseUrl()}
							onInput={(e) => setNewBaseUrl(e.currentTarget.value)}
						/>
						<span class="field-hint">OpenAI-compatible API endpoint.</span>
					</div>

					<div class="form-group">
						<label for="model">Model</label>
						<input
							id="model"
							type="text"
							placeholder="gpt-4o-mini"
							value={defaultSetting().model || newModel()}
							onInput={(e) => setNewModel(e.currentTarget.value)}
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
							max="256000"
							value={defaultSetting().maxTokens || newMaxTokens()}
							onInput={(e) => setNewMaxTokens(Number(e.currentTarget.value))}
						/>
						<span class="field-hint">
							Maximum response length in tokens (1-16,384). Higher values allow
							longer responses but cost more.
						</span>
					</div>

					<div class="form-group checkbox-group">
						<input
							id="default-setting"
							type="checkbox"
							checked={defaultSetting().is_default || newIsDefault()}
							onChange={(e) => setNewIsDefault(e.currentTarget.checked)}
						/>
						<label for="default-setting">Set as default provider</label>
						<span class="field-hint">
							If checked, this provider will be used by default for debates.
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
