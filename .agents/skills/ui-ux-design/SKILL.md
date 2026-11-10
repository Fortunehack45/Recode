---
name: ui-ux-design
description: Master-level UI and UX design engineering. Covers design token systems, optical alignment, WCAG 2.2 AAA accessibility, micro-interactions, layout grids, visual hierarchy, cognitive load reduction, and user interaction mechanics.
---

# UI & UX Design Engineering

This skill provides comprehensive, production-grade instructions for designing world-class user interfaces and frictionless user experiences. Apply these principles whenever crafting screens, interactive components, design tokens, micro-interactions, accessibility hierarchies, or user workflows.

---

## 1. Mathematical Foundations & Spatial Grid Systems

### 8pt/4pt Spatial Grid System
All margins, paddings, line heights, and container dimensions must align to an 8pt base grid, with a 4pt half-step for micro-spacing (e.g., icons inside pills, button padding, tag badges).

- **Micro-steps**: `2px` (sub-pixel hairpins/borders), `4px` (tight token groupings, badge margins)
- **Base increments**: `8px`, `16px`, `24px`, `32px`, `48px`, `64px`, `96px`, `128px`
- **Never use arbitrary values**: Avoid `7px`, `13px`, `23px`. If an element does not align to 4/8 multiples, the rhythm collapses visually.

### Optical Alignment vs. Geometric Alignment
Geometric center often deviates from human perceptual center:
- **Play Buttons / Triangles**: In an equilateral triangle pointing right, the centroid is at $1/3$ from the base ($2/3$ from the apex). To appear optically centered inside a circle, nudge the icon horizontally to the right by $(1/6 \times \text{width})$.
- **Cap-Height Alignment**: When aligning icons with text, center the icon bounding box against the font's **cap-height**, not the full font line-box (which includes ascenders, descenders, and leading).
- **Curved Shapes & Rounded Borders**: Circles and curves visually appear smaller than squares of the exact same pixel bounding box. Add an optical overshoot of 1% to 2% to circular elements when paired adjacent to hard rectangular blocks.

---

## 2. Color Science & Contrast Engineering

### Perceptual Color Spaces (OKLCH & APCA)
- Never interpolate or grade UI palettes in sRGB space (sRGB produces muddy desaturated browns and perceptual lightness shifts between yellow and blue).
- Always use **OKLCH** (`oklch(L C H)`) or **Oklab** for UI color systems:
  - $L$ (Perceived Lightness: 0% to 100%): Keeps perceptual luminance uniform across hues.
  - $C$ (Chroma): Intensity/saturation. Keep neutral surfaces below `0.02` chroma.
  - $H$ (Hue: 0 to 360°): Rotational color spectrum.

### Contrast Compliance & WCAG 2.2 Standards
- **Level AA Minimums**:
  - Normal text (< 18pt or < 14pt bold): Minimum **4.5:1** contrast ratio.
  - Large text ($\ge$ 18pt or $\ge$ 14pt bold): Minimum **3.0:1** contrast ratio.
  - UI components, icons, inputs, and active borders: Minimum **3.0:1** contrast ratio.
- **Level AAA Standards**:
  - Normal text: **7.0:1** contrast ratio.
  - Large text: **4.5:1** contrast ratio.
- **APCA (Advanced Perceptual Contrast Algorithm)**:
  - Body text: Minimum $L_c \ge 75$.
  - Fluent heading text: Minimum $L_c \ge 60$.
  - Non-text controls and icons: Minimum $L_c \ge 45$.

### Semantic Palette Architecture
Define every surface and element by semantic tokens, never raw hex:
1. `surface-canvas`: Background behind everything.
2. `surface-subtle`: Grouping cards, subtle list items, unfocused fields.
3. `surface-elevated`: Floating modals, dropdown menus, context menus.
4. `border-subtle` / `border-bold`: Divider lines vs. active focus boundaries.
5. `text-primary` / `text-secondary` / `text-muted`: Contrast tiers ($100\%$, $75\%$, $50\%$ perceptual lightness delta).
6. `accent-primary` / `accent-hover` / `accent-active`: Main interactive actions.
7. `status-success`, `status-warning`, `status-danger`, `status-info`: System alerts.

---

## 3. Typographic Hierarchy & Modular Scales

### Modular Typographic Ratio
Base your scale on a strict ratio (e.g., Major Third $1.250$ or Perfect Fourth $1.333$):

$$\text{Size}_n = \text{Base} \times (\text{Ratio})^n$$

Using Base $16\text{px}$ with Ratio $1.250$:
- **Caption / Footnote**: $12\text{px}$ / line-height $16\text{px}$ ($1.33$)
- **Body Small**: $14\text{px}$ / line-height $20\text{px}$ ($1.42$)
- **Body Standard**: $16\text{px}$ / line-height $24\text{px}$ ($1.50$)
- **Heading 4 / Subtitle**: $20\text{px}$ / line-height $28\text{px}$ ($1.40$)
- **Heading 3**: $25\text{px}$ / line-height $32\text{px}$ ($1.28$)
- **Heading 2**: $31\text{px}$ / line-height $38\text{px}$ ($1.22$)
- **Heading 1 / Display**: $39\text{px}$ / line-height $46\text{px}$ ($1.18$)

### Line-Height & Measure Rules
- **Measure (Line Length)**: Optimum reading line length is **45 to 75 characters per line** (including spaces). Around 66 characters is ideal. Never let body text span unbounded full-width desktop monitors.
- **Inverse Proportionality Rule**: As font size increases, line-height multiplier must decrease (e.g., display headings need $1.1 - 1.2$, while body text requires $1.4 - 1.6$).
- **Letter Spacing (Tracking)**: Larger display sizes need negative tracking ($-0.02\text{em}$ to $-0.03\text{em}$), whereas small captions and uppercase text require expanded positive tracking ($+0.04\text{em}$ to $+0.08\text{em}$).

---

## 4. Interaction Physics & Micro-Interactions

### Spring Dynamics & Natural Motion Curves
- **Standard Cubic Bézier Curves**:
  - Enter / Pop-in: `cubic-bezier(0.16, 1, 0.3, 1)` (Fluid exponential decel, duration $200 - 300\text{ms}$).
  - Exit / Collapse: `cubic-bezier(0.7, 0, 0.84, 0)` (Accelerated exit, duration $150 - 200\text{ms}$).
  - Standard ease: `cubic-bezier(0.2, 0, 0, 1)`.
- **Damping Ratios ($\zeta$) in Physics Springs**:
  - $\zeta = 1.0$ (Critical Damping): Reaches target swiftly with zero overshoot (ideal for modals, drawers).
  - $\zeta = 0.7 - 0.8$ (Slight Underdamping): Natural organic spring with subtle snap (ideal for toggle switches, buttons, tabs).
  - Never allow $\zeta < 0.5$ in UI, as excessive oscillating bounces induce user nausea and visual delay.

### Response Time Thresholds (Nielsen-Norman Scale)
- **$0.1\text{s}$ ($100\text{ms}$)**: The threshold for feeling instantaneous. Hover effects, active states, keypress updates must respond within $100\text{ms}$.
- **$1.0\text{s}$ ($1000\text{ms}$)**: The upper limit for a user's flow of thought. If an operation takes $> 1\text{s}$, show a subtle progress indicator or inline spinner.
- **$> 10\text{s}$**: Focus is completely lost. Require asynchronous background workers, explicit percentage progress bars, and push notifications upon completion.

---

## 5. Information Architecture & Cognitive Friction

### Hick's Law & Progressive Disclosure
The time it takes to make a decision increases logarithmically with the number and complexity of choices:

$$T = b \cdot \log_2(n + 1)$$

- **Rule**: Never present more than $5 \pm 2$ primary action choices simultaneously.
- **Progressive Disclosure**: Keep default views clean and focused on 80% tasks. Place advanced configurations, power-user toggles, and secondary fields behind contextual expanders, tabs, or "Advanced Settings".

### Fitts's Law for Target Acquisition
The time required to rapidly move to a target area is a function of the ratio between the distance to the target and the width of the target:

$$\text{MT} = a + b \cdot \log_2\left(2\frac{D}{W}\right)$$

- **Touch Targets**: Minimum $48 \times 48\text{px}$ (Android/Material) or $44 \times 44\text{pt}$ (Apple HIG) with at least $8\text{px}$ separation between interactive edges.
- **Edge Affinity**: Screen boundaries and corners possess "infinite depth" because the mouse cursor cannot move past the border. Pin high-frequency actions (like window close, dock items, drawer tabs) to viewport edges.

---

## 6. Implementation Checklist

When authoring or evaluating any UI component:
- [ ] **Contrast Verification**: Primary text $\ge 7:1$, secondary $\ge 4.5:1$, interactive borders $\ge 3:1$.
- [ ] **Touch/Click Bounds**: Target footprint is at least $44\text{px}$, with explicit hover, focus-visible, and active/pressed feedback states.
- [ ] **Keyboard Navigability**: Full traversal via `Tab` / `Shift+Tab`, visual focus ring with high contrast and outline-offset ($2\text{px}$).
- [ ] **Reduced Motion**: Respects `@media (prefers-reduced-motion: reduce)` by disabling spring animations and falling back to instantaneous or simple opacity cross-fades ($100\text{ms}$).
- [ ] **Defensive Text Layout**: Handles variable content length without overflow, utilizing `text-overflow: ellipsis`, auto-wrapping, or scroll anchors.
