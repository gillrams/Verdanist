Berikut **prompt Figma Make siap salin** untuk arah **Verdanist × Superbank UX** — fintech Indonesia yang rapi & ramah, tetap identitas **smart greenhouse IoT**, bukan mirip app banking.

---

```
# VERDANIST × SUPERBANK UX
## Figma Make — Full UI Redesign Prompt

Design a complete mobile-first UI system for **Verdanist**, an Indonesian smart greenhouse IoT app (ESP32 indoor/outdoor, pump control, multi-farm, admin). Apply UX patterns inspired by **Superbank** (Indonesia digital bank): bold contrast, lime accent, card-first home, friendly Indonesian copy, step-by-step flows, large hero numbers, trust chips — BUT re-skinned for **agritech / greenhouse**, never banking (no rupiah saldo, no QRIS, no pinjaman).

**Tagline brand:** "AUTOMATION FOR EVERY FARM" · sub: Smart Greenhouse Command Center

---

### DESIGN PRINCIPLE (HYBRID RULES)

| From Superbank | Adapt for Verdanist |
|----------------|---------------------|
| Lime neon CTA on dark | **Super Green** #B8F000 / #C8FF00 on **Forest Black** #0B0F0A |
| Hero number (saldo) | **Hero metric** — suhu °C atau kelembaban % (font 48–64px tabular) |
| Saku / sub-accounts | **Kebun** cards — each farm = one "saku" workspace |
| Transfer / QRIS CTA | **Get Started** / **Masuk Command Center** / **Nyalakan Pompa** |
| Trust + regulasi chips | **Live Sensor** · **Token Aman** · **Terhubung ESP32** |
| "Super Friend" tone | **Sahabat Kebun** — santai, jelas, Bahasa Indonesia |
| White glass cards on gradient | **Agri cards** — putih 96% / dark #141A14, radius 20–24px |
| Bottom nav 4–5 icon | Same structure: Home · Grafik · Riwayat · Atur · Admin* |
| Step onboarding | Welcome → Pilih Kebun → Token → Login (linear, 1 primary CTA per screen) |

*Admin tab only for role admin — use subtle red accent like Superbank promo badges, not primary lime.

**DO NOT:** currency symbols, bank logos, loan UI, QR payment, rekening, celengan, deposito copy.

**DO:** greenhouse illustrations, misting/pump icons, soil moisture, temperature rings, farm location pins.

---

### DESIGN TOKENS

**Colors**
- Background gradient: #0B0F0A → #1A2E1A (dark mode default) OR light mode #F4F7F0 → #E8F5E9
- Primary accent (Super Green): #C8FF00, hover #B8F000
- Primary text dark bg: #FFFFFF, secondary rgba(255,255,255,0.55)
- Primary text light bg: #0B0F0A, secondary #5C6B5C
- Forest brand: #0D3D2A, #15803D
- Surface card dark: #1C241C, border rgba(200,255,0,0.12)
- Surface card light: #FFFFFF, border #E5EDE5
- Semantic: Success #22C55E, Warning #F59E0B, Danger #EF4444, Info #3B82F6 (humidity charts)

**Typography**
- Display/brand: **Fredoka** 600–700 (logo, big headlines)
- UI: **Plus Jakarta Sans** 500–800
- Hero numbers: Jakarta **800**, tabular lining, -2% tracking
- Labels: 10–11px uppercase tracking 0.12em extrabold (Superbank-style micro labels)

**Shape & elevation**
- Card radius: 20px (small), 24px (medium), 28px (hero cards)
- Button radius: 16px (secondary), full pill for chips & bottom nav container
- Shadow dark: 0 20px 50px rgba(0,0,0,0.45)
- Shadow light: 0 12px 40px rgba(13,61,42,0.08)
- Bottom nav: floating pill, height 72px, blur 24px, margin 16px horizontal

**Icons:** Material Symbols Rounded, filled when active

---

### FIGMA FILE STRUCTURE

Pages:
1. `Tokens & Components`
2. `Onboarding — Super Flow`
3. `Auth`
4. `App Shell`
5. `Command Center (Dashboard)`
6. `Analytics · Logs · Settings`
7. `Admin`
8. `Modals & States`

Frames: **390×844** (iPhone) primary + **1440×900** desktop for Dashboard & Admin.

---

## COMPONENTS (build library first)

1. **Button Primary** — full width, Super Green bg, black text 16px extrabold, h 56px
2. **Button Secondary** — outline lime / ghost white on dark
3. **Chip** — Live (green dot ping), Pending (amber), Admin (red outline)
4. **Input** — h 56px, left icon, focus ring lime/20
5. **Farm Card** — like Superbank Saku row: icon 48px, title bold, subtitle location, chevron, tap state scale 0.98
6. **Metric Hero Card** — large number + unit + micro label + trend ▲▼
7. **Segmented Control** — Indoor | Outdoor · Manual | Auto | Timer
8. **Bottom Nav Pill** — 5 slots, active = lime tint bg + lime icon
9. **Sidebar Desktop** — dark #141A14, active item lime left bar 3px
10. **Alert Dialog** — dark card, lime confirm / gray cancel

---

## SCREEN-BY-SCREEN (SUPERBANK UX APPLIED)

### 1. WELCOME `/` — "Bareng Verdanist, tanamnya sesuper itu"

**Layout:** Dark gradient full screen, NO scroll.

- Top: Logo Verdanist + micro tagline (Fredoka)
- Center hero: **illustration greenhouse** (not bank card) — rounded 28px, subtle lime glow border
- Headline: "Cultivating The Future." — white 36px extrabold
- Subcopy: 1 line benefit (misting, soil, greenhouse) — white/60
- **Primary CTA pill:** "Mulai Sekarang" (lime, black text) — Superbank-style full width margin 24px
- Footer links row: Privasi · API — small, white/50, dot separator
- Optional trust row: icon shield + "Data sensor aman & real-time"

**Desktop:** split 50/50 — copy left, illustration right in lime-bordered frame.

---

### 2. FARM SELECTION `/farms` — "Pilih Kebunmu" (like pilih Saku)

**Background:** dark #0B0F0A with soft green orb blur (static).

**Header:** back chevron + title "Pilih Kebun" + subtitle "Pilih node aktif untuk monitoring"

**Search:** full width, dark input, placeholder "Cari nama atau kota..."

**List:** vertical **Farm Cards** (Superbank Saku list pattern)
- Each row: greenhouse icon in lime/10 circle, farm name bold, location secondary, chevron
- Live farms: small "Aktif" chip green

**Sticky bottom sheet style card:**
- Left: "Kebun belum terdaftar?"
- Right CTA: "+ Daftar Kebun" lime outline button

**Left panel desktop only:** dark green card "IoT Command Center" + stat besar **{N} Kebun Aktif** (hero number style) + "Live Database" chip

**States:** skeleton shimmer (lime tint), empty "Belum ada kebun", error + "Coba Lagi"

---

### 3. FARM ACCESS `/farms/access` — "Verifikasi Token"

Single centered card (Superbank PIN/verification pattern):
- Icon key in lime square 64px
- Title: "Masuk ke {Farm Name}"
- Location chip
- One input: **Token Akses** (masked optional)
- CTA: "Lanjutkan" lime full width
- Error inline red soft
- Text link: "Ganti kebun"

---

### 4. FARM APPLY `/farms/apply`

Step card:
- Progress dots 1/1 (simple)
- Fields: Nama Kebun, Lokasi
- CTA: "Ajukan Kebun"
- Success screen: large check lime circle + "Pengajuan Terkirim" + CTA kembali — copy tone Superbank success (celebratory but short)

---

### 5. LOGIN `/login` & REGISTER `/register`

**Superbank auth pattern:**
- Dark or light gradient bg
- Single floating card rounded 28px
- Logo center top
- "Selamat datang kembali, Sahabat Kebun" (login) / "Buat akun Verdanist" (register)
- Email, password (+ name on register) — tall inputs
- Primary: "Masuk" / "Daftar" lime button
- Divider "atau"
- Google button white pill with logo
- Footer link swap login/register
- Back button top-left circle

---

### 6. WELCOME GUEST `/welcome-guest`

Amber **Menunggu Verifikasi** chip (Superbank pending style):
- Lock illustration
- Explain Guest role plainly
- Steps 1-2-3 in numbered cards (lime numbers)
- WhatsApp CTA green #25D366 (exception: brand WA green)
- Secondary: Keluar

---

### 7. APP SHELL

**Mobile bottom nav (Superbank-like pill):**
| Home | Grafik | Riwayat | Atur | Admin* |
grid_view | show_chart | receipt_long | settings | admin_panel_settings

Active: lime bg 15%, lime icon + label extrabold 9px uppercase

**Desktop sidebar:** dark, logo + farm name subtitle, nav items, logout bottom gray → red hover

**Content area:** max-width 1200px, padding 20–32px

---

### 8. DASHBOARD `/dashboard` — "Command Center" (Superbank Home adapted)

**Top — like Superbank home balance area but for environment:**

```
[Live Sensor chip] [Lokasi: Bandung chip]

{28.4}°C          ← hero number left (current temp)
Suhu Ruangan      ← micro label

Kelembaban 75%    ← secondary hero right

Good Morning, Gilang 👋
{nama kebun} · Sen, 25 Mei
```

**Row actions (icon circles like quick actions Superbank):**
- AI Agronomi (lime gradient)
- Profil
- Device toggle: **Indoor | Outdoor** segmented under hero on mobile

**Main cards (vertical stack mobile / bento desktop):**

**Card A — Lingkungan (wide)**
- Dual gauge: temp ring + humidity wave
- Status pills: Optimal / Hot / Cold

**Card B — Kontrol Pompa (Superbank "action card")**
- Mode: Manual | Auto | Timer — segmented lime
- **Big toggle:** "Pompa MIST" ON/OFF — lime when on, dark when off (like enable transfer)
- Timer countdown bar if active
- Links: Atur Timer · Pengaturan Pompa (text lime)

**Card C — Grafik Mini** (sparkline area chart, 24h)

**Card D — Aktivitas Terakhir** (3 log rows, chevron "Lihat semua" → Logs)

**Modals:** Timer, Pump Settings, AI Assistant — dark sheet bottom 90% height on mobile, centered card desktop, lime primary actions

---

### 9. ANALYTICS `/analytics`

Superbank "insights" page pattern:
- Header + Refresh chip button (lime outline)
- **4 stat tiles** in 2×2 grid (hero mini numbers + trend)
- Time range chips: 1J · 6J · 24J · 7H (lime active)
- Metric chips: Keduanya · Suhu · Kelembaban
- Large chart card dark surface, lime line temp, blue area humidity
- Outdoor variant: label "Kelembaban Tanah" only

---

### 10. LOGS `/logs`

Superbank transaction history UX → pump history:
- Title "Riwayat Pompa"
- Export chips: CSV · Excel · PDF (outline row)
- Search + filter chips Zona A/B, ON/OFF
- List rows: time left, action badge (ON lime / OFF gray), detail 2 lines, operator
- Swipe-friendly row height 72px+

---

### 11. SETTINGS `/settings`

Superbank settings sections — stacked cards with chevron optional:
1. Profil (avatar, email, logout red text)
2. Informasi Kebun
3. Batas Sensor (sliders or steppers — lime thumb)
4. Konfigurasi Pompa
5. Notifikasi (toggles iOS style, lime active)
6. Tema Gelap / Terang
7. Sticky bottom: **Simpan** lime full width

---

### 12. ADMIN `/admin` — "Panel Super" (admin only)

Red accent badge "Area Admin" (not lime primary):
- Tab bar: Kebun | Pengguna | Sistem (pill segmented dark)
- 4 overview stat cards (Pending, Aktif, Farmer, Guest) — numbers bold like Superbank promo tiles
- Tables: clean rows, approve lime button, delete red ghost
- System tab: device ESP32_INDOOR/OUTDOOR toggle + form + live sensor comparison card

---

### 13. ABOUT `/about`

Dark green marketing (can stay non-Superbank) OR adapt: dark bg + lime accent headings for Privacy & API cards.

---

### PROTOTYPE FLOWS (link frames)

1. Welcome → Mulai → Farm List → Farm Card tap → Token → Login → Dashboard Home
2. Farm List → Daftar Kebun → Success → Farm List
3. Dashboard → Pompa ON → Logs
4. Dashboard → AI Modal
5. Admin: Pending farm → Approve

---

### DARK vs LIGHT

Deliver **dark mode as default** (Superbank-native feel), plus **light mode variant** for Settings toggle — light uses white cards on #F4F7F0, lime accent unchanged.

---

### ANNOTATIONS FOR DEV

- 8px spacing grid
- Touch targets min 44px
- Primary CTA always ONE per screen above fold
- Copy samples in Bahasa Indonesia
- Use real sample: "Persada Farm", "Bandung", "Gilang", temp 28.4°C, hum 75%

---

### MOOD BOARD KEYWORDS

Indonesian fintech clarity × greenhouse IoT × Grab-ecosystem polish × lime energy × dark premium × farmer-friendly × NOT a bank app

Generate high-fidelity screens, consistent auto-layout, component variants, and linked prototype. Prioritize mobile 390×844 for onboarding and dashboard; expand desktop for Command Center bento grid.
```

---

## Cara pakai di Figma Make

1. Salin seluruh blok prompt di atas.  
2. Jalankan dulu halaman **`Tokens & Components`**, lalu **`Onboarding — Super Flow`**.  
3. Review apakah lime + dark terasa **Verdanist** (bukan Superbank clone) — jika terlalu “bank”, kurangi hero number dan tambah ilustrasi tanaman.  
4. Iterasi dengan tambahan satu baris, misalnya: *"Make Welcome screen only, dark mode, Indonesian copy"*.

Kalau Anda mau versi **lebih pendek** (hanya 5 layar: Welcome, Farms, Login, Dashboard, Admin) atau **light-mode default**, sebutkan — saya ringkas prompt-nya.