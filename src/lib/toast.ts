import type { Accessor, Setter } from "solid-js";
import { createSignal } from "solid-js";

/* ── Types ─────────────────────────────────────────────────────── */
export type ToastType = "success" | "error" | "info" | "warning";

export interface Toast {
	id: string;
	message: string;
	type: ToastType;
}

/* ── Singleton toast store ─────────────────────────────────────── */
let _toasts: Accessor<Toast[]> | undefined;
let _setToasts: Setter<Toast[]> | undefined;
let _initialized = false;

function getStore() {
	if (!_initialized) {
		[_toasts, _setToasts] = createSignal<Toast[]>([]);
		_initialized = true;
	}
	if (!_toasts || !_setToasts) {
		throw new Error("Toast store not initialized");
	}
	return { toasts: _toasts, setToasts: _setToasts };
}

/** Push a toast that auto-dismisses after `duration` ms. */
export function showToast(
	message: string,
	type: ToastType = "info",
	duration = 4000,
) {
	const { setToasts } = getStore();
	const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
	const toast: Toast = { id, message, type };

	setToasts((prev) => [...prev, toast]);

	setTimeout(() => {
		setToasts((prev) => prev.filter((t) => t.id !== id));
	}, duration);
}

/** Remove a specific toast by id. */
export function dismissToast(id: string) {
	const { setToasts } = getStore();
	setToasts((prev) => prev.filter((t) => t.id !== id));
}

/** Get the reactive toasts signal (for the container component). */
export function useToasts() {
	return getStore().toasts;
}
