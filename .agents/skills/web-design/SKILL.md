---
name: web-design
description: Production-grade modern web design and architecture. Covers CSS Grid/Subgrid layout patterns, Container Queries, fluid typography and spacing formulas, View Transitions API, performance optimization, and Core Web Vitals (LCP, INP, CLS).
---

# Web Design Engineering & Modern CSS Architecture

This skill provides exhaustive guidance on engineering responsive, performant, visually immaculate web interfaces using cutting-edge standards (CSS Grid Subgrid, Container Queries, OKLCH, View Transitions, Core Web Vitals).

---

## 1. Modern Responsive Architecture: Container Queries & Subgrid

### Container Queries (`@container`)
Never rely solely on viewport media queries (`@media (min-width: ...)`). Elements should adapt based on their parent context rather than the global browser window:

```css
.card-wrapper {
  container-type: inline-size;
  container-name: card-container;
}

.card {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

@container card-container (min-width: 480px) {
  .card {
    display: grid;
    grid-template-columns: 140px 1fr;
    align-items: center;
  }
}

@container card-container (min-width: 768px) {
  .card {
    grid-template-columns: 220px 1fr auto;
    padding: 1.5rem;
  }
}
```

### CSS Grid & Subgrid Alignment
Align nested elements across child cards with `grid-template-rows: subgrid`:

```css
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}

.card {
  display: grid;
  grid-row: span 3;
  grid-template-rows: subgrid;
  background: var(--surface-card);
  border-radius: 12px;
  padding: 1.25rem;
}

/* Header, body text, and footer buttons align horizontally across all adjacent cards */
.card-header { grid-row: 1; }
.card-body   { grid-row: 2; }
.card-footer { grid-row: 3; align-self: end; }
```

---

## 2. Mathematical Fluid Typography & Spacing Formulas

### Pure Mathematical Fluid Scaling with `clamp()`
Eliminate rigid breakpoint step-functions. Calculate continuous fluid scaling between a minimum viewport ($375\text{px}$) and a maximum viewport ($1440\text{px}$):

$$\text{Slope} = \frac{\text{Max Size} - \text{Min Size}}{\text{Max Viewport} - \text{Min Viewport}}$$
$$\text{Preferred Value} = (\text{Slope} \times 100)\text{vw} + (\text{Min Size} - \text{Slope} \times \text{Min Viewport})$$

#### Fluid CSS Token Implementation:
```css
:root {
  /* Fluid Body: 16px at 375px viewport -> 19px at 1440px viewport */
  --font-body: clamp(1rem, 0.9472rem + 0.2817vw, 1.1875rem);

  /* Fluid H1: 32px at 375px viewport -> 56px at 1440px viewport */
  --font-h1: clamp(2rem, 1.4366rem + 2.4085vw, 3.5rem);

  /* Fluid Section Spacing: 32px at 375px -> 96px at 1440px */
  --space-section: clamp(2rem, 0.4930rem + 6.4225vw, 6rem);
}
```

---

## 3. View Transitions API & Smooth Native-Feeling Navigation

Leverage the native View Transitions API for seamless single-page and multi-page document transitions without heavy client-side animation libraries:

```javascript
// Single-Page Application Transition
function navigateToArticle(url) {
  if (!document.startViewTransition) {
    updateDOM(url);
    return;
  }

  document.startViewTransition(async () => {
    await updateDOM(url);
  });
}
```

```css
/* Morphing Named Elements */
.hero-image-thumbnail {
  view-transition-name: article-hero;
}

/* In the destination view */
.article-full-hero {
  view-transition-name: article-hero;
}

::view-transition-old(article-hero),
::view-transition-new(article-hero) {
  animation-duration: 350ms;
  animation-timing-function: cubic-bezier(0.2, 0, 0, 1);
}
```

---

## 4. Core Web Vitals Optimization (LCP, INP, CLS)

### 1. Largest Contentful Paint (LCP) $\le 2.5\text{s}$
- **Preload Critical Hero Assets**:
  ```html
  <link rel="preload" as="image" href="/hero.webp" fetchpriority="high" type="image/webp">
  ```
- **Eliminate Render-Blocking CSS/Fonts**: Use `font-display: swap` and inline critical CSS for above-the-fold content.
- **Modern Image Formats**: Serve AVIF or WebP images with responsive `srcset` and `sizes` attributes.

### 2. Interaction to Next Paint (INP) $\le 200\text{ms}$
- **Yield to Main Thread**: Break long tasks ($> 50\text{ms}$) using `scheduler.yield()` or `requestAnimationFrame`:
  ```javascript
  async function processLargeList(items) {
    for (const item of items) {
      processChunk(item);
      if (needYield()) {
        await scheduler.yield?.() || new Promise(resolve => setTimeout(resolve, 0));
      }
    }
  }
  ```
- **Avoid Synchronous Layout Thrashing**: Never interleave DOM style mutations and measurement reads (`offsetWidth`, `getBoundingClientRect()`).

### 3. Cumulative Layout Shift (CLS) $\le 0.1$
- **Always Declare Explicit Aspect Ratio / Dimensions**:
  ```css
  img, video, iframe {
    width: 100%;
    height: auto;
    aspect-ratio: 16 / 9;
  }
  ```
- **Reserve Layout Space for Dynamic Content**: Never insert banners or ads above rendered content without reserving placeholder min-height.

---

## 5. Web Design Engineering Checklist

- [ ] **Semantic Markup**: Uses `<main>`, `<article>`, `<section>`, `<nav>`, `<aside>`, `<header>`, `<footer>`.
- [ ] **Dark Mode & Contrast Support**: Configured via `color-scheme: light dark` and `@media (prefers-color-scheme: dark)`.
- [ ] **Fluid Typography**: Body, headings, and padding scale with math clamp functions.
- [ ] **Responsive Fallbacks**: Grid uses `repeat(auto-fit, minmax(...))` without hardcoded widths.
- [ ] **Accessibility Compliance**: Semantic buttons (never `<div onClick>`), explicit ARIA attributes where needed, high-contrast outlines for `:focus-visible`.
