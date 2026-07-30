# Panduan Lengkap Arsitektur Hardware & Sistem ESP32 Verdanist (Indoor Zone)

Dokumen ini adalah panduan komprehensif (SOP) untuk perakitan, logika pemrograman, dan sinkronisasi antara perangkat keras (ESP32) dan perangkat lunak (Web Dashboard React & Supabase). Sistem ini dirancang dengan standar *Industrial Grade*.

---

## 1. Konsep Sistem Keseluruhan (Input - Proses - Output)

Sistem Verdanist beroperasi dengan otak ganda: **ESP32** di kebun sebagai eksekutor fisik, dan **Website/Supabase** di Cloud sebagai pengendali jarak jauh.

### A. Alur Kerja Hardware Lokal (Di Kebun)
*   **INPUT:**
    *   **4x Sensor DHT22:** Membaca Suhu & Kelembapan di 4 titik berbeda.
    *   **8x Tombol Fisik (19mm Stainless Steel):** Memberikan perintah Manual (ON/OFF), ganti Mode (Auto/Manual/Timer), dan navigasi Set Timer (Up/Down/Set).
*   **PROSES (ESP32):**
    *   Menghitung **Rata-rata** (Average) dari 4 sensor DHT22.
    *   Mengatur logika otomatis berdasarkan ambang batas (Threshold) suhu/kelembapan.
    *   Mengatur waktu (Timer) menggunakan sinkronisasi internet (NTP Server).
*   **OUTPUT:**
    *   **Layar TFT 3.5 Inch:** Menampilkan UI/UX grafis (LVGL) berisi status pompa, suhu rata-rata, dan mode saat ini.
    *   **8x Ring LED (di dalam tombol):** Memberi *feedback* visual (menyala) sesuai mode atau status yang sedang aktif.
    *   **Relay 5V -> Kontaktor 220V/380V -> Pompa Air:** Mengalirkan arus kuat ke pompa air secara aman tanpa membebani ESP32.

---

## 2. Mekanisme Sinkronisasi 2-Arah (Web ↔ Fisik)

Sistem ini memastikan bahwa apa pun yang ditekan di kotak panel (fisik) akan otomatis berubah di layar HP (Web), dan sebaliknya. Jembatan utama penghubung keduanya adalah tabel database **Supabase** (`device_status` dan `device_settings`).

### Skenario 1: Kontrol dari Tombol Fisik
1.  Pengguna memencet tombol **MODE: AUTO** di kotak panel.
2.  IC Port Expander membaca tekanan tombol dan mengirimkan data ke ESP32 via I2C.
3.  ESP32 menyalakan LED di dalam tombol AUTO, dan mematikan LED di tombol MANUAL & TIMER.
4.  ESP32 mengirim *HTTP PATCH / MQTT* ke Supabase: `UPDATE device_settings SET mode='auto'`.
5.  Web App di HP menerima *Realtime Event* dari Supabase dan langsung mengganti tampilan layar menjadi mode Auto.

### Skenario 2: Kontrol dari Web Dashboard
1.  Pengguna sedang berada di luar kota, membuka Web Verdanist, dan mengklik tombol **Nyalakan Pompa**.
2.  Web mengirim perintah ke Supabase: `UPDATE device_status SET pump_active=true`.
3.  ESP32 yang selalu terhubung ke internet (*listening* via WebSockets/MQTT) menerima instruksi tersebut secara *real-time* (< 1 detik).
4.  ESP32 memberi tegangan *HIGH* ke modul Relay -> Kontaktor menyala -> Pompa menyala.
5.  ESP32 menyalakan lampu **LED pada tombol ON** di kotak panel, dan mengubah status di layar TFT 3.5 Inch menjadi "Menyiram".

---

## 3. Ekstensi Hardware (Rekomendasi Wajib)

Karena Anda menggunakan **8 Tombol 5-Pin (Masing-masing butuh 1 Pin Input Saklar + 1 Pin Output LED = Total 16 Pin)**, ditambah Layar 3.5 Inch (5 Pin) dan 4 Sensor DHT22 (4 Pin), pin pada board ESP32 Anda akan kurang / habis.

**Solusi Profesional:**
Gunakan Modul **IC MCP23017 (16-Channel I2C Port Expander)**.
Modul ini memberi Anda tambahan 16 Pin (cukup untuk 8 Tombol + 8 LED Anda!), dan hanya memakan **2 Pin (SDA & SCL)** di ESP32. Ini akan membuat kabel di dalam panel sangat rapi.

---

## 4. Tabel Alokasi Pin (Pinout Routing)

### A. Pinout Khusus ESP32 (Motherboard)
| Pin ESP32 | Digunakan Untuk | Tipe (I/O) | Keterangan |
| :--- | :--- | :--- | :--- |
| **VIN / 5V** | Power Eksternal | Power | Ke Adaptor 5V & Modul Relay |
| **3V3** | Power Sensor/Modul | Power | Ke DHT22 & Modul MCP23017 |
| **GND** | Ground Common | GND | Ground utama seluruh sistem |
| **GPIO 21 (SDA)**| IC MCP23017 | I2C | Komunikasi Data Tombol & LED |
| **GPIO 22 (SCL)**| IC MCP23017 | I2C | Komunikasi Clock Tombol & LED |
| **GPIO 23 (MOSI)**| Layar TFT 3.5" | SPI | Data ke Layar |
| **GPIO 19 (MISO)**| Layar TFT 3.5" | SPI | Data dari Layar (opsional) |
| **GPIO 18 (SCK)** | Layar TFT 3.5" | SPI | Clock Layar |
| **GPIO 5 (CS)** | Layar TFT 3.5" | SPI | Chip Select Layar |
| **GPIO 2 (DC)** | Layar TFT 3.5" | SPI | Data/Command Layar |
| **GPIO 4 (RST)** | Layar TFT 3.5" | SPI | Reset Layar |
| **GPIO 13** | DHT22 - Sensor 1 | Input | Membaca Suhu & Kelembapan |
| **GPIO 14** | DHT22 - Sensor 2 | Input | Membaca Suhu & Kelembapan |
| **GPIO 26** | DHT22 - Sensor 3 | Input | Membaca Suhu & Kelembapan |
| **GPIO 27** | DHT22 - Sensor 4 | Input | Membaca Suhu & Kelembapan |
| **GPIO 25** | Modul Relay 5V | Output | Pemicu Koil Kontaktor A1/A2 |

---

### B. Pinout Khusus IC MCP23017 (Pengendali 8 Tombol & LED)
*Modul MCP23017 memiliki Port A (GPA0-GPA7) dan Port B (GPB0-GPB7).*

| Pin MCP23017 | Komponen | Tipe Kabel pada Tombol 5-Pin |
| :--- | :--- | :--- |
| **GPA0** | Tombol Mode MANUAL | Pin **NO** (Normally Open) |
| **GPA1** | Tombol Mode AUTO | Pin **NO** (Normally Open) |
| **GPA2** | Tombol Mode TIMER | Pin **NO** (Normally Open) |
| **GPA3** | Tombol Pump ON | Pin **NO** (Normally Open) |
| **GPA4** | Tombol Pump OFF | Pin **NO** (Normally Open) |
| **GPA5** | Tombol Timer UP | Pin **NO** (Normally Open) |
| **GPA6** | Tombol Timer DOWN | Pin **NO** (Normally Open) |
| **GPA7** | Tombol Timer SET/OK | Pin **NO** (Normally Open) |
| **GPB0** | LED Mode MANUAL | Pin **+ (Anoda)** (Beri Resistor 220Ω) |
| **GPB1** | LED Mode AUTO | Pin **+ (Anoda)** (Beri Resistor 220Ω) |
| **GPB2** | LED Mode TIMER | Pin **+ (Anoda)** (Beri Resistor 220Ω) |
| **GPB3** | LED Pump ON | Pin **+ (Anoda)** (Beri Resistor 220Ω) |
| **GPB4** | LED Pump OFF | Pin **+ (Anoda)** (Beri Resistor 220Ω) |
| **GPB5** | LED Timer UP | Pin **+ (Anoda)** (Beri Resistor 220Ω) |
| **GPB6** | LED Timer DOWN | Pin **+ (Anoda)** (Beri Resistor 220Ω) |
| **GPB7** | LED Timer SET/OK | Pin **+ (Anoda)** (Beri Resistor 220Ω) |

> **Catatan Pengkabelan Tombol:**
> - Semua pin **C (Common)** pada tombol dan semua pin **- (Negatif)** pada LED digabung menjadi satu kabel panjang menuju **GND (Ground)** utama.
> - Pin **NC (Normally Closed)** pada semua tombol **dibiarkan kosong**.

---

## 5. Ringkasan Keunggulan Desain Ini
1. **Rapi & Aman:** Penggunaan MCP23017 memastikan ESP32 tidak kehabisan Pin, dan menghindari kerusakan akibat *short-circuit* pada kabel tombol.
2. **Industrial Control:** Kontaktor memisahkan sirkuit 220V/380V (pompa berat) dari sirkuit 5V (ESP32).
3. **True Sync:** LED pada setiap tombol dikendalikan murni oleh program (Software), sehingga LED bisa diperintah menyala oleh ESP32 kapan saja (misalnya ketika Anda mengklik tombol dari HP saat sedang liburan di luar negeri).
