import { createSignal, createEffect, Show, For } from "solid-js";
import { invoke } from "@tauri-apps/api/core";
import type { LlmSettings } from "../types";

interface SettingsScreenProps {
	settings: LlmSettings;
	onSave: (settings: LlmSettings) => void;
	onBack: () => void;
}

export default function SettingsScreen({
	settings,
	onSave,
	onBack,
}: SettingsScreenProps) {
	const [apiKey, setApiKey] = createSignal(settings.apiKey);
	const [baseUrl, setBaseUrl] = createSignal(settings.baseUrl);
	const [model, setModel] = createSignal(settings.model);
	const [saving, setSaving] = createSignal(false);
	const [saved, setSaved] = createSignal(false);
	const [error, setError] = createSignal("");

	const commonModels = [
		"gpt-4o-mini",
		"gpt-4o",
		"gpt-4-turbo",
		"gpt-3.5-turbo",
		"o1-mini",
		"o1",
	];

	createEffect(() => {
		setApiKey(settings.apiKey);
		setBaseUrl(settings.baseUrl);
		setModel(settings.model);
		setSaved(false);
	});

	const handleSave = async () => {
		setError("");
		setSaved(false);
		setSaving(true);
		try {
			const newSettings: LlmSettings = {
				apiKey: apiKey().trim(),
				baseUrl: baseUrl().trim(),
				model: model().trim(),
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
							OpenAI API. Leave empty to use mock responses.
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
						<span class="field-hint">
							OpenAI-compatible API endpoint. Leave default for OpenAI.
						</span>
					</div>

					<div class="form-group">
						<label for="model">Model</label>
						<div class="input-with-suggest">
							<input
								id="model"
								type="text"
								placeholder="gpt-4o-mini"
								value={model()}
								onInput={(e) => setModel(e.currentTarget.value)}
							/>
							<div class="model-suggestions">
								<For each={commonModels}>
									{(m) => (
										<button
											type="button"
											class="model-suggestion"
											onClick={() => setModel(m)}
										>
											{m}
										</button>
									)}
								</For>
							</div>
						</div>
						<span class="field-hint">
							Model ID for the API. Choose from suggestions or enter a custom
							model.
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
