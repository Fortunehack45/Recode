---
name: frontend
description: Master-level frontend architecture and browser engineering. Covers browser rendering pipelines, compositor thread optimization, avoiding layout thrashing, state machine architectures (XState), SSR/SSG/ISR hydration, Web Workers, and WebAssembly (WASM).
---

# Frontend Architecture & Browser Rendering Engineering

This skill provides exhaustive guidance on engineering blisteringly fast, responsive client applications, understanding browser engine internals (Blink, Gecko, WebKit), and architecting maintainable reactive state systems.

---

## 1. Browser Engine Internals & Compositor Thread Optimization

### The 5-Phase Browser Pipeline:
1. **DOM & CSSOM Construction**: Parsing HTML tokens and CSS rules into object models.
2. **Render Tree Generation**: Combining DOM and CSSOM, computing layout-visible nodes (excluding `display: none`).
3. **Layout (Reflow)**: Calculating exact geometric bounds and pixel coordinates ($x, y, w, h$) for every box.
4. **Paint**: Generating display lists and drawing instructions for text, colors, images, borders, and shadows.
5. **Composite**: Rasterizing layers and sending textures to the GPU.

### Hardware-Accelerated CSS Properties
Only two CSS properties can be animated strictly on the **Compositor thread** with zero CPU layout or repaint:
- `transform` (translates, scales, rotations in 3D: `translate3d(x, y, 0)`)
- `opacity`

Animating `top`, `left`, `margin`, `padding`, `width`, or `height` forces synchronous CPU recalculation of layout for the entire document subtree, causing frame drops below 60fps.

---

## 2. Layout Thrashing (Forced Synchronous Layout) Prevention

Layout thrashing occurs when JavaScript writes to DOM styles and immediately reads layout geometry in a loop, forcing the browser to recompute layout on every iteration:

```javascript
// BAD: Forces layout recalculation on every single iteration!
for (let i = 0; i < elements.length; i++) {
  const width = elements[i].offsetWidth; // READ forces layout
  elements[i].style.width = `${width + 10}px`; // WRITE invalidates layout
}

// GOOD: Batch all reads first, then batch all writes in requestAnimationFrame
const widths = elements.map(el => el.offsetWidth); // Batch READs
requestAnimationFrame(() => {
  elements.forEach((el, i) => {
    el.style.width = `${widths[i] + 10}px`; // Batch WRITEs
  });
});
```

---

## 3. Web Workers & OffscreenCanvas

Offload CPU-intensive parsing (e.g., AST parsing, syntax highlighting, image filters) away from the main UI thread:

```javascript
// worker.js
self.onmessage = (event) => {
  const { code, grammar } = event.data;
  const highlightedTokens = parseAndHighlight(code, grammar);
  self.postMessage(highlightedTokens);
};

// main.js
const highlighterWorker = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' });
highlighterWorker.postMessage({ code: sourceCode, grammar: 'rust' });
highlighterWorker.onmessage = (e) => {
  renderHighlightedTokens(e.data);
};
```

---

## 4. Frontend Engineering Checklist

- [ ] **Bundle Budget**: Verify initial compressed JavaScript payload remains $< 150\,\text{KB}$ gzipped.
- [ ] **Code Splitting**: Dynamic imports (`import()`) applied to routes, heavy dialogs, and non-critical editor views.
- [ ] **Event Listener Cleanup**: Guarantee all `addEventListener` calls have matching `removeEventListener` inside unmount handlers.
- [ ] **Hydration Mismatch Defense**: Avoid browser-only values (`window.innerWidth`, `new Date()`) during initial SSR markup render.
