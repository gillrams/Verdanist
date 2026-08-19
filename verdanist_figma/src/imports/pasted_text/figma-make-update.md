Benar — prompt sebelumnya **dark sebagai default** dan light hanya disebut singkat. Berikut **tambahan + versi prompt yang diperbarui** untuk Figma Make: **light mode lengkap semua halaman**, **toggle gelap/terang di setiap halaman**, dan **splash animasi logo** sebelum Welcome.

---

## Prompt tambahan (salin ke Figma Make)

Bisa ditambahkan di akhir prompt lama, atau pakai sebagai prompt utama:

```
# UPDATE WAJIB — LIGHT MODE + SPLASH + TOGGLE GLOBAL

Extend the Verdanist × Superbank UX system with THREE mandatory requirements below. Apply to EVERY screen in the file (all 14+ flows). No screen may be dark-only.

---

## A. SPLASH SCREEN (APP OPENING) — Frame 0

**Route flow:** Splash → Welcome (Mulai Sekarang)

**Frame:** 390×844 mobile (also 1440×900 optional brand moment desktop)

**Screen name:** `00 — Splash / Logo Opening`

**Layout:**
- Full viewport, NO navigation, NO bottom nav, NO scroll
- Centered Verdanist logo (Fredoka wordmark + icon if available)
- Background: LIGHT mode default #F4F7F0 soft gradient to #E8F5E9 OR animated subtle radial green glow
- Optional tagline micro: "AUTOMATION FOR EVERY FARM" fade-in below logo

**Animation spec (design as 3–4 prototype frames OR Smart Animate sequence, total duration 2.0–2.8s):**
1. **Frame 1 (0ms):** Logo scale 0.6, opacity 0, background solid/gradient
2. **Frame 2 (400ms):** Logo scale 1.05, opacity 1 — ease-out spring (slight overshoot like iOS/Android splash)
3. **Frame 3 (1200ms):** Logo scale 1.0, hold; optional lime (#C8FF00) pulse ring behind logo (opacity 0 → 30% → 0)
4. **Frame 4 (2200ms):** Logo + tagline fade out OR slide up slightly; transition dissolve to Welcome screen

**Auto-advance:** After animation completes → navigate to Welcome `/` (no tap required). Optional: tap to skip (small "Lewati" text bottom, 12px, white/40 dark or gray/50 light)

**States to design:**
- Splash LIGHT
- Splash DARK (same animation, bg #0B0F0A, logo light variant)

**Do NOT** show Get Started button on splash — only logo moment.

---

## B. LIGHT MODE — COMPLETE FOR ALL PAGES

Design **every screen in both themes** with equal polish. Light mode is NOT an afterthought.

### Light mode tokens (use consistently)

| Token | Value |
|-------|--------|
| Page bg | #F4F7F0 → #EEF6F0 gradient |
| Card surface | #FFFFFF 100% |
| Card border | #E2EDE4 |
| Text primary | #0B0F0A |
| Text secondary | #5C6B5C |
| Accent CTA | #B8F000 / #C8FF00 (lime unchanged) |
| CTA text on lime | #0B0F0A |
| Input bg | #FFFFFF, border #D8E5DA |
| Shadow | 0 12px 40px rgba(13,61,42,0.08) |
| Bottom nav pill | white 90% + blur, border #E2EDE4 |
| Sidebar desktop | #FFFFFF, border #E2EDE4 |
| Chart grid | #E8EFE9 |
| Danger/Admin | #EF4444 unchanged |

### Dark mode tokens (existing spec)

| Page bg | #0B0F0A → #1A2E1A |
| Card | #1C241C |
| Text | #FFFFFF / 55% white |

### Per-screen light mode checklist (MUST deliver variants)

Create paired frames: `[Screen Name] — Light` and `[Screen Name] — Dark`

1. Splash (logo opening)
2. Welcome — Mulai Sekarang
3. Farm Selection
4. Farm Application (+ success)
5. Farm Access (token)
6. Login
7. Register
8. Welcome Guest
9. About (Privacy/API)
10. Dashboard / Command Center
11. Analytics
12. Logs
13. Settings
14. Admin (all 3 tabs: Kebun, Pengguna, Sistem)
15. All modals: Timer, Pump Settings, AI Assistant, Alert Dialog
16. Empty / Loading / Error states for Farm list & Logs (light + dark)

**Light mode rules:**
- Hero illustrations: keep full color, no heavy dark overlay on Welcome
- Glass effect → replace with **solid white cards** + soft shadow (readable in sunlight)
- Lime accent stays identical in both modes for brand consistency
- Charts: temp line #15803D or lime #9BCF00 on light; humidity fill blue 20% opacity
- Status chips: pastel bg (green-50, amber-50, red-50) with dark text on light mode

---

## C. THEME TOGGLE — ON EVERY PAGE

**Component:** `ThemeToggle` — required in global header zone on ALL screens.

### Placement rules

| Context | Position |
|---------|----------|
| Splash | NO toggle (follows system or default light until Welcome) |
| Welcome, Farms, Apply, Access, Login, Register, Guest, About | **Top-right fixed**, 44×44 tap target, below status bar safe area (y: 54px) |
| App shell (Dashboard, Analytics, Logs, Settings, Admin) | **Top-right of main content header row**, beside profile/AI icons OR in sidebar footer on desktop |
| Modals | Toggle in modal header right (or inherits app shell header visible behind) |

### Toggle design (both themes)

- Control type: **pill switch** or **sun/moon icon button** with clear state
- Icons: Material `light_mode` / `dark_mode`
- Light mode active: moon icon gray, tap → dark
- Dark mode active: sun icon lime tint, tap → light
- Optional micro-label on Settings only: "Tema Gelap" sync with same component
- **Persist state:** annotate "saved to localStorage / user preference" for dev handoff

### Component variants in library

- ThemeToggle / Light-active
- ThemeToggle / Dark-active
- ThemeToggle / on-dark-header
- ThemeToggle / on-light-header

### Prototype behavior

Link toggle on every page to **variant swap** or **variable mode** so designers can demo full app in light OR dark without rebuilding flows.

---

## D. UPDATED USER FLOW (prototype links)

```
Splash (2.5s auto) 
  → Welcome [toggle top-right]
    → Farm Selection [toggle]
      → Farm Access OR Farm Apply
        → Login / Register
          → Welcome Guest (if guest) OR Dashboard [toggle in header]
            → Analytics | Logs | Settings | Admin [toggle each]
```

Every arrow above must have **light and dark frame** endpoints.

---

## E. FIGMA FILE ORGANIZATION

Add pages:
- `00 — Splash & Welcome`
- `Light Mode — Full App` (all screens)
- `Dark Mode — Full App` (all screens)
OR use Figma variables: `theme/light` `theme/dark` with mode switch on all components

**Deliverable count example:** 16 screens × 2 themes = **32 main frames** + splash animation frames + modals × 2 = **40+ frames minimum**

---

## F. ANNOTATION FOR DEVELOPERS

- Splash duration: 2500ms default, skippable at 800ms+
- Theme default on first install: **Light** (Indonesia outdoor/field readability)
- Respect `prefers-color-scheme` optional; manual toggle overrides
- Toggle component: single shared React component in top bar layout
- CSS: `class="dark"` on html root (Tailwind pattern)

---

## G. COPY UPDATE (Welcome after splash)

Welcome headline unchanged. Primary CTA text: **"Mulai Sekarang"** (not Get Started in UI — Indonesian only).

First paint after splash: Welcome **Light** frame as default prototype start (toggle visible top-right).

Generate splash animation frames first, then Light mode full pass for all pages, then duplicate/adapt to Dark mode with toggle in identical positions on every screen.
```

---

## Ringkasan isi ide (yang Anda minta)

| Permintaan Anda | Isi di prompt |
|-----------------|---------------|
| Mode terang sempurna | Token light lengkap + **setiap halaman** punya frame Light & Dark |
| Toggle di semua halaman | Komponen `ThemeToggle` kanan atas (kecuali Splash); juga di modal & app shell |
| Animasi logo pembuka | Layar **Splash** 2–2.8 detik → auto ke Welcome → baru **Mulai Sekarang** |
| Default | Bisa diarahkan **Light** dulu (mudah dibaca di lapangan) |

---

## Urutan kerja di Figma Make (disarankan)

1. Splash animasi (4 frame Smart Animate)  
2. Welcome Light + toggle  
3. Duplikasi ke Dark  
4. Onboarding + Auth (Light/Dark berpasangan)  
5. App shell + 5 menu utama (Light/Dark)  
6. Modals & states  

Kalau mau, saya bisa gabungkan jadi **satu prompt utuh** (Superbank UX + Light/Dark + Splash) dalam satu blok copy tanpa bagian “UPDATE” — bilang saja “prompt lengkap satu file”.