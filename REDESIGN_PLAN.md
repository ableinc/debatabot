Redesign Plan

 ### Phase 1 — Foundation ✅ DONE

 1.1. Icon system — Replace all emoji with Lucide icons via `lucide-solid`. Consistent
 stroke-based icon set.
 - `pnpm add lucide-solid` (note: correct package is `lucide-solid`, not `@lucide/solid`)
 - 🔄 Emoji → Lucide replacement deferred to Phase 2 (done screen-by-screen)

 1.2. CSS architecture — Switch from raw CSS to Tailwind CSS v4 (Vite plugin, no config
 file needed) for utility-first styling.
 - `pnpm add -D tailwindcss @tailwindcss/vite`
 - Added `tailwindcss()` to Vite plugins
 - Rewrote `App.css` with `@import "tailwindcss"` + `@theme` block
 - Legacy class names preserved for migration (will be replaced screen-by-screen)

 1.3. Design tokens — Defined in `@theme` block in `App.css`:
 - Background: Deep charcoal (#0f1117) with subtle surface layers (#181a20, #1e2130)
 - Bot A: Electric indigo (#6366f1) with glow/muted variants
 - Bot B: Rose/coral (#f43f5e) with glow/muted variants
 - Accents: Amber (warning), Emerald (success), Red (error)
 - Typography: Inter (body) + Space Grotesk (display/headings) via Google Fonts
 - Radius: rounded-sm (8px), rounded-md (12px), rounded-lg (16px), rounded-full
 - Custom shadows: card, glow-a, glow-b
 - Custom animations: slideIn, fadeIn, pulseSlow

 ### Phase 2 — Setup Screen Redesign ✅ DONE

 2.1. Hero section — Logo + app name at top with a subtle gradient background or animated
 mesh. Tagline underneath.

 2.2. Topic input — Full-width, large input with a prominent label. Add a "suggestions"
 row (chips of example topics).

 2.3. Bot cards — Redesign as two side-by-side panels with:
 - Bot A panel has indigo left border glow, Bot B has rose left border glow
 - Each card has a large avatar circle (initials) at top
 - Name input + randomize button (dice icon, not emoji)
 - Personality dropdown replaced with visual cards (small cards showing personality name
   + one-line description)
 - Viewpoint toggle as a segmented control (pill-shaped, animated fill)

 2.4. Start button — Large, centered, gradient background (indigo→rose), with hover scale
 + glow. Disabled state is subtle grey, not just opacity.

 ### Phase 3 — Debate Screen Redesign ✅ DONE

 3.1. Header — Clean top bar with:
 - Topic on left (truncated with ellipsis)
 - Turn progress bar in the center (visual bar showing turn X of Y)
 - Controls on right (Stop, Declare Winner) in a compact row

 3.2. Message bubbles — Redesigned with:
 - Bot A: indigo-tinted background with subtle gradient, rounded corners (bot-side flat)
 - Bot B: rose-tinted background with subtle gradient
 - Avatar circle with initials on each bubble
 - Speaker name + personality badge in header
 - Smooth slide-in + fade animation
 - Typing/streaming effect for messages as they arrive

 3.3. Thinking indicator — Replace dots with a pulsing avatar + "thinking..." text.

 3.4. Controls — Stop button as a red-outlined ghost button. Declare Winner as a dropdown
 or two small buttons with avatar icons.

 ### Phase 4 — Results Screen Redesign ✅ DONE

 4.1. Winner celebration — Full-width gradient banner (indigo→rose diagonal) with large
 trophy icon, winner name, and confetti-like animation (CSS particles).

 4.2. Draw state — Muted gradient with handshake icon, "No Consensus" text.

 4.3. Summary cards — Three stat cards in a row: Topic, Total Turns, Winner. Each in a
 glass-morphism card.

 4.4. Transcript — Collapsible/expandable. Accordion-style entries with winner's messages
 highlighted. Bot A/B color coding preserved.

 4.5. New Debate button — Same gradient button as Setup screen, centered at bottom.

 ### Phase 5 — Settings Screen Redesign ✅ DONE

 5.1. Layout — Two-column layout: provider list on left (narrow sidebar), edit form on
 right (wider panel).
 - 280px sidebar with scrollable provider cards + add-new dropdown at bottom
 - Wider form panel with max-width constraint, centered content

 5.2. Provider list — Replace table with a list of cards/pills. Each shows provider name
 badge, model, and default indicator. Selected provider highlighted.
 - Card-style list items with avatar circle, provider name, model (mono font)
 - Default badge (green pill with check icon)
 - Hover-reveal delete button (Trash2 icon)
 - Selected state: indigo background glow + border highlight
 - Empty state with icon + hint text

 5.3. Form — Clean form with proper field grouping. API key as password field with
 show/hide toggle. Temperature as a slider, not a number input.
 - Two field groups: "Connection" (URL, Model, API Key) and "Parameters" (Max Tokens, Temperature)
 - Each field has a Lucide icon prefix (Globe, Hash, Key)
 - API key: password input with Eye/EyeOff toggle button
 - Temperature: range slider (0–2) with numeric display + labels
 - Max Tokens: range slider (1–128K) with numeric display
 - Toggle switch for "Set as default" with smooth animation
 - Empty state when no provider selected

 5.4. Save/Cancel — Fixed bottom bar with actions, or inline at bottom of form.
 - Inline action row at bottom of form
 - Save: indigo button with Check icon, loading state with spinning Edit icon
 - Cancel: ghost button
 - Delete confirmation: centered modal with backdrop blur, icon header, danger-styled delete button

 ### Phase 6 — Polish ✅ DONE

 6.1. Screen transitions — Crossfade/slide transitions between screens using Solid.js
 <Transition> or CSS animations. ✅ DONE

 6.2. Toast notifications — Add a toast system (or use @kobalte/core's dialog layer) for
 success/error feedback. ✅ DONE

 6.3. Loading states — Skeleton loaders while personalities/providers are fetching. ✅ DONE

 6.4. Scrollbar — Keep the custom scrollbar but refine colors. ✅ DONE

 6.5. Keyboard shortcuts — Enter to start debate, Escape to go back, Space to stop
 debate. ✅ DONE

 ────────────────────────────────────────────────────────────────────────────────

 Dependencies to Add

 ```bash
   pnpm add -D tailwindcss @tailwindcss/vite
   pnpm add @lucide/solid
 ```

 Optional (if we want more polished primitives):

 ```bash
   pnpm add @kobalte/core        # accessible dialogs, dropdowns, tabs
 ```

 ────────────────────────────────────────────────────────────────────────────────

 Implementation Order

 ┌───────┬────────────────────────────────────────────────────────────┬─────────┐
 │ Step  │ What                                                       │ Effort  │
 ├───────┼────────────────────────────────────────────────────────────┼─────────┤
 │ 1     │ Add Tailwind CSS v4 + Lucide icons ✅ DONE                 │ 30 min  │
 ├───────┼────────────────────────────────────────────────────────────┼─────────┤
 │ 2     │ Redesign Setup Screen (hero, bot cards, start button) ✅ DONE     │ 2 hrs   │
 ├───────┼────────────────────────────────────────────────────────────┼─────────┤
 │ 3     │ Redesign Debate Screen (header, progress bar, bubbles) ✅ DONE    │ 2 hrs   │
 ├───────┼────────────────────────────────────────────────────────────┼─────────┤
 │ 4     │ Redesign Results Screen (celebration, stats, transcript) ✅ DONE  │ 1.5 hrs │
 ├───────┼────────────────────────────────────────────────────────────┼─────────┤
 │ 5     │ Redesign Settings Screen (two-column, provider list, form) ✅ DONE │ 2 hrs   │
 ├───────┼────────────────────────────────────────────────────────────┼─────────┤
 │ 6     │ Screen transitions + toasts + polish ✅ DONE               │ 1.5 hrs │
 ├───────┼────────────────────────────────────────────────────────────┼─────────┤
 │ Total │                                                            │ ~10 hrs │
 └───────┴────────────────────────────────────────────────────────────┴─────────┘

 ────────────────────────────────────────────────────────────────────────────────