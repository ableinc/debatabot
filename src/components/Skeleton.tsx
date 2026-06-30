/* ── Skeleton Loader ───────────────────────────────────────────── */
/* Shimmering placeholder used while async data is being fetched. */

interface SkeletonProps {
	class?: string;
}

export function Skeleton(props: SkeletonProps) {
	return (
		<div
			class={`rounded-md bg-surface-light animate-pulse ${props.class || ""}`}
			style={{
				background:
					"linear-gradient(90deg, var(--color-surface-light) 25%, var(--color-surface-hover) 50%, var(--color-surface-light) 75%)",
				"background-size": "200% 100%",
				animation: "shimmer 1.5s ease-in-out infinite",
			}}
		/>
	);
}

/* ── Skeleton for a personality card (SetupScreen) ────────────── */
export function PersonalitySkeleton() {
	return (
		<div class="px-2.5 py-2 rounded-md border border-border bg-surface-light">
			<div class="h-3 w-16 mb-1 rounded bg-surface-hover" />
			<div class="h-2 w-24 rounded bg-surface" />
		</div>
	);
}

/* ── Skeleton for a provider card (SettingsScreen sidebar) ───── */
export function ProviderSkeleton() {
	return (
		<div class="w-full px-3 py-3 rounded-md border border-border bg-surface-light flex items-center gap-2.5">
			<div class="w-8 h-8 rounded-full bg-surface shrink-0" />
			<div class="flex-1 space-y-2">
				<div class="h-3 w-24 rounded bg-surface-hover" />
				<div class="h-2 w-16 rounded bg-surface" />
			</div>
		</div>
	);
}
