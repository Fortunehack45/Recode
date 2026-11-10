---
name: non-ai-design-and-writing
description: Master framework for crafting authentic, human-designed websites and compelling, non-AI copy. Eliminates generic AI design slop (purple gradients, 3D clay orbs, centered 3-card grids, Inter font defaults) and algorithmic writing tropes (delve, robust, seamless, tapestry, not just X but Y).
---

# Authentic Human Web Design & Copywriting (Anti-AI-Slop Framework)

This skill provides an authoritative, comprehensive standard for engineering distinctive, human-crafted websites and voice-driven, authentic copy that decisively breaks away from algorithmic "AI slop."

---

## 1. The Anatomy of "AI Slop" vs. Human Craftsmanship

AI-generated websites look superficially polished but are fundamentally interchangeable, sterile, and soulless. When crafting websites or writing copy, run every decision through this contrast matrix:

| Element | The AI Slop Default (BANNED) | The Authentic Human Alternative (MANDATORY) |
|---|---|---|
| **Typography** | Ubiquitous *Inter* or *Geist* across all weights; safe, medium-contrast sizes ($16\text{px} / 24\text{px} / 48\text{px}$). | **Extreme scale contrast**: Massive editorial serif or brutalist grotesque headlines ($96\text{px} - 120\text{px}$) paired with tiny, precise monospaced metadata labels ($11\text{px} - 13\text{px}$). |
| **Hero Section** | Centered text, floating pill badge (`✨ Introducing v2.0`), blurry purple-to-blue background glow orb, tilted 3D dashboard screenshot. | **Asymmetric editorial layout**: Left-anchored or split-screen narrative, stark backgrounds, exposed gridlines, real typographic authority, zero pill badges. |
| **Feature Layout** | Symmetrical 3-card grid with rounded corners, subtle glassmorphism borders, identical icon circles, and 2-line descriptions. | **Dynamic editorial rhythm**: Varied container widths, asymmetrical bento blocks tailored to actual content, alternating full-width text strips and high-density tables. |
| **Visual Assets** | Sterile 3D glass shapes, floating clay hands, generic vector illustrations of people high-fiving clouds, smoothed AI portraits. | **Tactile & documentary media**: High-grain photography, raw technical schematics, exposed SVG borders, analog paper textures, or stark typographic art. |
| **Tone & Voice** | *"In today's fast-paced world, our robust platform empowers seamless synergy..."* | *"We killed 80% of our meetings and automated the rest. Here is the exact script we used."* |
| **Formatting** | Random mid-sentence bolding, endless em-dashes (`—`), compulsive rule-of-three bullet lists, robotic summary conclusions. | Natural conversational punctuation, varied sentence cadence, strong opinionated viewpoints, concrete numbers. |

---

## 2. Web Design Architecture: The Anti-AI-Slop Styling Guide

### 1. Typography with Point of View
Never use generic neutral grotesques as your sole font. Introduce intentional aesthetic tension by pairing a literary serif with an industrial monospace:

```css
/* Authentic Editorial Typography Pairing */
@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;600&family=Plus+Jakarta+Sans:wght@400;500;700&display=swap');

:root {
  --font-display: 'Instrument Serif', Georgia, serif;
  --font-body: 'Plus Jakarta Sans', -apple-system, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
  
  /* Dramatic Scale Ratio */
  --text-hero: clamp(3.5rem, 8vw + 1rem, 7.5rem);
  --text-meta: 0.75rem;
}

.hero-headline {
  font-family: var(--font-display);
  font-size: var(--text-hero);
  font-weight: 400;
  line-height: 0.95;
  letter-spacing: -0.03em;
  text-wrap: balance;
}

.metadata-label {
  font-family: var(--font-mono);
  font-size: var(--text-meta);
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--text-muted);
}
```

### 2. Exposed Structural Grids & Deliberate Borders
Instead of hiding content behind soft floating drop-shadows and blurred backdrop-filter orbs, reveal the architectural skeleton with crisp lines and tactile grid rules:

```css
/* Brutalist / Architectural Structural Grid */
.editorial-grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  border-top: 1px solid var(--border-line);
  border-bottom: 1px solid var(--border-line);
}

.editorial-col-main {
  grid-column: span 8;
  padding: 3rem 2.5rem;
  border-right: 1px solid var(--border-line);
}

.editorial-col-sidebar {
  grid-column: span 4;
  padding: 3rem 2rem;
  background-color: var(--surface-offset);
}
```

### 3. Tactile Color Palettes
Banish the "AI SaaS" color scheme (`#7c3aed` purple and `#2563eb` blue gradient). Embrace authentic editorial palettes:
- **Warm Archival Paper**: Base `#fbf9f5`, Ink `#1a1918`, Accent `#c2410c` (Rust/Terracotta) or `#0f766e` (Deep Forest).
- **Industrial Monochrome**: Base `#09090b`, Off-surface `#18181b`, Rule lines `#27272a`, Ink `#fafafa`, Accent `#e11d48` (Crimson indicator).

---

## 3. The Anti-AI Copywriting Playbook

### 1. The Banned Vocabulary & Cliches List
Whenever drafting website headlines, hero paragraphs, or button text, **ruthlessly delete** these words:

- **Banned Verbs**: *Delve, dive deep, unlock, unleash, elevate, harness, foster, catalyze, empower, revolutionize, maximize*.
- **Banned Adjectives**: *Robust, seamless, cutting-edge, state-of-the-art, transformative, pivotal, groundbreaking, innovative, meticulous, testament*.
- **Banned Fluff Nouns**: *Tapestry, beacon, realm, landscape, paradigm, synergy, ecosystem, journey, game-changer*.
- **Banned Openers**: *"In today’s fast-paced world..."*, *"It’s important to remember..."*, *"At its core..."*, *"Furthermore / Moreover / Additionally"*.
- **Banned Syntactic Patterns**:
  - The *"Not just X, but Y"* cliché (*"It's not just an IDE; it's a creative partner"*).
  - The compulsive *"Rule-of-Three"* triplet (*"Speed, simplicity, and scale"*).
  - The high school essay ending (*"Ultimately, the choice is yours"*).

---

### 2. Concrete Copywriting Transformations

#### Hero Section Transformation:
- ❌ **AI Slop**: *"In today's fast-paced digital ecosystem, our cutting-edge IDE empowers developers to unlock unprecedented productivity through seamless AI synergy."*
- ✅ **Human Voice**: *"Most editors choke when a repository crosses 100,000 files. Recode boots in 12 milliseconds, consumes 80MB of RAM, and never drops below 120 FPS."*

#### Feature Section Transformation:
- ❌ **AI Slop**: *"A robust testament to transformative security, harnessing meticulous encryption to foster absolute user trust."*
- ✅ **Human Voice**: *"All secrets are encrypted with ChaCha20-Poly1305 and locked behind OS keychains. Not even our servers can read your code."*

#### Call to Action (CTA) Transformation:
- ❌ **AI Slop**: *"Embark on your journey today and revolutionize your workflow."*
- ✅ **Human Voice**: *"Download Recode for Windows. Free, zero account required."*

---

### 3. The Rhythm & Cadence Formula
Human thought has natural musicality: short, sharp statements contrasting with detailed explanations.

```markdown
Bad (Uniform AI Cadence):
Recode is built with Rust for superior performance. It optimizes memory allocations 
to ensure your editor remains fast. You can customize every keybinding with ease. 
The settings will adapt to your needs seamlessly.

Good (Human Cadence & Staccato Contrast):
Speed is not a feature. It is the feature. 
When your editor lags by even 50 milliseconds, your train of thought shatters. 
That's why Recode is written in bare-metal Rust—no Electron, no web views, 
no garbage collection pauses. Just raw GPU-accelerated frame buffers.
```

---

## 4. Anti-AI-Slop Verification Checklist

Before publishing any webpage layout or website copy:
- [ ] **No Generic Pill Badge**: Erased any `✨ Introducing AI` badges floating atop headlines.
- [ ] **No Gradient Glow Orbs**: Removed blurry purple/blue CSS background glow circles.
- [ ] **No 3-Card Clones**: Avoided generic 3-column identical card rows; adapted grid to real content weight.
- [ ] **Typographic Character**: Display headings use a distinct serif or expressive typeface with deliberate letter-spacing.
- [ ] **Banned Words Scrubbed**: Scanned for *delve*, *robust*, *seamless*, *empower*, *tapestry*, *unlock*.
- [ ] **Zero "Not Just X, But Y"**: Rewritten into direct, punchy declarative statements.
- [ ] **Real Facts & Numbers**: Replaced vague corporate claims with concrete metrics, benchmarks, or guarantees.
