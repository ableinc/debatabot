import {
	AlertTriangle,
	ArrowLeft,
	Check,
	Edit,
	Eye,
	EyeOff,
	Globe,
	Hash,
	Key,
	Server,
	Settings,
	SlidersHorizontal,
	Sparkles,
	Trash2,
	X,
} from "lucide-solid";
import { createEffect, createMemo, createSignal, For, Show } from "solid-js";
import { ProviderSkeleton } from "../components/Skeleton";
import logger from "../lib/logger";
import type { LLMProvider, LLMProviderEnum } from "../types";

interface SettingsScreenProps {
	userProviders: () => LLMProvider[];
	acceptedProviders: () => Record<LLMProviderEnum, LLMProvider>;
	onSave: (settings: LLMProvider[]) => Promise<Error | null>;
	onDelete: (providerName: LLMProviderEnum) => Promise<Error | null>;
	onBack: () => void;
}

/* ── Component ─────────────────────────────────────────────────── */
export default function SettingsScreen({
	userProviders,
	acceptedProviders,
	onSave,
	onDelete,
	onBack,
}: SettingsScreenProps) {
	const placeholderProviders = createMemo(() =>
		Object.values(acceptedProviders()),
	);
	const [newProvider, setNewProvider] = createSignal<LLMProvider | null>(null);
	const [saving, setSaving] = createSignal<boolean>(false);
	const [saved, setSaved] = createSignal<boolean>(false);
	const [error, setError] = createSignal<string>("");
	const [deleteConfirm, setDeleteConfirm] =
		createSignal<LLMProviderEnum | null>(null);
	const [showApiKey, setShowApiKey] = createSignal<boolean>(false);
	const [providersLoaded, setProvidersLoaded] = createSignal<boolean>(false);

	// Track when providers have been loaded from the backend
	createEffect(() => {
		const providers = userProviders();
		if (providers.length > 0 || providersLoaded()) {
			setProvidersLoaded(true);
		}
	});

	const hasDefault = () =>
		userProviders().some((p: LLMProvider) => p.isDefault);

	const isSelected = (p: LLMProvider) => newProvider()?.provider === p.provider;

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
		setNewProvider(preset);
		setError("");
		setSaved(false);
		setDeleteConfirm(null);
		setShowApiKey(false);
	};

	const editProvider = (provider: LLMProvider) => {
		setNewProvider({ ...provider });
		setDeleteConfirm(null);
		setShowApiKey(false);
	};

	const handleSave = async () => {
		if (saving()) return;
		const currentProvider = newProvider();
		if (!currentProvider) {
			setError("Please select a provider.");
			return;
		}
		setError("");
		setSaved(false);
		setSaving(true);

		try {
			const updatedProviders = userProviders()
				.filter((p) => p.provider === currentProvider.provider)
				.map((p) => {
					return { ...p, isDefault: false };
				});
			updatedProviders.push(currentProvider);
			if (updatedProviders.length === 1) {
				updatedProviders[0].isDefault = true;
			}
			const err = await onSave(updatedProviders);
			if (err) {
				setError(`Failed to save: ${err.message}`);
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
			const err = await onDelete(providerName);
			if (err) {
				setError(`Failed to delete: ${err.message}`);
				return;
			}
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

	const onFieldChange = (
		field: keyof LLMProvider,
		value: string | number | boolean,
	) => {
		const currentProvider = newProvider();
		if (!currentProvider) return;
		setNewProvider({ ...currentProvider, [field]: value });
	};

	const temperatureDisplay = () => {
		const tp =
			newProvider()?.temperature ??
			placeholderProviders()[0]?.temperature ??
			0.7;
		return tp.toFixed(1);
	};

	const maxTokensDisplay = () => {
		const mt =
			newProvider()?.maxTokens ?? placeholderProviders()[0]?.maxTokens ?? 32768;
		return mt;
	};

	/* ── Render ────────────────────────────────────────────────── */
	return (
		<div class="flex flex-col h-screen overflow-hidden">
			{/* ── 5.1 Header Bar ─────────────────────────────────── */}
			<div class="flex items-center justify-between px-6 py-4 bg-surface border-b border-border shrink-0">
				<div class="flex items-center gap-3">
					<div class="w-9 h-9 rounded-md bg-primary-muted flex items-center justify-center">
						<Settings size={18} class="text-primary" />
					</div>
					<h1 class="text-xl font-bold font-display text-text">
						LLM Providers
					</h1>
				</div>
				<button
					type="button"
					class="flex items-center gap-2 px-3 py-2 text-sm font-medium bg-surface-light border border-border rounded-md text-text-muted cursor-pointer transition-all hover:bg-surface-hover hover:text-text hover:border-primary/50"
					onClick={handleCancel}
				>
					<ArrowLeft size={16} />
					{newProvider() ? "Cancel" : "Back"}
				</button>
			</div>

			{/* ── Banners ──────────────────────────────────────── */}
			<Show when={error()}>
				<div class="mx-6 mt-4 bg-error-muted border border-error text-error px-4 py-2.5 rounded-md text-sm flex items-center gap-2 animate-fadeIn shrink-0">
					<AlertTriangle size={16} class="shrink-0" />
					{error()}
				</div>
			</Show>
			<Show when={saved()}>
				<div class="mx-6 mt-4 bg-success-muted border border-success text-success px-4 py-2.5 rounded-md text-sm flex items-center gap-2 animate-fadeIn shrink-0">
					<Check size={16} class="shrink-0" />
					Settings saved successfully!
				</div>
			</Show>

			{/* ── 5.1 Two-Column Layout ────────────────────────── */}
			<div class="flex flex-1 overflow-hidden">
				{/* ── 5.2 Provider List Sidebar ─────────────────── */}
				<div class="w-72 xl:w-80 bg-surface border-r border-border flex flex-col shrink-0 overflow-hidden">
					<div class="flex items-center justify-between px-4 py-3 border-b border-border">
						<span class="text-xs font-semibold text-text-muted uppercase tracking-wider">
							Configured
						</span>
						<span class="text-xs text-text-faint bg-surface-light px-2 py-0.5 rounded-full">
							{userProviders().length}
						</span>
					</div>

					<div class="flex-1 overflow-y-auto p-3 space-y-2">
						<Show
							when={providersLoaded()}
							fallback={
								<div class="space-y-2">
									<For each={Array.from({ length: 4 })}>
										{() => <ProviderSkeleton />}
									</For>
								</div>
							}
						>
							<Show
								when={userProviders().length > 0}
								fallback={
									<div class="flex flex-col items-center justify-center py-10 text-center">
										<Server size={28} class="text-text-faint mb-3" />
										<p class="text-sm text-text-muted">
											No providers configured
										</p>
										<p class="text-xs text-text-faint mt-1">
											Select a type below to add one
										</p>
									</div>
								}
							>
								<For each={userProviders()}>
									{(p) => (
										<button
											type="button"
											class={`w-full text-left px-3 py-3 rounded-md border transition-all cursor-pointer group ${
												isSelected(p)
													? "bg-primary-muted border-primary/50 shadow-glow-a"
													: "bg-surface-light border-border hover:border-primary/30 hover:bg-surface-hover"
											}`}
											onClick={() => editProvider(p)}
										>
											<div class="flex items-center gap-2.5">
												{/* Avatar circle */}
												<div
													class={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
														isSelected(p)
															? "bg-primary/20 text-primary"
															: "bg-surface border border-border text-text-muted"
													}`}
												>
													{p.provider.charAt(0)}
												</div>
												<div class="min-w-0 flex-1">
													<div class="flex items-center gap-1.5">
														<span
															class={`text-sm font-semibold truncate ${
																isSelected(p) ? "text-primary" : "text-text"
															}`}
														>
															{p.provider}
														</span>
														{p.isDefault && (
															<span class="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-success-muted border border-success/30 rounded-full text-[10px] font-semibold text-success shrink-0">
																<Check size={9} />
																Default
															</span>
														)}
													</div>
													<div class="text-xs text-text-faint font-mono truncate">
														{p.model || "—"}
													</div>
												</div>
												{/* Delete button */}
												<button
													type="button"
													class="opacity-0 group-hover:opacity-100 w-7 h-7 flex items-center justify-center rounded-md shrink-0 transition-all hover:bg-error-muted text-text-faint hover:text-error"
													onClick={(e) => {
														e.stopPropagation();
														handleDelete(p.provider);
													}}
													title="Delete provider"
												>
													<Trash2 size={14} />
												</button>
											</div>
										</button>
									)}
								</For>
							</Show>
						</Show>
					</div>

					{/* Add new from preset */}
					<div class="px-3 py-3 border-t border-border">
						<div class="flex items-center gap-2 mb-2">
							<span class="text-xs font-semibold text-text-muted uppercase tracking-wider">
								Add New
							</span>
						</div>
						<select
							class="w-full px-3 py-2 bg-surface-light border border-border rounded-md text-text text-sm cursor-pointer appearance-none focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
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
						</select>
					</div>
				</div>

				{/* ── 5.3 Edit Form Panel ──────────────────────── */}
				<div class="flex-1 overflow-y-auto">
					<div class="max-w-2xl mx-auto p-6 xl:p-10">
						<Show
							when={newProvider()}
							fallback={
								<div class="flex flex-col items-center justify-center h-full py-20 text-center">
									<div class="w-16 h-16 rounded-full bg-surface-light border border-border flex items-center justify-center mb-4">
										<Sparkles size={28} class="text-text-faint" />
									</div>
									<p class="text-text-muted text-lg font-medium">
										Select a provider to configure
									</p>
									<p class="text-text-faint text-sm mt-1">
										Choose from the sidebar or add a new one
									</p>
								</div>
							}
						>
							{/* Form header */}
							<div class="flex items-center gap-3 mb-6">
								<div class="w-10 h-10 rounded-full bg-primary-muted border border-primary/30 flex items-center justify-center text-primary font-bold text-sm">
									{newProvider()?.provider.charAt(0)}
								</div>
								<div>
									<h2 class="text-xl font-bold font-display text-text">
										<span class="text-primary">{newProvider()?.provider}</span>
									</h2>
									<p class="text-sm text-text-muted">
										Configure API settings for this provider
									</p>
								</div>
							</div>

							{/* ── Connection Group ───────────────────────────── */}
							<div class="bg-surface border border-border rounded-md p-5 mb-4">
								<div class="flex items-center gap-2 mb-4">
									<Globe size={16} class="text-text-muted" />
									<h3 class="text-sm font-semibold text-text-muted uppercase tracking-wider">
										Connection
									</h3>
								</div>

								<div class="space-y-4">
									{/* Base URL */}
									<div class="flex flex-col gap-1.5">
										<label
											for="sb-base-url"
											class="text-xs font-medium text-text-muted"
										>
											Base URL
										</label>
										<div class="flex items-center gap-2">
											<Globe size={16} class="text-text-faint shrink-0" />
											<input
												id="sb-base-url"
												type="text"
												placeholder="https://api.openai.com/v1/chat/completions"
												value={newProvider()?.baseUrl}
												onInput={(e) =>
													onFieldChange("baseUrl", e.currentTarget.value)
												}
												class="flex-1 px-3 py-2.5 bg-surface-light border border-border rounded-md text-text text-sm placeholder:text-text-faint font-mono focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
											/>
										</div>
										<span class="text-xs text-text-faint ml-auto">
											OpenAI-compatible API endpoint
										</span>
									</div>

									{/* Model */}
									<div class="flex flex-col gap-1.5">
										<label
											for="sb-model"
											class="text-xs font-medium text-text-muted"
										>
											Model
										</label>
										<div class="flex items-center gap-2">
											<Hash size={16} class="text-text-faint shrink-0" />
											<input
												id="sb-model"
												type="text"
												placeholder="gpt-4o-mini"
												value={newProvider()?.model}
												onInput={(e) =>
													onFieldChange("model", e.currentTarget.value)
												}
												class="flex-1 px-3 py-2.5 bg-surface-light border border-border rounded-md text-text text-sm placeholder:text-text-faint font-mono focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
											/>
										</div>
										<span class="text-xs text-text-faint ml-auto">
											Model identifier for the API
										</span>
									</div>

									{/* API Key */}
									<div class="flex flex-col gap-1.5">
										<label
											for="sb-api-key"
											class="text-xs font-medium text-text-muted"
										>
											API Key
										</label>
										<div class="flex items-center gap-2">
											<Key size={16} class="text-text-faint shrink-0" />
											<input
												id="sb-api-key"
												type={showApiKey() ? "text" : "password"}
												placeholder="sk-..."
												value={newProvider()?.apiKey}
												onInput={(e) =>
													onFieldChange("apiKey", e.currentTarget.value)
												}
												class="flex-1 px-3 py-2.5 bg-surface-light border border-border rounded-md text-text text-sm placeholder:text-text-faint font-mono focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
											/>
											<button
												type="button"
												class="w-10 flex items-center justify-center bg-surface-light border border-border rounded-md cursor-pointer transition-all hover:bg-surface-hover text-text-faint hover:text-text shrink-0"
												onClick={() => setShowApiKey(!showApiKey())}
												title={showApiKey() ? "Hide key" : "Show key"}
											>
												{showApiKey() ? (
													<EyeOff size={16} />
												) : (
													<Eye size={16} />
												)}
											</button>
										</div>
										<span class="text-xs text-text-faint ml-auto">
											Stored locally — never sent anywhere else
										</span>
									</div>
								</div>
							</div>

							{/* ── Parameters Group ───────────────────────────── */}
							<div class="bg-surface border border-border rounded-md p-5 mb-4">
								<div class="flex items-center gap-2 mb-4">
									<SlidersHorizontal size={16} class="text-text-muted" />
									<h3 class="text-sm font-semibold text-text-muted uppercase tracking-wider">
										Parameters
									</h3>
								</div>

								<div class="space-y-5">
									{/* Max Tokens */}
									<div class="flex flex-col gap-2">
										<div class="flex items-center justify-between">
											<label
												for="sb-max-tokens"
												class="text-xs font-medium text-text-muted"
											>
												Max Tokens
											</label>
											<span class="text-xs font-mono text-text bg-surface-light px-2 py-0.5 rounded">
												{maxTokensDisplay()}
											</span>
										</div>
										<input
											id="sb-max-tokens"
											type="range"
											min="1"
											max="128000"
											step="1024"
											value={maxTokensDisplay()}
											onInput={(e) =>
												onFieldChange(
													"maxTokens",
													Number(e.currentTarget.value),
												)
											}
											class="w-full h-2 bg-surface-light rounded-full appearance-none cursor-pointer accent-primary"
										/>
										<div class="flex justify-between text-[10px] text-text-faint">
											<span>1</span>
											<span>128K</span>
										</div>
									</div>

									{/* Temperature */}
									<div class="flex flex-col gap-2">
										<div class="flex items-center justify-between">
											<label
												for="sb-temperature"
												class="text-xs font-medium text-text-muted"
											>
												Temperature
											</label>
											<span class="text-xs font-mono text-text bg-surface-light px-2 py-0.5 rounded">
												{temperatureDisplay()}
											</span>
										</div>
										<input
											id="sb-temperature"
											type="range"
											min="0"
											max="2"
											step="0.1"
											value={temperatureDisplay()}
											onInput={(e) =>
												onFieldChange(
													"temperature",
													Number(e.currentTarget.value),
												)
											}
											class="w-full h-2 bg-surface-light rounded-full appearance-none cursor-pointer accent-primary"
										/>
										<div class="flex justify-between text-[10px] text-text-faint">
											<span>Deterministic (0)</span>
											<span>Creative (2)</span>
										</div>
									</div>
								</div>
							</div>

							{/* ── Default Toggle ─────────────────────────────── */}
							<div class="bg-surface border border-border rounded-md p-4 mb-6">
								<label class="flex items-center gap-3 cursor-pointer group">
									<input
										type="checkbox"
										checked={newProvider()?.isDefault || false}
										onChange={(e) =>
											onFieldChange("isDefault", e.currentTarget.checked)
										}
										class="sr-only peer"
									/>
									<div class="relative w-10 h-6 shrink-0">
										<div class="absolute inset-0 bg-surface-light border border-border rounded-full peer-checked:bg-primary peer-checked:border-primary transition-all" />
										<div class="absolute top-0.5 left-0.5 w-5 h-5 bg-text rounded-full transition-all peer-checked:translate-x-4" />
									</div>
									<div class="flex-1 min-w-0">
										<span class="text-sm font-medium text-text group-hover:text-primary transition-colors">
											Set as default provider
										</span>
										<span class="block text-xs text-text-faint mt-0.5">
											{hasDefault()
												? "This will replace the current default"
												: "This provider will be used by default for debates"}
										</span>
									</div>
								</label>
							</div>

							{/* ── 5.4 Action Buttons ─────────────────────────── */}
							<div class="flex items-center gap-3">
								<button
									type="button"
									class={`px-6 py-2.5 rounded-md text-sm font-semibold cursor-pointer transition-all ${
										saving()
											? "bg-primary/50 text-white/70 cursor-not-allowed"
											: "bg-primary text-white hover:bg-primary-hover hover:shadow-glow-a active:scale-95"
									}`}
									onClick={handleSave}
									disabled={saving()}
								>
									{saving() ? (
										<span class="flex items-center gap-2">
											<Edit size={16} class="animate-spin" />
											Saving...
										</span>
									) : (
										<span class="flex items-center gap-2">
											<Check size={16} />
											Save Changes
										</span>
									)}
								</button>
								<button
									type="button"
									class="px-6 py-2.5 rounded-md text-sm font-medium bg-surface-light border border-border text-text-muted cursor-pointer transition-all hover:bg-surface-hover hover:text-text hover:border-primary/30"
									onClick={handleCancel}
								>
									Cancel
								</button>
							</div>
						</Show>
					</div>
				</div>
			</div>

			{/* ── Delete Confirmation Dialog ─────────────────────── */}
			<Show when={deleteConfirm()}>
				<div class="fixed inset-0 z-50 flex items-center justify-center animate-fadeIn">
					<button
						type="button"
						aria-label="Close delete confirmation"
						class="absolute inset-0 bg-black/60 backdrop-blur-sm"
						onClick={() => setDeleteConfirm(null)}
					/>
					<div class="relative z-10 bg-surface border border-border rounded-md shadow-card max-w-sm w-[90%] p-6 animate-slideIn">
						<div class="flex items-center gap-3 mb-4">
							<div class="w-10 h-10 rounded-full bg-error-muted flex items-center justify-center shrink-0">
								<Trash2 size={20} class="text-error" />
							</div>
							<div>
								<h3 class="text-lg font-semibold text-text">Delete Provider</h3>
								<p class="text-sm text-text-muted">
									This action cannot be undone
								</p>
							</div>
						</div>
						<p class="text-sm text-text-muted mb-5">
							Are you sure you want to delete{" "}
							<strong class="text-text font-semibold">{deleteConfirm()}</strong>
							?
						</p>
						<div class="flex gap-3 justify-end">
							<button
								type="button"
								class="px-4 py-2 rounded-md text-sm font-medium bg-surface-light border border-border text-text-muted cursor-pointer transition-all hover:bg-surface-hover hover:text-text"
								onClick={() => setDeleteConfirm(null)}
							>
								<X size={16} class="inline -mt-0.5 mr-1" />
								Cancel
							</button>
							<button
								type="button"
								class="px-4 py-2 rounded-md text-sm font-semibold bg-error text-white cursor-pointer transition-all hover:bg-error/90 hover:shadow-[0_0_20px_rgba(239,68,68,0.3)] active:scale-95"
								onClick={() => {
									if (deleteConfirm()) confirmDelete(deleteConfirm());
								}}
							>
								<Trash2 size={16} class="inline -mt-0.5 mr-1" />
								Delete
							</button>
						</div>
					</div>
				</div>
			</Show>
		</div>
	);
}
