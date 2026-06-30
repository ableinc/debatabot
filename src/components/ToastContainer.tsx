import { AlertCircle, AlertTriangle, CheckCircle, Info } from "lucide-solid";
import { For } from "solid-js";
import type { Toast, ToastType } from "../lib/toast";
import { dismissToast, useToasts } from "../lib/toast";

/* ── Icon + colour map per toast type ──────────────────────────── */
const TOAST_STYLES: Record<
	ToastType,
	{ icon: typeof CheckCircle; bg: string; border: string; text: string }
> = {
	success: {
		icon: CheckCircle,
		bg: "bg-success-muted",
		border: "border-success/40",
		text: "text-success",
	},
	error: {
		icon: AlertCircle,
		bg: "bg-error-muted",
		border: "border-error/40",
		text: "text-error",
	},
	warning: {
		icon: AlertTriangle,
		bg: "bg-warning-muted",
		border: "border-warning/40",
		text: "text-warning",
	},
	info: {
		icon: Info,
		bg: "bg-primary-muted",
		border: "border-primary/40",
		text: "text-primary",
	},
};

/* ── Single toast item ─────────────────────────────────────────── */
function ToastItem(props: Toast) {
	const style = TOAST_STYLES[props.type];
	const Icon = style.icon;

	return (
		<div class="animate-slideIn flex items-start gap-3 bg-surface border rounded-md px-4 py-3 shadow-card max-w-sm w-full">
			<Icon size={18} class={`${style.text} shrink-0 mt-0.5`} />
			<p class="text-sm text-text flex-1">{props.message}</p>
			<button
				type="button"
				class="text-text-faint hover:text-text shrink-0 cursor-pointer transition-colors"
				onClick={() => dismissToast(props.id)}
			>
				✕
			</button>
		</div>
	);
}

/* ── Container (fixed top-right stack) ─────────────────────────── */
export default function ToastContainer() {
	const toasts = useToasts();

	return (
		<div class="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-[calc(100vw-2rem)]">
			<For each={toasts()}>{(toast) => <ToastItem {...toast} />}</For>
		</div>
	);
}
