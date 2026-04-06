# Design System Strategy: The Radiant Guardian

## 1. Overview & Creative North Star
The Creative North Star for this system is **"The Radiant Guardian."** In the context of serving survivors in Santa Rosa de Copán, the UI must move beyond "nonprofit template" aesthetics. It must feel as secure as a sanctuary and as hopeful as the first light of dawn.

We achieve this through **Editorial Sanctuary Design**. This means breaking the rigid, boxed-in layouts of traditional software in favor of an expansive, breathable, and layered experience. We use intentional asymmetry—placing typography and imagery in a way that feels human and curated, rather than machine-generated. By prioritizing "The Radiant Guardian" ethos, we ensure the platform feels like a high-end, professional advocate for those it serves.

---

## 2. Colors & Surface Philosophy
The palette is rooted in the stability of the deep Honduran sky and the warmth of artisanal amber.

### The "No-Line" Rule
**Standard 1px borders are strictly prohibited for sectioning.** To define boundaries, we use "Tonal Carving." A section is defined by a shift from `surface` to `surface-container-low`, or by a subtle change in background hue. This creates a seamless, sophisticated flow that feels organic rather than clinical.

### Surface Hierarchy & Nesting
Treat the UI as a series of stacked, semi-translucent sheets. 
- **Base Level:** `surface` (#f8f9fa)
- **Content Blocks:** `surface-container-low` (#f3f4f5)
- **Interactive Elevated Cards:** `surface-container-lowest` (#ffffff) sitting atop a `surface-container` background.
- **Nesting:** Never place two containers of the same tone inside one another. Always shift one tier higher or lower to create a sense of physical depth.

### The "Glass & Gradient" Rule
To evoke "Hope" (the Lucero/Star), use **Signature Textures**. 
- **The Aurora Gradient:** Use a subtle linear gradient from `primary` (#003f87) to `primary_container` (#0056b3) for primary CTAs and hero backgrounds.
- **Glassmorphism:** For floating navigation or modal overlays, use `surface_container_lowest` at 80% opacity with a `24px` backdrop-blur. This keeps the user grounded in the context of the previous screen.

---

## 3. Typography: The Editorial Voice
We pair the structural authority of **Manrope** for displays with the hyper-legibility of **Inter** for functional data.

- **Display (Manrope):** Large, high-contrast scales (3.5rem) convey a sense of "Global Quality." Use `display-lg` for impactful testimonials or mission statements.
- **Body (Inter):** Set to `body-lg` (1rem) for most reading. The generous x-height of Inter ensures accessibility for users under stress.
- **The "Hero" Treatment:** Pair a `display-sm` headline with a `title-lg` subheader. Use a 1.5x line-height for all body text to maximize "breathing room."

---

## 4. Elevation & Depth: Tonal Layering
Traditional drop shadows are too "heavy" for a system meant to feel compassionate and light.

- **The Layering Principle:** Depth is achieved by "stacking" tones. A `surface-container-high` element should be the focal point of a `surface` page.
- **Ambient Shadows:** Only use shadows on floating elements (e.g., Modals). Use the `on_surface` color at 4% opacity with a 32px blur and 16px Y-offset. It should feel like a soft glow, not a hard shadow.
- **The "Ghost Border":** If accessibility requires a stroke (e.g., Input fields), use `outline_variant` (#c2c6d4) at **20% opacity**. It should be a suggestion of a border, not a fence.

---

## 5. Components

### Buttons: The Weighted Anchor
- **Primary:** Gradient fill (`primary` to `primary_container`), white text, `xl` (0.75rem) roundedness.
- **Secondary:** `secondary_container` fill with `on_secondary_container` text. No border.
- **Tertiary:** No fill, `primary` text. Use for low-priority actions like "Cancel" or "Learn More."

### Secure Form Elements
Forms are a point of vulnerability. They must feel calm and sturdy.
- **Input Fields:** Use `surface_container_low` as the fill. On focus, transition the background to `surface_container_lowest` and add a 1px `primary` ghost border.
- **Labels:** Always use `label-md` in `on_surface_variant`. Never hide labels inside inputs.
- **Validation:** Error states use `error` (#ba1a1a) text, but the input background should shift to `error_container` at 30% opacity to remain soft.

### Data Visualization: Hopeful Metrics
- **Progress Bars:** Use `secondary` (Teal) for the progress fill to represent "growth." The track should be `surface_container_highest`.
- **Charts:** Use a palette of `primary`, `secondary`, and `tertiary_fixed_dim` (Amber). Avoid red/green unless showing literal success/failure. Use rounded caps on all bar charts.

### Cards & Lists: The Open Layout
- **Cards:** Forbid divider lines. Use `xl` (0.75rem) corner radius. Separate "Card Header" from "Card Body" using a simple 24px vertical padding gap or a subtle color shift to `surface_container_lowest`.
- **Lists:** Use `surface_container_low` for hover states. Use `tertiary_fixed` as a tiny 4px vertical accent bar on the left side of a list item to indicate "New" or "Unread" items.

---

## 6. Do’s and Don'ts

### Do
- **Do** use geometric Central American patterns (e.g., Lenca-inspired) as extremely low-opacity watermarks (2-3%) in the background of `surface` containers.
- **Do** use `tertiary` (Amber) sparingly for "Success" or "Hope" moments—it should feel like a spark, not a flood.
- **Do** use `full` roundedness (9999px) for Chips and Tags to make them feel friendly and tactile.

### Don't
- **Don't** use pure black (#000000). Use `on_surface` (#191c1d) for all text to keep the contrast high but the "vibe" soft.
- **Don't** use standard 8px grids exclusively. Use a 12-column grid but intentionally "break" it by offsetting images or typography to create an editorial feel.
- **Don't** use "Alert Red" for everything. If something is a warning but not a system failure, use the `tertiary` (Amber) palette to remain compassionate.