# Design System Document: The Digital Conservatory

## 1. Overview & Creative North Star: "The Living Breath"
This design system moves away from the sterile, rigid nature of traditional IoT dashboards. Instead, it adopts a **"Plantation Cycle"** philosophy—an aesthetic that feels as though it were grown, not coded. 

The Creative North Star is **The Digital Conservatory**. We are creating a premium, editorial experience that mimics the atmospheric depth of a misty Bogor vegetable garden. The UI should feel tactile and organic, utilizing intentional asymmetry, sweeping curves, and high-contrast typography to elevate data from "information" to "art." We do not build grids; we cultivate layouts.

---

## 2. Color Philosophy: Soil & Sunlight
Our palette is rooted in the earth. We avoid "pure" blacks and "stark" whites, opting instead for tonal depth that feels warm and atmospheric.

### Tonal Tokens (Material Design 3 Convention)
*   **Primary (Pakcoy Green):** `#4be277` — Used for active growth states and "ON" statuses.
*   **Secondary (Deep Forest):** `#96d5a3` — Used for supplemental UI elements.
*   **Tertiary (River Blue):** `#8bcfff` — Reserved exclusively for water, irrigation, and humidity.
*   **Surface (Soil Dark Slate):** `#161311` — Our foundation. A warm, brownish-black that feels like fertile earth.

### The "No-Line" Rule
To maintain an organic feel, **explicitly prohibit 1px solid borders** for sectioning. Boundaries must be defined solely through:
1.  **Background Color Shifts:** Use `surface-container-low` vs. `surface-container-high` to define areas.
2.  **Tonal Transitions:** A card sitting on a background should be distinguished by its surface tier, not a stroke.

### The Glass & Gradient Rule
To move beyond a "flat" interface, use **Glassmorphism** for floating elements (e.g., a bottom navigation bar or a sticky header). 
*   **Value:** Use `surface-container` tokens at 80% opacity with a `20px` backdrop blur.
*   **Signature Textures:** Main CTAs should utilize a subtle linear gradient from `primary` to `primary-container` to simulate the natural sheen of a healthy leaf.

---

## 3. Typography: Editorial Authority
We use a high-contrast scale to create an "Editorial Journal" feel. Large, friendly headings meet precise, technical data.

*   **Headings (Plus Jakarta Sans):** Rounded and approachable. This conveys a "friendly expert" tone. Use `display-lg` (3.5rem) for hero metrics like temperature to make them the focal point of the page.
*   **Body & Data (Manrope):** Chosen for its technical clarity. Manrope’s geometric nature ensures that even small labels (`label-sm` at 0.6875rem) remain legible during high-precision monitoring.

**The Identity Logic:** 
By pairing the "soft" nature of Plus Jakarta Sans with the "precise" nature of Manrope, we communicate that this system is both easy to use and scientifically accurate.

---

## 4. Elevation & Depth: Tonal Layering
We do not use "shadows" in the traditional sense. We use **Tonal Layering** to represent growth and importance.

*   **The Layering Principle:** Depth is achieved by "stacking" surface tiers.
    *   **Level 0 (Background):** `surface` (`#161311`)
    *   **Level 1 (Sectioning):** `surface-container-low` (`#1e1b19`)
    *   **Level 2 (Cards):** `surface-container` (`#221f1d`)
    *   **Level 3 (Interactive Elements):** `surface-container-high` (`#2d2927`)
*   **Ambient Shadows:** If an element must "float" (like a Modal), use a shadow with a `48px` blur at `8%` opacity, tinted with the `primary` green color. This mimics natural light filtering through a canopy.
*   **The "Ghost Border":** If a boundary is required for accessibility, use the `outline-variant` token at **15% opacity**. Never use 100% opaque lines.

---

## 5. Component Guidelines

### Cards & Containers
*   **Geometry:** Use `xl` (3rem) or `lg` (2rem) corner radius. Elements should feel like river stones—smooth and weathered.
*   **Layout:** Forbid divider lines. Use vertical whitespace (1.5rem to 2rem) to separate content clusters.

### Large ON/OFF Toggles
*   **Style:** Oversized pill shapes with `full` roundedness.
*   **State:** When "ON," the toggle should use a `primary` to `primary-container` gradient. When "OFF," it should recede into `surface-container-highest`.
*   **Haptics:** Interaction should feel "heavy" and deliberate.

### Circular Gauges (Humidity/Moisture)
*   **Visual:** Avoid thin, spindly lines. Use thick, soft-ended strokes (12px width).
*   **Color:** Use `tertiary` (River Blue) for moisture levels to differentiate from growth metrics.

### Smooth Line Charts
*   **Aesthetic:** Use Catmull-Rom interpolation (curved lines) exclusively. 
*   **Fill:** Use a subtle gradient fill below the line, transitioning from `primary` at 20% opacity to `primary` at 0% opacity.

### Connection Pulse Dot
*   **Behavior:** A soft, breathing animation (4s duration). 
*   **Color:** `primary` for connected, `error` for disconnected. Add a soft glow effect using a `2px` blur of the same color.

---

## 6. Do's and Don'ts

### Do:
*   **Do** use extreme scale. Make a single temperature number massive and let the rest of the UI breathe.
*   **Do** use asymmetrical layouts. A card on the left does not always need a twin on the right.
*   **Do** prioritize "Finger-Friendly" touch targets. Every interactive element should have a minimum hit area of `48dp`.

### Don't:
*   **Don't** use "Information Density" as an excuse for clutter. If a screen feels busy, increase the whitespace.
*   **Don't** use pure greys. Every "neutral" in this system must have a warm, stone-like undertone.
*   **Don't** use sharp 90-degree corners. They feel "IT" and "Industrial." Everything in the garden is curved.
*   **Don't** use standard "Drop Shadows." Use tonal shifts to indicate hierarchy.