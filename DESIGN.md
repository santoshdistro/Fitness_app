---
name: Fitness Tracker
description: A personal, subscription-free nutrition and training tracker built for the phone home screen.
colors:
  ink: "#14142b"
  slate: "#63697d"
  periwinkle: "#6c63ff"
  periwinkle-deep: "#4b3fe0"
  mist: "#f7f7fb"
  surface: "#ffffff"
  hairline: "#eef0f6"
  ink-night: "#101018"
  surface-night: "#1a1a24"
  hairline-night: "#262633"
  paper-night: "#f2f2f7"
  slate-night: "#8b8fa3"
  periwinkle-night: "#7d75ff"
  vital-green: "#22c55e"
  vital-green-deep: "#15803d"
typography:
  metric:
    fontFamily: "-apple-system, 'SF Pro Display', Inter, 'Segoe UI', Roboto, sans-serif"
    fontSize: "3rem"
    fontWeight: 900
    lineHeight: 1
    fontFeature: "tabular-nums"
  headline:
    fontFamily: "-apple-system, 'SF Pro Display', Inter, 'Segoe UI', Roboto, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 900
    lineHeight: 1.15
  title:
    fontFamily: "-apple-system, 'SF Pro Display', Inter, 'Segoe UI', Roboto, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.3
  body:
    fontFamily: "-apple-system, 'SF Pro Display', Inter, 'Segoe UI', Roboto, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "-apple-system, 'SF Pro Display', Inter, 'Segoe UI', Roboto, sans-serif"
    fontSize: "0.625rem"
    fontWeight: 700
    letterSpacing: "0.1em"
rounded:
  pill: "9999px"
  control: "16px"
  card: "24px"
spacing:
  hairline: "4px"
  tight: "8px"
  gutter: "24px"
components:
  button-primary:
    backgroundColor: "{colors.periwinkle}"
    textColor: "{colors.surface}"
    rounded: "{rounded.control}"
    padding: "14px 16px"
  button-secondary:
    textColor: "{colors.periwinkle}"
    rounded: "{rounded.control}"
    padding: "12px 16px"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.card}"
    padding: "20px"
  input:
    backgroundColor: "{colors.mist}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "12px 16px"
  chip:
    backgroundColor: "{colors.mist}"
    textColor: "{colors.slate}"
    rounded: "{rounded.pill}"
    padding: "6px 12px"
---

# Design System: Fitness Tracker

## Overview

**Creative North Star: "The Instrument Panel"**

This is a private instrument, not a product with something to sell. It is opened
mid-meal, mid-set and mid-rest, often one-handed, sometimes with the phone
propped against a rack. So it behaves like a well-made gauge: numbers are the
loudest thing on any screen, everything else recedes to a soft neutral field,
and colour is spent only where it changes a decision.

The surface language is a single continuous card stack floating on a pale mist
background — no page chrome, no section dividers, no headers competing with
content. Cards are generously rounded (24px) and lifted by a shadow soft enough
to read as depth rather than decoration. An optional translucent "liquid glass"
mode swaps the opaque cards for frosted ones over a fixed multi-radial colour
field; both modes share every other token, so the system is one design with two
materials.

Density is deliberately high. This app shows a lot of small numbers at once, and
it earns that by making the hierarchy do the work: heavy tabular numerals for
values, tiny wide-tracked uppercase for the labels that name them, and a muted
slate for everything explanatory. Nothing decorative competes for the eye.

**Key Characteristics:**
- Numbers first — weight, kcal, reps and timers are the largest thing on screen
- One accent, spent sparingly, in a single 135° gradient
- Rounded, floating cards on a near-white field; no rules or dividers
- Tiny uppercase labels doing the naming so values stay uncluttered
- Two materials (opaque and frosted glass), two themes, one token set
- Built thumb-first: 44px targets, bottom-docked actions, safe-area aware

## Colors

A cool, near-neutral field with one saturated periwinkle doing all the signalling.

### Primary
- **Periwinkle** (`#6c63ff`): The single brand voice. It marks the one primary
  action on a screen, the active state of a tab or chip, and the current value in
  a chart. In dark mode it lifts to `#7d75ff` to hold its saturation against the
  darker field.
- **Periwinkle Deep** (`#4b3fe0`): Exists almost entirely as the far end of the
  brand gradient. Not used as a flat fill.

### Secondary
- **Vital Green** (`#22c55e` → `#15803d`): Success and "target met" only —
  a reached fasting goal, a hit macro, a completed set. Never decorative.

### Neutral
- **Ink** (`#14142b`): Primary text and every headline number.
- **Slate** (`#63697d`): Secondary and explanatory text. Deliberately darkened
  from an earlier `#8b8fa3` to clear WCAG AA on the mist background, because this
  app leans heavily on small secondary type.
- **Mist** (`#f7f7fb`): The page field and, doubling up, the resting fill of
  inputs and unselected chips.
- **Surface** (`#ffffff`): Card faces.
- **Hairline** (`#eef0f6`): Card borders, track backgrounds, row dividers.

Dark mode keeps the same roles with an inverted field: ink `#101018`, surface
`#1a1a24`, hairline `#262633`, text `#f2f2f7`, muted `#8b8fa3`.

### Named Rules

**The One Gradient Rule.** The accent gradient marks exactly one action per
screen — the thing you came to do. Every other action is either the tonal
variant (accent at 10% opacity with accent text) or a bordered ghost. If two
gradient buttons are visible at once, one of them is wrong.

**The Single Source Rule.** The brand gradient is `var(--accent-gradient)`,
derived from `--accent` and `--accent-dark`. Never re-spell a gradient inline;
a rebrand must remain a one-line change.

## Typography

**All roles:** `-apple-system, 'SF Pro Display', Inter, 'Segoe UI', Roboto, sans-serif`

**Character:** One system stack doing five very different jobs through weight and
scale alone. The personality comes from the extremes — 900-weight numerals
against 10px wide-tracked capitals — not from a typeface choice.

### Hierarchy
- **Metric** (900, 48px, tabular): The reason the screen exists. Timers, the
  weight figure, calories remaining, rest countdown.
- **Headline** (900, 24px): Screen and moment headlines ("Workout complete!").
- **Title** (600–700, 14px): Card titles and section names.
- **Body** (400–500, 12px / 11px): Explanatory copy, row content, hints.
- **Label** (700, 10px, 0.1em tracking, uppercase): Names the thing above or
  below it. The system's most recognisable signature.

### Named Rules

**The Tabular Numeral Rule.** Any figure that changes in place — a countdown, a
live total, a scrubbing chart value — is `tabular-nums`. Numbers must never
jitter as they tick.

**The 10px Floor Rule.** No text renders below 10px, ever. 10px is reserved for
uppercase labels and footnotes; anything the user actually reads starts at 11px.

## Layout

A single-column card stack with a 24px page gutter, scrolling under a fixed
bottom tab bar. Cards are separated by 16px of space rather than by rules. There
are no breakpoints in any meaningful sense: this is a phone app installed to the
home screen, and it is laid out for one hand at one width.

Vertical rhythm comes from a small set of steps — 4px for hairline gaps inside a
row, 8px between related controls, 16px between cards, 24px at the page edge.
Screen-level entrances stagger by ~20ms per card so a screen assembles rather
than appearing all at once.

Anything full-screen (guided workout, sheets) respects `env(safe-area-inset-*)`
top and bottom, and docks its primary action to the bottom edge.

## Elevation & Depth

Depth is carried by a **single ambient card shadow plus tonal layering**, never
by borders alone and never by stacked shadow tiers. There is one shadow in the
system; hierarchy inside a card comes from tonal fills (mist inset panels on
white cards) rather than from lifting things further.

### Shadow Vocabulary
- **Card lift** (`box-shadow: 0 1px 2px rgba(20,20,43,0.04), 0 12px 24px -8px rgba(20,20,43,0.08)`):
  Every card. A tight contact shadow plus a wide soft one.
- **Chrome lift** (`box-shadow: 0 1px 2px rgba(20,20,43,0.05)`): Floating round
  controls and the glass chrome pieces.

### Named Rules

**The One Shadow Rule.** Cards do not nest shadows. A panel inside a card is
distinguished by a mist fill, not by another lift.

## Shapes

Three radii and nothing between them: **pill** (fully round) for chips, toggles
and icon buttons; **control** (16px) for inputs, buttons and inner panels; and
**card** (24px, `--radius-card`) for every top-level surface. Borders are a
single hairline pixel and exist to separate translucent glass from its backdrop
— in opaque mode they are nearly invisible by design.

Icon buttons are perfect circles. Progress tracks and macro bars are fully
rounded at both ends at every fill level, including near-zero.

## Components

### Buttons
- **Shape:** Control radius (16px), full-width by default in forms.
- **Primary:** Accent gradient, white 600-weight text, 14px vertical padding,
  `active:scale-[0.98]` press response.
- **Secondary:** Accent text on a 10% accent tint, same radius and press
  response, no border. This is the "option B" treatment.
- **Ghost:** Hairline border, ink text, transparent fill — for dismissive or
  low-stakes actions ("Skip rest", "Cancel").
- **Focus:** A 2px accent outline at 2px offset, `:focus-visible` only, so touch
  never shows it.

### Chips
- **Style:** Pill, 11–12px semibold, mist fill with slate text when unselected.
- **Selected:** Solid accent fill with white text. Selection is a fill change,
  never a border change.

### Cards / Containers
- **Corner Style:** Card radius (24px).
- **Background:** Surface white, or translucent in glass mode.
- **Shadow Strategy:** The single card lift (see Elevation).
- **Border:** One hairline pixel.
- **Internal Padding:** 20px, dropping to 12px for dense list cards.

### Inputs / Fields
- **Style:** Mist fill, hairline border, control radius, 14px text.
- **Focus:** Border shifts to accent; no glow, no shadow.
- **Numeric entry:** Centre-aligned, 18px, 700 weight — these are read as values,
  not as form fields.

### Navigation
- Fixed bottom tab bar, five destinations, icon over a 10px label. The active tab
  takes an accent-tinted pill behind the icon and accent label text. A circular
  gradient FAB floats above the bar for the primary "add" action.

### Signature Component: the metric card
The recurring pattern that defines the app — a tiny uppercase label, an oversized
tabular numeral with a small unit suffix, and a single line of slate context
underneath (`▼ 1.1 kg · period`). It appears as a stat tile, a chart header and a
summary row, and it is the reason the type scale is built the way it is.

## Do's and Don'ts

### Do:
- **Do** put the number first and biggest. If a card has a value, that value is
  the largest element in it.
- **Do** use `var(--accent-gradient)` for the one primary action, and the tonal
  secondary style for everything alongside it.
- **Do** give any control smaller than 44px the `.tap-44` class so the hit area
  grows without the visual changing.
- **Do** use `tabular-nums` on every figure that updates in place.
- **Do** pair every entrance animation with its `prefers-reduced-motion` fallback
  in the existing media block.
- **Do** state when a chart changes what it is measuring (per-day vs weekly
  average) rather than letting the bars silently change meaning.

### Don't:
- **Don't** render text below 10px, or use 10px for anything but uppercase labels
  and footnotes.
- **Don't** spell a brand gradient inline. In Tailwind arbitrary values the
  `image:` type hint is required — `bg-[image:var(--accent-gradient)]` — because
  without it Tailwind emits `background-color` and the fill silently disappears.
- **Don't** write `color-mix()` on a token in hand-authored CSS. The build emits
  a no-`color-mix` fallback that strips the percentage, so a 4% tray becomes a
  solid near-black slab and a 15% wash becomes full saturation. Define the
  translucent value as a literal `rgba` token per theme instead (`--tray`,
  `--accent-shadow`, `--section-wash`). Inline `style={{}}` in JSX is exempt:
  the browser evaluates it directly, and an unsupported value simply doesn't
  apply, which fails safe.
- **Don't** put two gradient buttons on one screen.
- **Don't** add a second shadow tier or nest shadows inside cards.
- **Don't** separate rows with visible rules where space or a tonal fill will do.
- **Don't** introduce a new radius. Pill, 16px, and 24px are the whole vocabulary.
