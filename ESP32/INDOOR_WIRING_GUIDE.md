# Panduan Wiring Indoor Smart Greenhouse

## Daftar Komponen

| No | Komponen | Jumlah | Keterangan |
|----|----------|--------|------------|
| 1 | ESP32 DevKit V1 | 1 | Mikrokontroler utama |
| 2 | DHT11/DHT22 Sensor | 1 | Sensor suhu & kelembapan |
| 3 | Relay Module 1-Channel | 1 | Kontrol pompa (5V atau 3.3V) |
| 4 | Pompa Air Mini (12V/5V) | 1 | Untuk misting/sprinkler |
| 5 | Power Supply 5V/12V | 1 | Untuk ESP32 + Relay + Pompa |
| 6 | Jumper Wire (Male-Female) | 15-20 pcs | Penghubung antar komponen |
| 7 | Breadboard (opsional) | 1 | Jika perlu prototyping |

---

## Tabel Wiring Lengkap

### 1. ESP32 -> Relay Module (Kontrol Pompa)

| ESP32 Pin | Relay Module Pin | Kabel Warna | Keterangan |
|-----------|-----------------|-------------|------------|
| GPIO 5 (D5) | IN / SIG | Kuning | Signal kontrol relay |
| 3.3V / 5V | VCC | Merah | Power relay (cek spec relay) |
| GND | GND | Hitam | Ground |

> **Catatan:** Jika relay 5V, bisa pakai VIN (5V) di ESP32. Jika relay 3.3V, pakai 3.3V pin.

---

### 2. ESP32 -> DHT11/DHT22 Sensor

| ESP32 Pin | DHT Pin | Kabel Warna | Keterangan |
|-----------|---------|-------------|------------|
| GPIO 4 (D4) | DATA / OUT | Hijau | Data signal |
| 3.3V | VCC (+) | Merah | Power sensor |
| GND | GND (-) | Hitam | Ground |

> **Catatan:** Jika pakai DHT versi modul (3 pin), sudah ada pull-up resistor onboard. Jika pakai DHT raw (4 pin), tambahkan resistor 10k Ohm antara VCC dan DATA.

---

### 3. ESP32 -> Power Supply

| ESP32 Pin | Power Supply | Kabel Warna | Keterangan |
|-----------|-------------|-------------|------------|
| 5V / VIN | 5V Output | Merah | Power ESP32 via USB atau external |
| GND | GND | Hitam | Ground bersama |

> **Catatan:** ESP32 bisa di-power via USB cable (5V) atau via 5V pin. Untuk deployment, rekomendasi pakai USB Charger 5V 2A.

---

### 4. Relay -> Pompa Air

| Relay Output | Pompa Air | Keterangan |
|-------------|-----------|------------|
| COM (Common) | VCC Pompa (+) | Power dari supply |
| NO (Normally Open) | VCC Pompa (+) | Pompa nyala saat relay aktif |
| NC (Normally Closed) | - | Tidak dipakai |

> **Catatan:** Pompa air harus pakai power supply terpisah (jangan dari ESP32!). Relay hanya sebagai switch.

---

### 5. Power Supply -> Pompa Air

| Power Supply | Pompa Air | Kabel Warna | Keterangan |
|-------------|-----------|-------------|------------|
| 12V / 5V Out (+) | Relay COM | Merah | Positive pompa melalui relay |
| GND | Pompa GND (-) | Hitam | Ground pompa |

---

## Diagram Sistem

```
+------------------+        +------------------+
|   POWER SUPPLY   |        |    ESP32 DEVKIT  |
|      5V/12V      |        |                  |
|  +         -     |        |  3.3V     GPIO5  |-------> Relay IN
|  |         |     |        |   |         |     |   (Kuning)
|  |         |     |        |   |         |     |
|  |         +-----+--------|---+    GPIO4    |-------> DHT DATA
|  |               |        |          |     |   (Hijau)
|  |               |        |          |     |
|  +----+          |        |    GND    |     |
|       |          |        |     |     |     |
+-------|----------+        +-----|-----|-----+
        |                         |     |
        |                         |     |
        v                         v     v
  +------------+             +------------------+
  |   POMPA    |             |    RELAY MODULE  |
  |    AIR     |             |                  |
  |   (+) (-)  |             |  VCC  IN  GND   |
  |   |    |   |             |   |    |    |    |
  |   |    |   |             |   |    |    |   |
  |   |    +---+-------------+GND   |    |   |
  |   |        |             |      |    |   |
  |   +--------+             |  +5V  |    |   |
  |   (melalui               |   |   |    |   |
  |    relay NO)             +---|---|----|---+
  |                              |   |    |
  +------------------------------+   |    |
                                     |    |
                              +------+    |
                              |           |
                         +----v----+  +---v----+
                         |   COM   |  |   NO   |
                         +---------+  +--------+
```

---

## Skema Pinout ESP32 DevKit V1

```
ESP32 DevKit V1 (30/36 pin)

          EN        GPIO23    GPIO22    GPIO1     GPIO3     GPIO21    GPIO19    GPIO18    GPIO5     GPIO17    GPIO16    GPIO4     GPIO0     GPIO2     GPIO15    GPIO13    GPIO12    GPIO14    GPIO27    GPIO26    GPIO25    GPIO33    GPIO32    GPIO35    GPIO34    VN        VP        GND       3.3V
          |          |         |         |         |         |         |         |         |         |         |         |         |         |         |         |         |         |         |         |         |         |         |         |         |         |         |         |         |
          [ ]       [ ]       [ ]       [ ]       [ ]       [ ]       [ ]       [ ]       [ ]       [ ]       [ ]       [DHT]     [ ]       [LED]     [ ]       [ ]       [ ]       [ ]       [ ]       [ ]       [ ]       [ ]       [ ]       [ ]       [ ]       [ ]       [ ]       [GND]     [3.3V]
                                                                                          GPIO4     GPIO2     GPIO5
                                                                                          (Hijau)   (Biru)    (Kuning)
```

---

## Ringkasan Pin ESP32

| Fungsi | GPIO Pin | Warna Kabel | Koneksi Ke |
|--------|----------|-------------|------------|
| Relay Control | GPIO 5 | Kuning | Relay IN |
| DHT Sensor | GPIO 4 | Hijau | DHT DATA |
| LED Indicator | GPIO 2 | Biru | LED / Built-in LED |
| 3.3V Power | - | Merah | DHT VCC |
| 5V Power | VIN | Merah | Relay VCC (jika relay 5V) |
| Ground | GND | Hitam | Relay GND, DHT GND |

---

## Catatan Penting

1. **Relay Power:** Pastikan relay module pakai tegangan sesuai spec. Ada relay 3.3V dan 5V. ESP32 pin GPIO output 3.3V.

2. **Pompa Power:** JANGAN supply pompa dari ESP32! Pompa butuh arus besar. Gunakan power supply terpisah.

3. **Common Ground:** Semua komponen (ESP32, Relay, Sensor, Pompa) harus punya common ground (GND bersama).

4. **DHT Sensor:** Jika pakai DHT11 biasa (bukan modul), butuh resistor 10k Ohm sebagai pull-up antara VCC dan DATA.

5. **Safety:** Pasang pompa di container anti air. Jangan biarkan water splash ke elektronik.

6. **WiFi Range:** ESP32 harus dalam jangkauan WiFi. Jika jauh, pertimbangkan WiFi extender.

---

## Library Arduino IDE yang Harus Di-install

1. **ArduinoJson** by Benoit Blanchon
2. **DHT sensor library** by Adafruit
3. **Adafruit Unified Sensor** (auto-install sebagai dependency)

---

## Upload Code ke ESP32

1. Buka Arduino IDE
2. Connect ESP32 ke PC via USB
3. Select Board: `Tools > Board > ESP32 Arduino > ESP32 Dev Module`
4. Select Port: `Tools > Port > COMx` (sesuai port ESP32)
5. Open `smart_greenhouse.ino`
6. Klik Upload (tombol panah kanan)
7. Buka Serial Monitor (ikon kaca pembesar) dengan baudrate 115200
