import { createMemo, createSignal, For, Show } from "solid-js";
import logger from "../lib/logger";
import type { LLMProvider, LLMProviderEnum } from "../types";

interface SettingsScreenProps {
	userProviders: () => LLMProvider[];
	acceptedProviders: () => Record<LLMProviderEnum, LLMProvider>;
	onSave: (settings: LLMProvider[]) => Promise<Error | null>;
	onDelete: (providerName: LLMProviderEnum) => Promise<Error | null>;
	onBack: () => void;
}

export default function SettingsScreen({
	userProviders,
	acceptedProviders,
	onSave,
	onDelete,
	onBack,
}: SettingsScreenProps) {
	// Placeholder providers is a reactive snapshot derived from the signal
	const placeholderProviders = createMemo(() =>
		Object.values(acceptedProviders()),
	);
	const [newProvider, setNewProvider] = createSignal<LLMProvider | null>(null);
	const [saving, setSaving] = createSignal<boolean>(false);
	const [saved, setSaved] = createSignal<boolean>(false);
	const [error, setError] = createSignal<string>("");
	const [deleteConfirm, setDeleteConfirm] =
		createSignal<LLMProviderEnum | null>(null);

	const hasDefault = () =>
		userProviders().some((p: LLMProvider) => p.isDefault);

	const handleProviderSelect = (e: Event) => {
		const selectedName = (e.currentTarget as HTMLSelectElement)
			.value as LLMProviderEnum;
		const matched = acceptedProviders()[selectedName];
		if (matched) {
			editProvider(matched);
		} else {
			resetForm(null);
		}
	};

	const resetForm = (preset: LLMProvider | null) => {
		if (preset) {
			setNewProvider(preset);
		} else {
			setNewProvider(null);
		}
		setError("");
		setSaved(false);
		setDeleteConfirm(null);
	};

	const editProvider = (provider: LLMProvider) => {
		setNewProvider(provider);
		setDeleteConfirm(null);
	};

	const handleSave = async () => {
		if (saving()) return;
		if (!newProvider()) {
			setError("Please select a provider.");
			return;
		}
		setError("");
		setSaved(false);
		setSaving(true);

		try {
			const updatedProviders = userProviders()
				.filter((p) => p.provider === newProvider()?.provider)
				.map((p) => {
					return { ...p, isDefault: false };
				});
			updatedProviders.push(newProvider()!);
			if (updatedProviders.length === 1) {
				updatedProviders[0].isDefault = true;
			}
			const error = await onSave(updatedProviders);
			if (error) {
				setError(`Failed to save: ${error.message}`);
			} else {
				setSaved(true);
			}
		} catch (e) {
			logger.error("Failed to save settings:", e);
			setError(`Failed to save: ${e}`);
		} finally {
			setSaving(false);
		}
	};

	const handleDelete = async (providerName: LLMProviderEnum) => {
		setError("");
		setDeleteConfirm(providerName);
	};

	const confirmDelete = async (providerName: LLMProviderEnum | null) => {
		if (!providerName) return;
		try {
			const error = await onDelete(providerName);
			if (error) {
				setError(`Failed to delete: ${error.message}`);
				return;
			}
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

	const onNewProviderFieldChange = (
		field: keyof LLMProvider,
		value: string | number | boolean,
	) => {
		if (!newProvider()) return;
		const updated: LLMProvider = {
			...newProvider()!,
			[field]: value,
		};
		setNewProvider(updated);
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
						when={userProviders().length > 0}
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
									<For each={userProviders()}>
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
							? `Editing ${newProvider()?.provider}`
							: "Select a provider type to configure a new LLM backend."}
					</p>

					<div class="form-group">
						<label for="provider">Provider</label>
						<select
							id="provider"
							class="provider-select"
							value={
								newProvider()
									? newProvider()?.provider
									: placeholderProviders()[0]?.provider
							}
							onChange={handleProviderSelect}
						>
							<For each={placeholderProviders()}>
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
							value={
								newProvider()?.baseUrl || placeholderProviders()[0]?.baseUrl
							}
							onInput={(e) =>
								onNewProviderFieldChange("baseUrl", e.currentTarget.value)
							}
						/>
						<span class="field-hint">OpenAI-compatible API endpoint.</span>
					</div>

					<div class="form-group">
						<label for="model">Model</label>
						<input
							id="model"
							type="text"
							placeholder="gpt-4o-mini"
							value={newProvider()?.model || placeholderProviders()[0]?.model}
							onInput={(e) =>
								onNewProviderFieldChange("model", e.currentTarget.value)
							}
						/>
						<span class="field-hint">Model ID for the API.</span>
					</div>

					<div class="form-group">
						<label for="api-key">API Key</label>
						<input
							id="api-key"
							type="password"
							placeholder="sk-..."
							value={newProvider()?.apiKey || ""}
							onInput={(e) =>
								onNewProviderFieldChange("apiKey", e.currentTarget.value)
							}
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
								max="32768"
								value={
									newProvider()?.maxTokens ||
									placeholderProviders()[0]?.maxTokens
								}
								onInput={(e) =>
									onNewProviderFieldChange(
										"maxTokens",
										Number(e.currentTarget.value),
									)
								}
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
								value={
									newProvider()?.temperature ||
									placeholderProviders()[0]?.temperature
								}
								onInput={(e) =>
									onNewProviderFieldChange(
										"temperature",
										Number(e.currentTarget.value),
									)
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
									const updated: LLMProvider = {
										...newProvider()!,
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
