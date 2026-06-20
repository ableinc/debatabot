import { invoke } from "@tauri-apps/api/core";
import { createSignal, For, onMount, Show } from "solid-js";
import logger from "../lib/logger";
import type { LLMProvider, LLMProviderEnum } from "../types";

interface SettingsScreenProps {
	providers: LLMProvider[];
	acceptedProviders: Record<LLMProviderEnum, LLMProvider>;
	onSave: (settings: LLMProvider[]) => void;
	onBack: () => void;
}

export default function SettingsScreen({
	providers: initialProviders,
	acceptedProviders: providerOptions,
	onSave,
	onBack,
}: SettingsScreenProps) {
	const [providers, setProviders] =
		createSignal<LLMProvider[]>(initialProviders);
	const [newProvider, setNewProvider] = createSignal<LLMProvider | null>(null);
	const [newApiKey, setNewApiKey] = createSignal<string>("");
	const [newBaseUrl, setNewBaseUrl] = createSignal<string>("");
	const [newModel, setNewModel] = createSignal<string>("");
	const [newMaxTokens, setNewMaxTokens] = createSignal<number>(256000);
	const [newTemperature, setNewTemperature] = createSignal<number>(0.7);
	const [saving, setSaving] = createSignal<boolean>(false);
	const [saved, setSaved] = createSignal<boolean>(false);
	const [error, setError] = createSignal<string>("");
	const [deleteConfirm, setDeleteConfirm] = createSignal<string | null>(null);

	// Load providers from DB on mount
	onMount(async () => {
		try {
			const loaded = await invoke<LLMProvider[]>("get_llm_settings");
			setProviders(loaded);
		} catch (e) {
			logger.error("Failed to load LLM settings:", e);
		}
	});

	const hasDefault = () => providers().some((p) => p.isDefault);

	const handleProviderSelect = (e: Event) => {
		const selectedName = (e.currentTarget as HTMLSelectElement)
			.value as LLMProviderEnum;
		const matched = providerOptions[selectedName];
		if (matched) {
			const existing = providers().find((p) => p.provider === matched.provider);
			if (existing) {
				editProvider(existing);
			} else {
				resetForm(matched);
			}
		} else {
			resetForm(null);
		}
	};

	const resetForm = (preset: LLMProvider | null) => {
		if (preset) {
			setNewProvider(preset);
			setNewApiKey(preset.apiKey);
			setNewBaseUrl(preset.baseUrl);
			setNewModel(preset.model);
			setNewMaxTokens(preset.maxTokens);
			setNewTemperature(preset.temperature);
		} else {
			setNewProvider(null);
			setNewApiKey("");
			setNewBaseUrl("");
			setNewModel("");
			setNewMaxTokens(256000);
			setNewTemperature(0.7);
		}
		setError("");
		setSaved(false);
		setDeleteConfirm(null);
	};

	const editProvider = (provider: LLMProvider) => {
		setNewProvider(provider);
		setNewApiKey(provider.apiKey);
		setNewBaseUrl(provider.baseUrl);
		setNewModel(provider.model);
		setNewMaxTokens(provider.maxTokens);
		setNewTemperature(provider.temperature);
		setDeleteConfirm(null);
	};

	const handleSave = async () => {
		setError("");
		setSaved(false);
		setSaving(true);

		const providerName = newProvider()?.provider || "";
		const settings: LLMProvider = {
			provider: providerName as LLMProviderEnum,
			apiKey: newApiKey().trim(),
			baseUrl: newBaseUrl().trim(),
			model: newModel().trim(),
			maxTokens: Number(newMaxTokens()),
			temperature: Number(newTemperature()),
			isDefault: newProvider()?.isDefault || false,
		};

		try {
			// Upsert this provider
			await invoke("save_llm_settings", { settings });

			// If setting as default, update all others
			if (settings.isDefault) {
				const others = providers().map((p) =>
					p.provider === settings.provider ? { ...p, isDefault: false } : p,
				);
				const updated = others.map((p) =>
					p.provider === settings.provider ? settings : p,
				);
				for (const p of others) {
					if (p.provider !== settings.provider) {
						await invoke("save_llm_settings", { settings: p });
					}
				}
				setProviders(updated);
				onSave(updated);
			} else {
				// Reload to get fresh state
				const fresh = await invoke<LLMProvider[]>("get_llm_settings");
				setProviders(fresh);
				onSave(fresh);
			}

			setSaved(true);
			setTimeout(() => setSaved(false), 2000);
		} catch (e) {
			logger.error("Failed to save settings:", e);
			setError(`Failed to save: ${e}`);
		} finally {
			setSaving(false);
		}
	};

	const handleDelete = async (providerName: string) => {
		setError("");
		setDeleteConfirm(providerName);
	};

	const confirmDelete = async (providerName: string) => {
		try {
			await invoke("delete_llm_provider", { providerName });
			const updated = providers().filter((p) => p.provider !== providerName);
			setProviders(updated);
			onSave(updated);
			// If we're editing the deleted provider, reset the form
			if (newProvider()?.provider === providerName) {
				resetForm(null);
			}
			setDeleteConfirm(null);
		} catch (e) {
			logger.error("Failed to delete provider:", e);
			setError(`Failed to delete: ${e}`);
			setDeleteConfirm(null);
		}
	};

	const handleCancel = () => {
		if (newProvider()) {
			resetForm(null);
		} else {
			onBack();
		}
	};

	return (
		<div class="settings-screen">
			<div class="settings-header">
				<h1>⚙️ Settings</h1>
				<button type="button" class="back-btn" onClick={handleCancel}>
					{newProvider() ? "← Cancel" : "← Back"}
				</button>
			</div>

			<Show when={error()}>
				<div class="error-banner">{error()}</div>
			</Show>

			<Show when={saved()}>
				<div class="success-banner">✅ Settings saved!</div>
			</Show>

			<div class="settings-content">
				{/* Provider Table */}
				<div class="settings-section">
					<h2>📋 Configured Providers</h2>
					<p class="section-desc">
						Manage all your LLM provider configurations. Click a provider to
						edit, or add a new one.
					</p>

					<Show
						when={providers().length > 0}
						fallback={
							<div class="empty-state">
								<p>No providers configured yet.</p>
								<p class="hint">Select a provider type below to get started.</p>
							</div>
						}
					>
						<div class="providers-table-wrapper">
							<table class="providers-table">
								<thead>
									<tr>
										<th>Provider</th>
										<th>Model</th>
										<th>Base URL</th>
										<th>Default</th>
										<th>Actions</th>
									</tr>
								</thead>
								<tbody>
									<For each={providers()}>
										{(p) => (
											<tr
												classList={{
													"selected-row":
														newProvider()?.provider === p.provider,
													"has-default": p.isDefault,
												}}
												onClick={() => editProvider(p)}
											>
												<td class="provider-name-cell">
													<span class="provider-badge">{p.provider}</span>
													{p.isDefault && (
														<span class="default-badge">Default</span>
													)}
												</td>
												<td class="model-cell">
													<Show
														when={p.model}
														fallback={<span class="no-value">—</span>}
													>
														{p.model}
													</Show>
												</td>
												<td class="url-cell">
													<Show
														when={p.baseUrl}
														fallback={<span class="no-value">—</span>}
													>
														{p.baseUrl}
													</Show>
												</td>
												<td class="default-cell">
													<Show
														when={p.isDefault}
														fallback={<span class="no-value">—</span>}
													>
														✓
													</Show>
												</td>
												<td class="actions-cell">
													<button
														type="button"
														class="delete-btn-sm"
														onClick={(e) => {
															e.stopPropagation();
															handleDelete(p.provider);
														}}
														title="Delete provider"
													>
														🗑️
													</button>
												</td>
											</tr>
										)}
									</For>
								</tbody>
							</table>

							<Show when={deleteConfirm()}>
								<div class="delete-confirm-overlay">
									<div class="delete-confirm-dialog">
										<p>
											Delete <strong>{deleteConfirm()}</strong>?
										</p>
										<div class="delete-confirm-actions">
											<button
												type="button"
												class="cancel-btn"
												onClick={() => setDeleteConfirm(null)}
											>
												Cancel
											</button>
											<button
												type="button"
												class="save-btn delete-confirm-btn"
												onClick={() => {
													if (deleteConfirm()) {
														confirmDelete(deleteConfirm());
													}
												}}
											>
												Delete
											</button>
										</div>
									</div>
								</div>
							</Show>
						</div>
					</Show>
				</div>

				{/* Edit/Add Form */}
				<div class="settings-section">
					<h2>{newProvider() ? "✏️ Edit Provider" : "➕ Add New Provider"}</h2>
					<p class="section-desc">
						{newProvider()
							? `Editing ${newProvider().provider}`
							: "Select a provider type to configure a new LLM backend."}
					</p>

					<div class="form-group">
						<label for="provider">Provider</label>
						<select
							id="provider"
							class="provider-select"
							value={
								newProvider()
									? newProvider().provider
									: (Object.values(providerOptions)[0]?.provider ?? "")
							}
							onChange={handleProviderSelect}
						>
							<For each={Object.values(providerOptions)}>
								{(p) => (
									<option value={p.provider}>
										{p.provider}
										{p.isDefault ? " (default)" : ""}
									</option>
								)}
							</For>
							<option value="">Custom / Other</option>
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
							value={newBaseUrl()}
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
							value={newModel()}
							onInput={(e) => setNewModel(e.currentTarget.value)}
						/>
						<span class="field-hint">Model ID for the API.</span>
					</div>

					<div class="form-group">
						<label for="api-key">API Key</label>
						<input
							id="api-key"
							type="password"
							placeholder="sk-..."
							value={newApiKey()}
							onInput={(e) => setNewApiKey(e.currentTarget.value)}
						/>
						<span class="field-hint">
							Your key is stored locally and never sent anywhere except the
							configured API.
						</span>
					</div>

					<div class="form-row">
						<div class="form-group">
							<label for="max-tokens">Max Tokens</label>
							<input
								id="max-tokens"
								type="number"
								min="1"
								max="256000"
								value={newMaxTokens()}
								onInput={(e) => setNewMaxTokens(Number(e.currentTarget.value))}
							/>
							<span class="field-hint">Max context window size.</span>
						</div>

						<div class="form-group">
							<label for="temperature">Temperature</label>
							<input
								id="temperature"
								type="number"
								min="0"
								max="2"
								step="0.1"
								value={newTemperature()}
								onInput={(e) =>
									setNewTemperature(Number(e.currentTarget.value))
								}
							/>
							<span class="field-hint">0 = deterministic, 1 = creative.</span>
						</div>
					</div>

					<div class="form-group checkbox-group">
						<input
							id="default-setting"
							type="checkbox"
							checked={newProvider()?.isDefault || false}
							onChange={(e) => {
								if (newProvider()) {
									const updated = {
										...newProvider(),
										isDefault: e.currentTarget.checked,
									};
									setNewProvider(updated);
								}
							}}
						/>
						<label for="default-setting">Set as default provider</label>
						<span class="field-hint">
							{hasDefault()
								? "This will unset the current default."
								: "This provider will be used by default for debates."}
						</span>
					</div>

					<div class="settings-actions">
						<button
							type="button"
							class="save-btn"
							onClick={handleSave}
							disabled={saving()}
						>
							{saving() ? "Saving..." : "💾 Save"}
						</button>
						<button type="button" class="cancel-btn" onClick={handleCancel}>
							{newProvider() ? "Cancel" : "← Back"}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
