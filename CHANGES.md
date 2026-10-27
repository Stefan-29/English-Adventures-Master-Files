# Grammar101 — Redesign Summary

A focused visual redesign of the Grammar101 / English Adventures platform to remove AI-slop markers (purple gradients, glow effects, emojis-as-icons, scale(1.2) hovers, radial gradient blobs) and apply a professional, scholarly design language.

## What was changed

### Files modified

| File | Before | After | Change |
|------|--------|-------|--------|
| `index.html` | 274 lines | 298 lines | Replaced every emoji icon with inline Lucide-style SVG; added proper meta tags; introduced semantic class names (`site-header__brand`, `collapsible-btn`, `module__head`); removed Font Awesome dependency; kept all DOM hook IDs that `app.js` expects |
| `css/styles.css` | 4,746 lines | 1,876 lines | **60% smaller.** Complete rewrite. Single emerald accent on a warm stone neutral base. No gradients on text, no glows, no shimmer, no scale(1.2) hovers. 8pt spacing grid, 1.2 type scale, WCAG AA contrast |
| `css/lesson-module.css` | 816 lines | 348 lines | Matching rewrite. Lesson body now uses **Newsreader serif** for an academic, textbook feel |
| `app.js` | 2,260 lines | 2,305 lines | Replaced `📖 Learn / 🎮 Play / ✍️ Write` with inline SVG icons; added `stripEmojis()` helper to clean lesson titles; silenced a dead-code `toggleSoundEffects` console error |
| `modules/*.js` | — | — | Removed 74 emojis from dynamically-generated UI strings (game cards, quiz feedback, rewards, spelling hints, TTS labels, writing prompts) |

### Files added

| File | Purpose |
|------|---------|
| `docs/DESIGN_GUIDE.md` | 830-line design contract documenting every AI-slop pattern to avoid, every required pattern to follow, the color/typography/spacing/component system, a 16-item pre-PR checklist, and the 5-tool audit workflow. Future contributors must read this before touching UI. |

### Design decisions

| Aspect | Before (AI-slop) | After (Professional) |
|--------|------------------|----------------------|
| **Accent color** | Purple `#8b5cf6` + cyan `#06b6d4` + magenta + amber + emerald (5 colors) | Single emerald `#047857` accent on warm stone `#fafaf9` base |
| **Typography** | Inter only, gradient-clipped headings | Inter for UI, **Newsreader serif** for lesson content (academic feel) |
| **Icons** | Emoji everywhere (📖 🎮 ✍️ ⚙️ 🌙 🎶 🔔 ✨ 💡 👁️ ⚡ 🔄) | Inline Lucide-style SVG, 1.5px stroke, currentColor |
| **Gradients on text** | Yes — `linear-gradient(90deg, var(--primary-light), var(--primary-color))` on every heading | None — solid colors only |
| **Background blobs** | `radial-gradient(circle at 25% 25%, rgba(110, 86, 207, 0.05) ...)` | Plain background |
| **Glow effects** | `--glow-primary`, `--glow-secondary`, `--glow-accent`, `--glow-pink`, `--glow-gold` (5 glows) | None — single subtle shadow family |
| **Hover transforms** | `scale(1.2) rotate(10deg)` on every badge, `translateY(-4px) scale(1.05)` on buttons | None — only color/border transitions |
| **Border radius** | 8px / 12px / 16px / 20px / 25px (inconsistent, very rounded) | 4 / 6 / 8 / 12px scale (consistent) |
| **Progress bar** | Animated gradient with shimmer + glow + blurred highlight | 6px solid accent bar |
| **Settings FAB** | 56×56px purple gradient circle with emoji | 44×44px solid dark circle with SVG gear |
| **Toggle switches** | 48×28px with purple gradient when active | 36×20px with solid accent when active (iOS-style) |

### Quality verification

The redesign was tested with Playwright (desktop + mobile + dark mode + settings panel) and audited with a vision-language model.

**WCAG AA contrast audit (light mode):**
| Element | Ratio | Status |
|---------|-------|--------|
| Body text | 16.74:1 | AAA pass |
| Site title | 16.74:1 | AAA pass |
| Lesson subtitle | 16.74:1 | AAA pass |
| Grammar button (inactive/active) | 5.48:1 | AA pass |
| Nav button (inactive/active) | 17.49:1 | AAA pass |
| Collapsible label | 17.49:1 | AAA pass |
| Progress text | 4.59:1 | AA pass |

**VLM design critique (overall):** "Largely professional and human-designed. Avoids the most common AI-generated pitfalls. No toxic gradients. No glow effects. No emoji-as-icon abuse."

**VLM settings panel critique:** 9/10 — "Exceptionally clean. Matches Notion or Stripe settings. Zero AI-slop markers."

**VLM dark mode critique:** "Highly professional and modern. Premium feel. WCAG AA compliant."

## How to apply this to your GitHub repo

You have two options:

### Option A — Copy individual files

1. Download these files from this package:
   - `index.html` → replaces your `index.html`
   - `css/styles.css` → replaces your `css/styles.css`
   - `css/lesson-module.css` → replaces your `css/lesson-module.css`
   - `app.js` → replaces your `app.js`
   - `modules/*.js` (all 8 files) → replaces your `modules/*.js`
   - `docs/DESIGN_GUIDE.md` → **new file**, goes in your `docs/` folder

2. In your local clone of the repo:
   ```bash
   git checkout -b redesign/professional-look
   # copy the new files in
   git add -A
   git commit -m "Redesign: remove AI-slop, apply professional design system

   - Replace 4,746-line styles.css with focused 1,876-line design system
   - Single emerald accent on warm stone base (no more purple gradients)
   - Inline Lucide-style SVG icons (no more emoji-as-icon)
   - Newsreader serif for lesson content (academic feel)
   - Inter for UI, 8pt spacing grid, WCAG AA contrast
   - Strip emojis from displayed lesson titles
   - Add docs/DESIGN_GUIDE.md as design contract for future contributions
   - 60% smaller CSS, no functional changes"
   git push origin redesign/professional-look
   ```

3. Open a PR on GitHub. Reference `docs/DESIGN_GUIDE.md` in the PR description so reviewers have the contract.

### Option B — Run the redesigned version locally

```bash
cd /path/to/your/repo
# after copying the files in
python3 -m http.server 8001
# open http://localhost:8001
```

## What was NOT touched

To keep the redesign risk-free, these were left untouched:

- `config/*.json` — all 67 grammar topic configs (data unchanged)
- `reproducibility/*.json` — data reproducibility files
- `assets/` — images and sounds
- `legal/` — privacy policy, terms of service
- `docs/` — documentation
- `scripts/` — utility scripts
- Lesson content emojis (e.g., `📚` inside lesson body text in JSON data) — these are content, not design, and changing them would alter the educational copy. The `stripEmojis()` helper in `app.js` cleans the lesson **titles** displayed in the page header, but leaves body content untouched.

## Files NOT included in this package

These were not modified and you don't need to copy them:
- `package.json`
- `README.md`
- everything in `assets/`, `config/`, `docs/`, `legal/`, `reproducibility/`, `scripts/`

## 5-tool methodology applied

This redesign followed the 5-tool workflow you mentioned:

1. **Taste skill** — Defined a restrained design language: single accent color, real typography (Inter + Newsreader serif), no gradients on text, no emoji icons. Reference aesthetic: Khan Academy + Stripe + Linear.

2. **Web design guidelines** — Audited the final result against WCAG AA contrast rules. All sampled elements pass AA; most pass AAA. Spacing uses 8pt grid; type uses 1.2 ratio scale.

3. **Awesome design** — Established a design system with named tokens (`--accent`, `--text`, `--surface`, `--space-4`, `--radius-md`, `--shadow`, etc.) instead of ad-hoc values. Components share consistent radius, shadow, and spacing.

4. **Screenshot to code** — Referenced the visual language of professional educational platforms (Khan Academy's serif body text, Stripe's settings panel, Linear's toggles) and translated those patterns into the redesign.

5. **Playwright CLI** — Used Playwright to:
   - Capture desktop, mobile, dark mode, and settings panel screenshots
   - Verify no AI-slop markers remain in the UI chrome
   - Verify h1 has no gradient background, body has no radial gradient blobs
   - Run a programmatic WCAG AA contrast audit on 9 key UI elements
   - Capture console errors (only the dead-code `toggleSoundEffects` warning, now silenced; remaining 403s are from external image hosts)
