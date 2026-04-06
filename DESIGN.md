# Design System Strategy: Radiant Haven

## 1. Overview & Creative North Star: "The Sanctuary Horizon"
This design system moves away from the clinical, cold aesthetic often found in institutional non-profits. Our Creative North Star is **"The Sanctuary Horizon"**—a digital experience that feels like the first light of dawn. 

We break the "standard template" look through **Tonal Layering** and **Intentional Asymmetry**. By using overlapping elements and organic depth, we create a space that feels protective yet breathable. This is not a grid of boxes; it is a series of safe, interconnected spaces. We prioritize "The Breath"—the generous use of white space—to ensure that users in high-stress situations feel a sense of immediate calm and clarity.

---

## 2. Colors: Light as a Narrative
Our palette avoids harsh contrasts. We use light not just as a background, but as a medium to guide the eye.

### Palette Tokens
*   **Primary (Soft Teal):** `#00696b` | The color of stability and healing.
*   **Secondary (Warm Gold):** `#7e5705` | The "Radiant" element representing hope and the sun.
*   **Surface/Background:** `#f8fafa` | A clean, slightly cooled white to prevent eye strain.

### The "No-Line" Rule
**Explicit Instruction:** Traditional 1px solid borders are strictly prohibited for sectioning. Boundaries must be defined solely through:
1.  **Background Color Shifts:** Use `surface-container-low` sections sitting on a `surface` background.
2.  **Tonal Transitions:** A shift from `surface` to `surface-container` creates a "room" without a "fence."

### The "Glass & Gradient" Rule
To elevate the UI beyond a standard flat look:
*   **Signature Textures:** Use subtle linear gradients for Hero sections and primary CTAs, transitioning from `primary` (`#00696b`) to `primary_container` (`#4ca6a8`) at a 135-degree angle. This adds a "soul" and depth that flat hex codes cannot achieve.
*   **Glassmorphism:** For floating navigation bars or emergency "Quick Exit" buttons, use `surface_container_lowest` at 80% opacity with a `24px` backdrop blur. This makes the UI feel integrated and modern.

---

## 3. Typography: The Editorial Voice
We utilize a dual-font system to balance authority with approachability.

*   **Display & Headlines (Plus Jakarta Sans):** Chosen for its modern, geometric clarity. The wide apertures feel welcoming and transparent.
    *   *Scale:* `display-lg` (3.5rem) for high-impact hopeful messaging; `headline-md` (1.75rem) for section titles.
*   **Body & Labels (Manrope):** A highly legible, contemporary sans-serif. It conveys a sense of "functional warmth."
    *   *Scale:* `body-lg` (1rem) for storytelling; `label-md` (0.75rem) for technical details.

**Hierarchy Strategy:** Use `on_surface_variant` (`#3e4949`) for body text to reduce the harshness of pure black, maintaining a "soft-focus" high-end editorial feel.

---

## 4. Elevation & Depth: Tonal Layering
We reject the heavy drop-shadows of the 2010s. Depth in this system is achieved through physical metaphors.

*   **The Layering Principle:** Stack your surfaces. Place a `surface_container_lowest` (pure white) card on a `surface_container_low` background. This creates a "natural lift" that feels like high-quality paper.
*   **Ambient Shadows:** If a floating element is required (e.g., a modal), use a shadow with a blur radius of `40px` at 6% opacity, tinted with the `primary` color. This mimics natural light passing through water or glass.
*   **The "Ghost Border" Fallback:** If a border is required for accessibility in forms, use `outline_variant` (`#bdc9c8`) at **15% opacity**. It should be felt, not seen.

---

## 5. Components: Softness & Intent

### Buttons
*   **Primary:** 135° Gradient (`primary` to `primary_container`). Large corner radius (`xl`: 1.5rem). High-end editorial buttons should have generous horizontal padding (2rem).
*   **Secondary:** Ghost style. No background, `primary` text, and a `Ghost Border` that only appears on hover.

### Cards (The "Sanctuary Card")
*   **Styling:** No borders. Use `surface_container_lowest`. Corner radius: `lg` (1rem). 
*   **Separation:** Forbid the use of divider lines. Separate content using `spacing-6` (1.5rem) of vertical white space.

### Inputs & Form Fields
*   **Visuals:** Soft teal labels (`primary`). Backgrounds should be `surface_container_high`. 
*   **States:** Error states use `error` (`#ba1a1a`) but must be accompanied by a soft `error_container` background fill to avoid looking "aggressive."

### Specialty Component: The "Safe-Exit" Toggle
*   A persistent, high-contrast button using `secondary_container` (`#ffc972`). It utilizes `Glassmorphism` to float above content, ensuring it is always reachable but doesn't obscure the narrative.

---

## 6. Do's and Don'ts

### Do:
*   **Do** use asymmetrical layouts where images overlap background color blocks.
*   **Do** use the `xl` (1.5rem) corner radius for main containers to evoke "softness."
*   **Do** prioritize high-quality, warm-toned photography of nature and light.
*   **Do** use `primary_fixed_dim` for subtle background accents.

### Don't:
*   **Don't** use 100% opaque black text; it is too clinical. Use `on_surface`.
*   **Don't** use 90-degree sharp corners; they represent "danger" in this context.
*   **Don't** use standard "Material Design" blue for links. Stick to the `primary` teal.
*   **Don't** clutter. If a screen feels full, increase the spacing scale and move content to a second "layer" or page.