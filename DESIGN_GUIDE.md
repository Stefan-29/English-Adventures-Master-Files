# Grammar101 — Design Guide

> **Purpose.** This document defines the visual and interaction design language for Grammar101. It exists for two reasons: (1) to keep future contributions consistent with the redesign, and (2) to prevent the project from drifting back into "AI slop" — the overused, instantly-recognizable aesthetic that AI-generated websites default to when no human designer is in the loop.
>
> Treat this as a hard contract, not a suggestion. PRs that violate it should be blocked in review.

---

## Table of Contents

1. [What is AI Slop?](#1-what-is-ai-slop)
2. [The Forbidden Patterns](#2-the-forbidden-patterns)
3. [The Required Patterns](#3-the-required-patterns)
4. [Color System](#4-color-system)
5. [Typography](#5-typography)
6. [Spacing & Layout](#6-spacing--layout)
7. [Components](#7-components)
8. [Motion](#8-motion)
9. [Accessibility](#9-accessibility)
10. [Icons & Imagery](#10-icons--imagery)
11. [Code Hygiene](#11-code-hygiene)
12. [Pre-PR Checklist](#12-pre-pr-checklist)
13. [Audit Procedure](#13-audit-procedure)

---

## 1. What is AI Slop?

"AI slop" is the visual equivalent of "AI voice" in writing — a set of overused, default-to-the-mean patterns that LLMs fall into when asked to "make it look modern" without specific design guidance. The result looks technically competent but aesthetically untrustworthy. End users cannot articulate why, but they feel it.

### The signature tells of AI slop

These are the patterns that, individually, are tolerable. **In combination, they are the AI-slop fingerprint.** A site with three or more of these will read as AI-generated to a designer within five seconds.

1. **Purple-to-cyan gradient on text** — usually `linear-gradient(90deg, #8b5cf6, #06b6d4)` clipped to text via `background-clip: text`. The single most reliable AI-slop marker in the wild.
2. **Emoji as UI icons** — 📖 for "Learn", 🎮 for "Play", ⚙️ for settings. Emoji render differently per OS, don't scale to the design's pixel grid, and signal "no designer was involved."
3. **Radial gradient blobs in the body background** — `radial-gradient(circle at 25% 25%, rgba(...), transparent 50%)`. Adds nothing, costs repaints.
4. **Glow effects on every interactive element** — `box-shadow: 0 0 20px rgba(139, 92, 246, 0.3)` on hover, focus, and active.
5. **`scale(1.2)` hover transforms** on badges, buttons, icons. Looks playful on a kindergarten site, unprofessional on a learning platform for adults.
6. **Shimmer animations on progress bars** — a moving `linear-gradient(transparent, rgba(255,255,255,0.1), transparent)` overlay. Adds visual noise to data that should be read at a glance.
7. **Five competing accent colors** — purple + cyan + magenta + amber + emerald, all used as "primary" in different components. No information architecture, just decoration.
8. **Border-radius roulette** — `8px / 12px / 16px / 20px / 25px` chosen ad-hoc per element. The eye registers inconsistency even when the brain can't name it.
9. **"Web3-inspired" CSS comments** — or "blockchain-inspired", or "futuristic". If the comment is selling the design, the design isn't selling itself.
10. **Bloat CSS** — 4,000+ lines for a single-page app, with the same rule overridden three times in different files. Symptom of uncoordinated AI edits.

### Why this matters for an English-learning platform

Our users are language learners. Many are non-native English speakers reading carefully. Visual noise — gradients on text, glowing buttons, animated backgrounds — competes for cognitive bandwidth that should go to the lesson content. A calm, restrained interface is not a stylistic preference; it is a usability requirement for this product.

---

## 2. The Forbidden Patterns

Each entry below shows the AI-slop pattern, why it's bad, and the correct replacement.

### 2.1 No gradients on text

**Forbidden:**
```css
/* DON'T — instant AI-slop marker */
h1, h2, h3 {
  background: linear-gradient(90deg, var(--primary-light), var(--primary-color));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
```

**Required:**
```css
/* DO — solid color, real weight */
h1, h2, h3 {
  color: var(--text);
  font-weight: 600;
  letter-spacing: -0.01em;
}
```

**Why:** Gradient-clipped text has poor contrast at the gradient endpoints, breaks font hinting, and is the single most reliable "AI made this" signal. If you need hierarchy, use weight, size, and color — not decoration.

### 2.2 No emoji as UI icons

**Forbidden:**
```html
<!-- DON'T -->
<button>📖 Learn</button>
<button>🎮 Play</button>
<button>⚙️ Settings</button>
<span class="icon">🌙</span>
```

```js
// DON'T
const mainModules = [
  { id: 'learn', name: '📖 Learn' },
  { id: 'play', name: '🎮 Play' }
];
```

**Required:**
```html
<!-- DO — inline SVG, currentColor, 1.5-2px stroke -->
<button>
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
       stroke="currentColor" stroke-width="2"
       stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M12 7v14"/>
    <path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/>
  </svg>
  <span>Learn</span>
</button>
```

**Why:** Emoji render differently per OS (Apple Color Emoji vs Noto Emoji vs Segoe UI Emoji), don't snap to your pixel grid, can't inherit `currentColor`, and break at small sizes. Inline SVG is crisp, themeable, and signals intentional design.

**Reference icon sets:** [Lucide](https://lucide.dev), [Feather](https://feathericons.com), [Heroicons](https://heroicons.com) — all MIT-licensed, all 1.5–2px stroke, all `currentColor`-based.

### 2.3 No background gradient blobs

**Forbidden:**
```css
/* DON'T */
body {
  background-image:
    radial-gradient(circle at 25% 25%, rgba(110, 86, 207, 0.05) 0%, transparent 50%),
    radial-gradient(circle at 75% 75%, rgba(16, 185, 129, 0.05) 0%, transparent 50%);
  background-attachment: fixed;
}
```

**Required:**
```css
/* DO — flat background, period */
body {
  background-color: var(--bg);
}
```

**Why:** Background blobs add zero information, cost a repaint on scroll (especially with `background-attachment: fixed`), and are visual noise. If you need to separate content from chrome, use borders and surface colors — not gradients.

### 2.4 No glow effects

**Forbidden:**
```css
/* DON'T */
--glow-primary: 0 0 20px rgba(139, 92, 246, 0.3);
--glow-secondary: 0 0 20px rgba(6, 182, 212, 0.3);
--glow-accent: 0 0 20px rgba(245, 158, 11, 0.3);

.badge:hover {
  box-shadow: var(--glow-primary);
}
```

**Required:**
```css
/* DO — single subtle shadow family */
--shadow-sm: 0 1px 2px rgba(28, 25, 23, 0.04);
--shadow:    0 1px 3px rgba(28, 25, 23, 0.06), 0 1px 2px rgba(28, 25, 23, 0.04);
--shadow-md: 0 4px 8px rgba(28, 25, 23, 0.06), 0 2px 4px rgba(28, 25, 23, 0.04);

.badge:hover {
  border-color: var(--border-strong);
  background: var(--surface-muted);
}
```

**Why:** Glows read as "gaming PC" or "Web3 dashboard", not "educational platform". They also flatten visual hierarchy — if everything glows, nothing stands out.

### 2.5 No `scale(1.2)` hover transforms

**Forbidden:**
```css
/* DON'T */
.badge:hover {
  transform: scale(1.2) rotate(10deg);
  filter: drop-shadow(0 0 8px rgba(250, 204, 21, 0.8));
}

.control-panel-btn:hover {
  transform: translateY(-4px) scale(1.05);
}
```

**Required:**
```css
/* DO — color/border change only, maybe 1px lift on primary CTAs */
.badge:hover {
  background: var(--surface-muted);
  border-color: var(--border-strong);
}

.btn--primary:hover {
  background: var(--accent-hover);
}
```

**Why:** Aggressive transforms make the UI feel jittery and toy-like. Hover states should communicate "this is interactive", not "look at me, I'm animated". A color or border change is enough.

**Exception:** The settings FAB may use `translateY(-1px)` on hover because it's a single, primary action — and even there, keep it to 1px.

### 2.6 No shimmer / infinite animations on data

**Forbidden:**
```css
/* DON'T */
.progress-bar::before {
  animation: shimmer 2s infinite;
}

.progress {
  animation: gradientMove 3s ease infinite;
}
```

**Required:**
```css
/* DO — static fill, transition on width change only */
.progress {
  background: var(--accent);
  transition: width 400ms cubic-bezier(0.4, 0, 0.2, 1);
}
```

**Why:** A progress bar is a data display. The user reads its value at a glance. An infinite shimmer animation fights that reading. Animate the **width** when the value changes — that's the only motion that conveys information.

### 2.7 No competing accent colors

**Forbidden:**
```css
/* DON'T — five "primary" colors */
--primary-color:  #8b5cf6;  /* purple */
--secondary-color: #06b6d4; /* cyan */
--accent-color:   #f59e0b;  /* amber */
--pink-color:     #ec4899;  /* magenta */
--gold-color:     #10b981;  /* emerald */
```

**Required:**
```css
/* DO — one accent, semantic feedback colors */
--accent:        #047857;  /* emerald — the only "brand" color */
--accent-hover:  #065f46;
--accent-soft:   #ecfdf5;  /* 5% accent tint for backgrounds */

/* Semantic colors — only for feedback, never for branding */
--success: #059669;
--error:   #dc2626;
--warning: #d97706;
--info:    #2563eb;
```

**Why:** One accent color creates a clear visual hierarchy. Multiple "primary" colors mean nothing is primary. The semantic colors (success/error/warning/info) exist only to communicate state, never to decorate.

### 2.8 No border-radius roulette

**Forbidden:**
```css
/* DON'T — ad-hoc radii */
.card { border-radius: 12px; }
.button { border-radius: 25px; }
.input { border-radius: 8px; }
.tag { border-radius: 16px; }
.modal { border-radius: 20px; }
```

**Required:**
```css
/* DO — defined scale, used consistently */
--radius-sm:   4px;   /* small chips, tags */
--radius:      6px;   /* buttons, inputs */
--radius-md:   8px;   /* cards, panels */
--radius-lg:   12px;  /* modals, large containers */
--radius-full: 9999px; /* pills, avatars */
```

**Rule of thumb:** Inputs and buttons share the same radius. Cards are one step larger. Pills are `radius-full`. Never invent a new radius value mid-project.

### 2.9 No "Web3-inspired" or "futuristic" language in code

**Forbidden:**
```css
/* DON'T */
/* Web3 Learning Platform - Main Styles
   Modern, blockchain-inspired design system with fluid animations */
```

**Required:**
```css
/* DO — describe what the file does, not the vibe */
/* Grammar101 — Main Stylesheet
   Design tokens, layout, and components. See docs/DESIGN_GUIDE.md. */
```

**Why:** If you have to assert that the design is "modern" or "inspired", it isn't. Let the work speak.

### 2.10 No CSS bloat

**Forbidden:**
- 4,000+ line stylesheets for a single-page app
- The same selector overridden in three different files
- `!important` to win specificity wars
- Commented-out rules kept "just in case"

**Required:**
- One stylesheet per concern (base, components, lesson module)
- Use the cascade — don't fight it
- Delete dead code. Git remembers.
- If a rule is overridden, the original is wrong. Fix the original.

---

## 3. The Required Patterns

These are the patterns the redesign established. New code must follow them.

### 3.1 Design tokens come first

All colors, spacing, typography, shadows, and motion live in `:root` in `css/styles.css`. **Never hardcode values in component CSS.** If you need a new value, add a token.

```css
:root {
  /* Color */
  --bg: #fafaf9;
  --surface: #ffffff;
  --text: #1c1917;
  --accent: #047857;

  /* Spacing — 4pt base, 8pt rhythm */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-6: 24px;
  --space-8: 32px;

  /* Type scale — 1.2 ratio */
  --text-sm:   14px;
  --text-base: 16px;
  --text-lg:   18px;
  --text-xl:   20px;
  --text-2xl:  24px;

  /* Radius — see 2.8 */
  /* Shadow — single family */
  /* Motion — restrained */
  --transition-fast: 120ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition:      180ms cubic-bezier(0.4, 0, 0.2, 1);
}
```

### 3.2 Dark mode overrides tokens, not components

```css
/* DO — redefine tokens, components inherit */
body.dark-mode {
  --bg: #0c0a09;
  --surface: #1c1917;
  --text: #fafaf9;
  --accent: #10b981;
}

/* DON'T — re-style each component for dark mode */
body.dark-mode .card { background: #1c1917; }
body.dark-mode .button { background: #292524; }
/* ... 200 more overrides ... */
```

### 3.3 Semantic class names, not presentational ones

**Forbidden:**
```html
<div class="purple-card rounded-xl shadow-glow">
```

**Required:**
```html
<div class="activity-card">
```

Class names describe **what the element is**, not what it looks like. The look lives in CSS where it can change without touching HTML.

### 3.4 Components are flat, not nested

```html
<!-- DO — flat, BEM-ish -->
<div class="activity-card">
  <h4 class="activity-card__title">Past Simple</h4>
  <p class="activity-card__prompt">Complete the sentence...</p>
  <div class="activity-card__options">...</div>
</div>

<!-- DON'T — five wrapper divs to achieve a "look" -->
<div class="card-wrapper">
  <div class="card-inner">
    <div class="card-content">
      ...
    </div>
  </div>
</div>
```

---

## 4. Color System

### 4.1 The palette

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--bg` | `#fafaf9` | `#0c0a09` | Page background |
| `--surface` | `#ffffff` | `#1c1917` | Cards, panels, modals |
| `--surface-subtle` | `#f5f5f4` | `#1c1917` | Inset areas, lesson body bg |
| `--surface-muted` | `#efeeec` | `#292524` | Hover states |
| `--border` | `#e7e5e4` | `#292524` | Default 1px borders |
| `--border-strong` | `#d6d3d1` | `#44403c` | Hover borders, dividers |
| `--text` | `#1c1917` | `#fafaf9` | Primary text |
| `--text-secondary` | `#44403c` | `#d6d3d1` | Secondary text |
| `--text-muted` | `#78716c` | `#a8a29e` | Tertiary text, captions |
| `--accent` | `#047857` | `#10b981` | The only brand color |
| `--accent-hover` | `#065f46` | `#34d399` | Hover state of accent |
| `--accent-soft` | `#ecfdf5` | `#064e3b` | 5% tint for backgrounds |

### 4.2 Semantic feedback colors

| Token | Meaning | Usage |
|-------|---------|-------|
| `--success` / `--success-soft` | Correct answer | Quiz feedback, completed state |
| `--error` / `--error-soft` | Wrong answer | Quiz feedback, validation error |
| `--warning` / `--warning-soft` | Hint, caution | Hint boxes, unsaved changes |
| `--info` / `--info-soft` | Informational | Info banners, tooltips |

**Rule:** Semantic colors are **never** used for branding or decoration. A blue button is an info button, not a "secondary primary" button.

### 4.3 Contrast requirements

All text must meet WCAG AA:
- Body text (under 18px): **4.5:1** minimum against background
- Large text (18px+ or 14px+ bold): **3.0:1** minimum
- UI components (borders, icons): **3.0:1** minimum

The redesign passes these. Verify new components with the audit script in `scripts/test_redesign.py` before opening a PR.

---

## 5. Typography

### 5.1 Font families

| Token | Family | Usage |
|-------|--------|-------|
| `--font-sans` | Inter | All UI: buttons, labels, navigation, headings |
| `--font-serif` | Newsreader | Lesson content body text only |
| `--font-mono` | SF Mono / Consolas | Word bank entries, code, phonetic notation |

**Why two families:** Inter alone reads as "tech app". Adding Newsreader serif for the lesson body gives the educational content a textbook, scholarly weight — distinguishing it from the chrome around it. This is the same move Khan Academy, Duolingo (in stories), and Substack make.

### 5.2 Type scale (1.2 ratio)

| Token | Size | Usage |
|-------|------|-------|
| `--text-xs` | 12px | Section headers (uppercase), captions |
| `--text-sm` | 14px | Secondary text, button labels, inputs |
| `--text-base` | 16px | Body text, default |
| `--text-lg` | 18px | Lesson body (serif), emphasized UI |
| `--text-xl` | 20px | Card titles, section headings |
| `--text-2xl` | 24px | Page section headers, lesson title |
| `--text-3xl` | 32px | (Reserved for hero, not used) |

**Rule:** Don't introduce `15px`, `17px`, `22px` — pick from the scale or add a new token.

### 5.3 Weight

- **400** — body text
- **500** — buttons, labels, nav items
- **600** — headings, active states, emphasized labels
- **700** — (rare) only for the strongest H1

Never use `font-weight: 300` (light) — it fails contrast at small sizes and reads as "designy" rather than legible.

### 5.4 Letter-spacing

- Headings: `-0.01em` to `-0.015em` (tighter at larger sizes)
- Uppercase labels: `+0.04em` to `+0.06em` (looser for readability)
- Body: `0` (default)

---

## 6. Spacing & Layout

### 6.1 The 8pt grid

All vertical and horizontal padding/margin uses the 8pt scale:

```
4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64 · 80
```

**Rule:** `4px` and `12px` are allowed for fine-tuning within components. Anything else must be a multiple of 8. Never use `10px`, `15px`, `18px`, `22px`.

### 6.2 Container

```css
.container {
  max-width: 1080px;       /* readable line length */
  margin: 0 auto;
  padding: 32px 32px 64px; /* desktop */
}

@media (max-width: 640px) {
  .container { padding: 20px 16px 40px; }
}
```

### 6.3 Section rhythm

- Between major sections: `--space-8` (32px) or `--space-12` (48px)
- Between cards in a list: `--space-4` (16px)
- Between fields in a form: `--space-3` (12px) or `--space-4` (16px)
- Inside a card: `--space-5` (20px) or `--space-6` (24px)

---

## 7. Components

### 7.1 Buttons

Three variants only:

```css
.btn--primary    /* solid accent fill — the main CTA */
.btn--secondary  /* outlined with border-strong — secondary actions */
.btn--ghost      /* transparent, hover gets surface-muted — tertiary */
.btn--danger     /* solid error fill — destructive actions */
```

**Rules:**
- One primary CTA per view. If you have two, you don't know what you want the user to do.
- Never use `btn--primary` for "Cancel" or "Reset".
- Never mix variants in the same row of a form.

### 7.2 Cards

```css
.activity-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);  /* 12px */
  padding: var(--space-6);          /* 24px */
}
```

Cards use a 1px border, not a shadow, for separation. Shadows are reserved for floating elements (modals, dropdowns, the settings FAB).

### 7.3 Tags / pills

```css
.tag {
  padding: 4px 12px;
  background: var(--surface-subtle);
  border: 1px solid var(--border);
  border-radius: var(--radius-full);
  font-size: var(--text-sm);
}
```

Pills use `radius-full` (fully rounded). They are **never** given a shadow or a glow.

### 7.4 Inputs

```css
input[type="text"], textarea {
  padding: 12px 16px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--surface);
}
input:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-soft);
}
```

The focus ring is a 3px `accent-soft` halo — visible, accessible, and not a glow.

### 7.5 Toggles

```css
.toggle-switch {
  width: 36px; height: 20px;
  background: var(--border-strong);
  border-radius: var(--radius-full);
}
.toggle-input:checked ~ .toggle-switch {
  background: var(--accent);
}
```

iOS-style. Active state is solid accent. No gradient.

---

## 8. Motion

### 8.1 Duration

| Token | Duration | Usage |
|-------|----------|-------|
| `--transition-fast` | 120ms | Hover states, color changes |
| `--transition` | 180ms | Toggles, panel open, focus rings |
| (long) | 400ms | Progress bar width, page section fade-in |

**Rule:** Nothing animates for longer than 400ms except a one-time entrance. Infinite animations are forbidden (see 2.6).

### 8.2 Easing

One easing curve for everything:

```css
cubic-bezier(0.4, 0, 0.2, 1)
```

Don't use `ease`, `ease-in-out`, or `linear`. Don't introduce `cubic-bezier(0.34, 1.56, 0.64, 1)` (the "spring" curve) — it makes UIs feel bouncy and toy-like.

### 8.3 What may animate

- Color, background-color, border-color
- Box-shadow (focus ring only)
- Transform: `translateY(-1px)` on primary CTA hover, `translateX(16px)` on toggle slider
- Width on progress bars (data change)
- Opacity + small translate on modal open

### 8.4 What may NOT animate

- `transform: scale()` above 1.05
- `transform: rotate()` (except the settings gear icon, max 60deg, on hover)
- `filter: drop-shadow()` or `blur()` on hover
- Any `infinite` animation
- Anything on scroll-triggered observers

### 8.5 Reduced motion

```css
body.reduce-motion *,
body.reduce-motion *::before,
body.reduce-motion *::after {
  animation-duration: 0.01ms !important;
  transition-duration: 0.01ms !important;
}
```

This is already in `styles.css`. The settings panel exposes it as a toggle. Never add a new animation without confirming it's covered by this rule.

---

## 9. Accessibility

### 9.1 Contrast

See §4.3. All new components must pass WCAG AA. Run `scripts/test_redesign.py` to verify.

### 9.2 Focus

- Every interactive element must have a visible `:focus-visible` state.
- The default outline is removed only when a custom focus ring is provided.
- Focus ring: `outline: 2px solid var(--accent); outline-offset: 2px;`

### 9.3 ARIA

- Buttons get `type="button"`. Toggles get `role="switch"` and `aria-checked`.
- Collapsible sections: the trigger button has `aria-expanded` and `aria-controls`.
- Modals: `role="dialog"`, `aria-modal="true"`, `aria-labelledby` pointing to the title.
- Decorative SVGs: `aria-hidden="true"`.

### 9.4 Hit targets

Minimum 32×32px. Mobile minimum 44×44px (the settings FAB is exactly 44×44px).

### 9.5 High contrast mode

```css
body.high-contrast {
  --border: #1c1917;
  --border-strong: #1c1917;
  --text-muted: #44403c;
}
```

Already in `styles.css`. Don't override per-component.

---

## 10. Icons & Imagery

### 10.1 Icons

- **Source:** Lucide, Feather, or Heroicons. All MIT-licensed.
- **Style:** 1.5px or 2px stroke, `fill="none"`, `stroke="currentColor"`.
- **Size:** 14px (inline with text), 16px (buttons), 20px (nav), 24px (large). Snap to even numbers.
- **Inline SVG, not icon fonts.** Icon fonts (Font Awesome, Material Icons) add a render-blocking CSS request, don't inherit `currentColor` cleanly, and have been removed from this project.

### 10.2 Illustrations

- Use sparingly. One per empty state, max.
- Style: flat or single-tone, matching the accent palette.
- Never use stock illustrations with multiple gradient characters.

### 10.3 Photos

- Lesson photos (in `assets/`) are cropped to a fixed aspect ratio and given a 1px border.
- Never apply `filter: brightness()` or `overlay` gradients to photos.

---

## 11. Code Hygiene

### 11.1 File organization

```
css/
  styles.css         # tokens, base, layout, all components
  lesson-module.css  # lesson-specific styles only
modules/
  *.js               # one file per feature module
index.html
app.js               # app orchestration
```

Don't create a third stylesheet unless a genuinely new surface appears (e.g., a printable lesson view).

### 11.2 CSS rules

- **No `!important`.** If you need it, your specificity is wrong.
- **No IDs as selectors** (`#my-element { ... }`). IDs are for JS hooks, not styling.
- **No `!`-prefixed utility classes** like `!mt-4`. We're not using Tailwind.
- **No inline `style="..."` attributes** except for genuinely dynamic values (e.g., `style="width: 47%"` on a progress bar).
- **Delete dead code.** Git remembers everything you remove.

### 11.3 JS rules

- Don't generate CSS class names dynamically (`btn-${color}`). Use a finite set of variant classes.
- Don't inject `<style>` tags from JS.
- When generating HTML from JS, use the same SVG icon set as the static HTML.

### 11.4 Commenting

- **DO** comment non-obvious logic (`// Strip emojis from lesson titles because the JSON data contains them`).
- **DON'T** comment the obvious (`// Loop over items items.forEach(...)`).
- **DON'T** use emoji in comments or console logs. They render inconsistently in CI logs and terminal emulators.

---

## 12. Pre-PR Checklist

Before opening a pull request that touches UI, verify every item:

- [ ] No gradient on any text (`grep -r "background-clip: text" css/` returns nothing)
- [ ] No emoji in HTML or generated HTML strings (`grep -rP "[\x{1F000}-\x{1FAFF}]" .`)
- [ ] No `radial-gradient` in body or section backgrounds
- [ ] No `--glow-*` variables or `box-shadow: 0 0 Npx rgba(..., 0.3)` glow effects
- [ ] No `transform: scale()` greater than 1.05 in hover states
- [ ] No `animation: ... infinite` on data displays (progress, stats, charts)
- [ ] All colors use existing tokens — no hardcoded hex values in component CSS
- [ ] All spacing uses the 8pt scale — no `10px`, `15px`, `18px`, `22px`
- [ ] All border-radius values come from the `--radius-*` scale
- [ ] New components pass WCAG AA contrast (run `python3 scripts/test_redesign.py`)
- [ ] New interactive elements have a visible `:focus-visible` state
- [ ] The change works in light mode **and** dark mode
- [ ] The change works at 390px mobile width (test with Playwright or browser devtools)
- [ ] No new `!important` rules
- [ ] No commented-out CSS kept "just in case"
- [ ] File length hasn't ballooned — if `styles.css` grows past 2,200 lines, refactor

---

## 13. Audit Procedure

The repo includes `scripts/test_redesign.py` — a Playwright script that:

1. Spins up a local HTTP server
2. Captures desktop (1440×900), mobile (390×844), dark mode, and settings panel screenshots
3. Scans the rendered DOM for AI-slop markers (specific gradient strings and emoji)
4. Runs a WCAG AA contrast audit on 9 key UI elements
5. Reports console errors

### Running the audit

```bash
cd /path/to/grammar101
python3 scripts/test_redesign.py
```

### What a clean run looks like

```
[OK] No AI-slop markers in rendered DOM
[PASS] body text                        ratio=16.74
[PASS] site title                       ratio=16.74
[PASS] grammar button (active)          ratio=5.48
...
```

If any line says `[WARN]` or `[FAIL]`, fix it before opening the PR.

### Adding new elements to the audit

If you add a new component (e.g., a "streaks" panel), add a sample entry to the `samples` array in `scripts/test_redesign.py` so future PRs verify its contrast.

---

## Appendix: The 5-Tool Workflow

This redesign and this guide were produced using the 5-tool workflow for avoiding AI slop:

1. **Taste skill** — Define the design language before writing CSS. State the reference aesthetic in one sentence: "Khan Academy's serif body text meets Stripe's settings panel meets Linear's toggles." If you can't state it in one sentence, you don't have a language yet.

2. **Web design guidelines** — Audit against objective rules, not vibes. WCAG AA contrast, 8pt spacing grid, 1.2 type scale. These are pass/fail, not opinions.

3. **Awesome design** — Establish a design system with named tokens. Components share radius, shadow, spacing, and motion values by reference, not by copy-paste.

4. **Screenshot to code** — Pick a reference (Khan Academy, Stripe, Linear) and translate its visual language into your context. Don't invent from scratch; don't copy verbatim.

5. **Playwright CLI** — Test the rendered result, not the code. Screenshot desktop, mobile, and dark mode. Run a contrast audit. Have a VLM critique the screenshots. Fix what fails.

Every future redesign — whether a new feature, a theme refresh, or a full rebrand — should run through these five tools in order. Skipping any one of them is how AI slop creeps back in.

---

*Last updated: 2025. Maintained alongside `css/styles.css`. If the two ever disagree, the CSS is the source of truth and this document is out of date — open an issue.*
