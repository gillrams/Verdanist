//  VERDANIST — Indoor Controller v3.0 (COMPLETE + LED BUTTONS)
//  Board    : ESP32-WROOM (38-Pin) on Expansion Board
//  Sensor   : 1x DHT11 3-Pin Module
//  Aktuator : Relay 5V → Kontaktor → Pompa Air
//  Display  : TFT ILI9488 3.5" SPI — 480×320
//  Tombol   : 3x Metal Push Button + LED (Manual/Auto/Timer)
//             3x Tactile Push Button (Timer UP/SET/DOWN)
//             1x Double Push Button (Pump ON/OFF)
//  Sync     : Supabase REST API (2-Arah: Fisik ↔️ Web)
// ================================================================
//
//  PENTING — Sebelum upload:
//  1. Copy file User_Setup_ILI9488.h ke folder library TFT_eSPI
//     sebagai User_Setup.h (ganti/rename file yang lama)
//     Path: Documents/Arduino/libraries/TFT_eSPI/User_Setup.h
//  2. Install semua library yang diperlukan (lihat SECTION 0)
//  3. Board: ESP32 Dev Module, Upload Speed: 921600
//
// ================================================================

// ================================================================
//  SECTION 0 — LIBRARY YANG DIPERLUKAN
// ================================================================
//  Install melalui Arduino IDE → Tools → Manage Libraries:
//  1. ArduinoJson          (Benoit Blanchon, v7.x)
//  2. DHT sensor library   (Adafruit)
//  3. Adafruit Unified Sensor (Adafruit)
//  4. TFT_eSPI             (Bodmer)
//
//  Board Manager:
//  - esp32 by Espressif Systems (v2.x atau v3.x)
// ================================================================

#include <ArduinoJson.h>
#include <DHT.h>
#include <HTTPClient.h>
#include <Preferences.h>
#include <TFT_eSPI.h>
#include <WiFi.h>
#include <time.h>
#include "soc/soc.h"
#include "soc/rtc_cntl_reg.h"

// ================================================================
//  SECTION 1 — PIN DEFINITIONS
// ================================================================
//
//  TFT ILI9488 3.5" SPI Display — dikonfigurasi di User_Setup.h:
//    TFT_CS=15, TFT_DC=2, TFT_RST=4, MOSI=23, SCK=18, MISO=19
//    LED pin → 3.3V (backlight selalu nyala)
//    Touch T_CS → 3.3V (touch dinonaktifkan / deselect)
//    Touch T_IRQ, T_DO, T_DIN, T_CLK → Tidak disambung (NC)
//
// ================================================================

// --- 3x Sensor DHT11 (3-Pin Module: +, OUT, -) ---
#define PIN_DHT1  26
#define PIN_DHT2  27   // BARU: Sensor ke-2
#define PIN_DHT3  21   // BARU: Sensor ke-3

// --- Relay 5V ---
#define PIN_RELAY 13

// --- 3x Metal Push Button — Switch Input (Active LOW) ---
#define BTN_MODE_MANUAL  33   // Internal Pull-Up
#define BTN_MODE_AUTO    25   // Internal Pull-Up
#define BTN_MODE_TIMER   32   // Internal Pull-Up

// --- 3x Metal Push Button — LED Ring Output (Active HIGH) ---
//     Hubungkan: GPIO → Resistor 330Ω → LED Anode(+)
//                LED Cathode(-) → GND
#define LED_MODE_MANUAL  16
#define LED_MODE_AUTO    17
#define LED_MODE_TIMER   22

// --- 1x Double Push Button — Pump ON/OFF (Active LOW) ---
#define BTN_PUMP_ON       5   // Internal Pull-Up
#define BTN_PUMP_OFF     14   // DIPINDAH dari 21 ke 12 (Pin 12 aman untuk tombol yang normalnya terbuka)

// --- 3x Tactile Push Button — Timer Control (Active LOW) ---
//     GPIO 34,35,36 = Input-Only, TANPA Internal Pull-Up
//     WAJIB pasang Resistor 10KΩ Pull-Up ke 3.3V di setiap pin
#define BTN_TIMER_UP     34
#define BTN_TIMER_DOWN   35
#define BTN_TIMER_SET    36

// ================================================================
//  SECTION 2 — HARDWARE SETTINGS
// ================================================================

#define DHT_TYPE        DHT11
#define RELAY_ACTIVE_LOW true      // Relay module umum = Active LOW
#define DEBOUNCE_MS     200
#define DHT_COUNT       3

// ================================================================
//  SECTION 3 — WiFi & SUPABASE CREDENTIALS
// ================================================================

const char *WIFI_SSID     = "realme C71";
const char *WIFI_PASSWORD = "ayamgoreng";

const char *SUPABASE_URL  = "https://pzktyggopmvyrkwcnwfo.supabase.co";
const char *SUPABASE_KEY  =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9."
    "eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB6a3R5"
    "Z2dvcG12eXJrd2Nud2ZvIiwicm9sZSI6ImFub24i"
    "LCJpYXQiOjE3NzY4ODA3NDEsImV4cCI6MjA5MjQ1"
    "Njc0MX0.p-h9x0mswjwjremYia7idtaPpLdi7IEdh7an36UKmEc";
const char *DEVICE_ID     = "ESP32_INDOOR";

const char *NTP_SERVER    = "pool.ntp.org";
const long  GMT_OFFSET    = 25200;   // WIB (GMT+7)
const int   DST_OFFSET    = 0;

// ================================================================
//  SECTION 4 — INTERVAL WAKTU (ms)
// ================================================================

const unsigned long INTERVAL_PUMP_CHECK   = 2000;   // Cek status pompa dari web
const unsigned long INTERVAL_SENSOR_SEND  = 5000;   // Kirim data sensor ke web
const unsigned long INTERVAL_WIFI_CHECK   = 30000;  // Cek koneksi WiFi
const unsigned long INTERVAL_MODE_SYNC    = 3000;   // Sinkronisasi mode dari web
const unsigned long INTERVAL_SCHEDULE_CHK = 10000;  // Cek jadwal timer
const unsigned long INTERVAL_DISPLAY      = 2000;   // Update tampilan TFT

// ================================================================
//  SECTION 5 — OBJEK & STATE GLOBAL
// ================================================================

DHT  dht1(PIN_DHT1, DHT_TYPE);
DHT  dht2(PIN_DHT2, DHT_TYPE);   // BARU
DHT  dht3(PIN_DHT3, DHT_TYPE);   // BARU

DHT *dhtSensors[DHT_COUNT] = {&dht1, &dht2, &dht3}; // UBAH arraynya

TFT_eSPI    tft = TFT_eSPI();
Preferences prefs;

// Millis trackers
unsigned long lastPumpCheck   = 0;
unsigned long lastSensorSend  = 0;
unsigned long lastWifiCheck   = 0;
unsigned long lastModeSync    = 0;
unsigned long lastScheduleChk = 0;
unsigned long lastDisplayUpd  = 0;

// Sensor data
float g_temp         = 0.0;
float g_hum          = 0.0;
int   g_validSensors = 0;

// System state
bool g_pumpActive = false;
bool g_sensorOK   = false;
bool g_wifiOK     = false;
bool g_ntpSynced  = false;

// Mode
enum Mode { MODE_MANUAL = 0, MODE_AUTO = 1, MODE_TIMER = 2 };
Mode g_currentMode = MODE_MANUAL;

// Threshold auto mode
float g_tempThreshold = 27.0;
float g_humThreshold  = 65.0;

// Timer setting
int  g_timerHour      = 8;
int  g_timerMinute    = 0;
int  g_timerDuration  = 5;
bool g_timerSetMode   = false;
int  g_timerSetCursor = 0;
int  g_timerSetValues[3] = {8, 0, 5};

// Debounce: array 40 elemen (GPIO 0-39)
unsigned long g_lastBtnPress[40] = {0};
bool g_lastBtnState[40]; // ★ BARU: Untuk deteksi tepi (edge detection)

// Pump safety auto-off
unsigned long g_pumpOnTime = 0;
const unsigned long PUMP_SAFETY_MS = 30000;  // 30 detik

// Forward declarations
void supabaseSendMode();
void supabaseSendPumpStatus(bool state);

// ================================================================
//  SECTION 6 — WiFi
// ================================================================

void wifiConnect() {
  Serial.printf("[WiFi] Menghubungkan ke '%s' ...", WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  int tries = 0;
  while (WiFi.status() != WL_CONNECTED && tries < 40) {
    delay(500);
    Serial.print(".");
    tries++;
  }
  if (WiFi.status() == WL_CONNECTED) {
    g_wifiOK = true;
    Serial.println("\n[WiFi] Terhubung! IP: " + WiFi.localIP().toString());
  } else {
    g_wifiOK = false;
    Serial.println("\n[WiFi] GAGAL terhubung.");
  }
}

void wifiMaintain() {
  if (WiFi.status() != WL_CONNECTED) {
    g_wifiOK = false;
    Serial.println("[WiFi] Terputus — reconnect...");
    WiFi.disconnect();
    wifiConnect();
  } else {
    g_wifiOK = true;
  }
}

// ================================================================
//  SECTION 7 — TIME & NTP SYNC
// ================================================================
void ntpSync() {
  configTzTime("WIB-7", "pool.ntp.org", "time.nist.gov");
  struct tm timeinfo;
  if (getLocalTime(&timeinfo, 10000)) {
    g_ntpSynced = true;
    Serial.printf("[NTP] Waktu: %02d:%02d:%02d WIB\n",
                  timeinfo.tm_hour, timeinfo.tm_min, timeinfo.tm_sec);
  } else {
    g_ntpSynced = false;
    Serial.println("[NTP] Gagal sinkronisasi waktu!");
  }
}

// ── Fungsi Helper Waktu (Wajib ada sebelum displayUpdate) ──
String getCurrentTimeStr() {
  struct tm timeinfo;
  if (getLocalTime(&timeinfo)) {
    char buf[12];
    sprintf(buf, "%02d:%02d:%02d", timeinfo.tm_hour, timeinfo.tm_min, timeinfo.tm_sec);
    return String(buf);
  }
  return "--:--:--";
}

String getISOTimeStr() {
  struct tm timeinfo;
  if (getLocalTime(&timeinfo)) {
    char buf[32];
    sprintf(buf, "%04d-%02d-%02dT%02d:%02d:%02d+07:00",
            timeinfo.tm_year + 1900,
            timeinfo.tm_mon + 1,
            timeinfo.tm_mday,
            timeinfo.tm_hour,
            timeinfo.tm_min,
            timeinfo.tm_sec);
    return String(buf);
  }
  return "";
}

// ================================================================
//  SECTION 8 — EEPROM (Preferences / NVS)
// ================================================================

void saveSettings() {
  prefs.begin("verdanist", false);
  prefs.putInt("mode", (int)g_currentMode);
  prefs.putInt("timerH", g_timerHour);
  prefs.putInt("timerM", g_timerMinute);
  prefs.putInt("timerD", g_timerDuration);
  prefs.putFloat("tempTh", g_tempThreshold);
  prefs.putFloat("humTh", g_humThreshold);
  prefs.end();
  Serial.println("[EEPROM] Setting disimpan.");
}

void loadSettings() {
  prefs.begin("verdanist", true);
  g_currentMode   = (Mode)prefs.getInt("mode", 0);
  g_timerHour     = prefs.getInt("timerH", 8);
  g_timerMinute   = prefs.getInt("timerM", 0);
  g_timerDuration = prefs.getInt("timerD", 5);
  g_tempThreshold = prefs.getFloat("tempTh", 27.0);
  g_humThreshold  = prefs.getFloat("humTh", 65.0);
  prefs.end();

  g_timerSetValues[0] = g_timerHour;
  g_timerSetValues[1] = g_timerMinute;
  g_timerSetValues[2] = g_timerDuration;

  Serial.printf("[EEPROM] Dimuat: Mode=%d, Timer=%02d:%02d (%dmin), "
                "Threshold=%.1fC/%.1f%%\n",
                g_currentMode, g_timerHour, g_timerMinute, g_timerDuration,
                g_tempThreshold, g_humThreshold);
}

// ================================================================
//  SECTION 9 — RELAY & KONTROL POMPA
// ================================================================

void pumpSet(bool turnOn) {
  bool pinState = RELAY_ACTIVE_LOW ? !turnOn : turnOn;
  digitalWrite(PIN_RELAY, pinState ? HIGH : LOW);
  if (turnOn && !g_pumpActive) {
    g_pumpOnTime = millis();
  }
  g_pumpActive = turnOn;
  Serial.printf("[PUMP] Pompa -> %s\n", turnOn ? "ON" : "OFF");
}

// ================================================================
//  SECTION 10 — LED BUTTON CONTROL ★ BARU di V3 ★
// ================================================================
//
//  Logika: Hanya LED pada mode yang aktif yang menyala.
//  Ketika mode diganti (dari tombol fisik ATAU dari web),
//  fungsi ini dipanggil untuk mengupdate semua LED.
//
//  Koneksi fisik:
//    GPIO (OUTPUT HIGH) → Resistor 330Ω → LED Anode(+)
//    LED Cathode(-) → GND
//

void updateModeLEDs() {
  digitalWrite(LED_MODE_MANUAL, g_currentMode == MODE_MANUAL ? HIGH : LOW);
  digitalWrite(LED_MODE_AUTO,   g_currentMode == MODE_AUTO   ? HIGH : LOW);
  digitalWrite(LED_MODE_TIMER,  g_currentMode == MODE_TIMER  ? HIGH : LOW);

  Serial.printf("[LED] Mode LEDs updated: Manual=%d  Auto=%d  Timer=%d\n",
                g_currentMode == MODE_MANUAL,
                g_currentMode == MODE_AUTO,
                g_currentMode == MODE_TIMER);
}

// Double push button tidak memiliki LED ring
void updatePumpLEDs() {
  // Reserved — tidak ada LED di tombol pompa
}

// ================================================================
//  SECTION 11 — GPIO INITIALIZATION
// ================================================================

void setupPins() {
  // --- Relay Output ---
  pinMode(PIN_RELAY, OUTPUT);

  // --- Metal Push Buttons: Switch Input (Internal Pull-Up) ---
  pinMode(BTN_MODE_MANUAL, INPUT_PULLUP);
  pinMode(BTN_MODE_AUTO,   INPUT_PULLUP);
  pinMode(BTN_MODE_TIMER,  INPUT_PULLUP);

  // --- Metal Push Buttons: LED Ring Output ---
  pinMode(LED_MODE_MANUAL, OUTPUT);
  pinMode(LED_MODE_AUTO,   OUTPUT);
  pinMode(LED_MODE_TIMER,  OUTPUT);
  // Matikan semua LED saat boot
  digitalWrite(LED_MODE_MANUAL, LOW);
  digitalWrite(LED_MODE_AUTO,   LOW);
  digitalWrite(LED_MODE_TIMER,  LOW);

  // --- Double Push Button: Pump ON/OFF (Internal Pull-Up) ---
  pinMode(BTN_PUMP_ON,  INPUT_PULLUP);
  pinMode(BTN_PUMP_OFF, INPUT_PULLUP);

  // --- Tactile Push Buttons: Timer UP/SET/DOWN ---
  //     GPIO 34, 35, 36 = Input-Only TANPA Internal Pull-Up
  //     WAJIB pasang Resistor 10KΩ External dari pin → 3.3V
  pinMode(BTN_TIMER_UP,   INPUT);
  pinMode(BTN_TIMER_DOWN, INPUT);
  pinMode(BTN_TIMER_SET,  INPUT);

  Serial.println("[GPIO] Semua pin telah dikonfigurasi:");
  Serial.printf("  Mode BTN: %d, %d, %d\n",
                BTN_MODE_MANUAL, BTN_MODE_AUTO, BTN_MODE_TIMER);
  Serial.printf("  Mode LED: %d, %d, %d\n",
                LED_MODE_MANUAL, LED_MODE_AUTO, LED_MODE_TIMER);
  Serial.printf("  Pump BTN: ON=%d, OFF=%d\n", BTN_PUMP_ON, BTN_PUMP_OFF);
  Serial.printf("  Timer BTN: UP=%d, DOWN=%d, SET=%d\n",
                BTN_TIMER_UP, BTN_TIMER_DOWN, BTN_TIMER_SET);
  Serial.printf("  DHT11: %d\n", PIN_DHT1);
  Serial.printf("  Relay: %d\n", PIN_RELAY);
}

// ================================================================
//  SECTION 12 — TOMBOL: BACA & PROSES INPUT (EDGE TRIGGERING)
// ================================================================
bool isButtonPressed(int btnPin) {
  bool currentState = digitalRead(btnPin);
  unsigned long now = millis();

  // Deteksi tepi turun (HIGH -> LOW): Tombol BARU SAJA ditekan
  if (currentState == LOW && g_lastBtnState[btnPin] == HIGH) {
    if (now - g_lastBtnPress[btnPin] > DEBOUNCE_MS) {
      g_lastBtnPress[btnPin] = now;
      g_lastBtnState[btnPin] = LOW; // Tandai sudah ditekan
      return true;
    }
  }
  // Deteksi tepi naik (LOW -> HIGH): Tombol dilepas
  else if (currentState == HIGH) {
    g_lastBtnState[btnPin] = HIGH; // Reset state agar bisa ditekan lagi
  }

  return false;
}

void processButtons() {
  // ── Mode Buttons ──────────────────────────────────────────
  // Saat mode berubah: LED diupdate, simpan EEPROM, kirim ke web
  if (isButtonPressed(BTN_MODE_MANUAL) && g_currentMode != MODE_MANUAL) {
    g_currentMode  = MODE_MANUAL;
    g_timerSetMode = false;
    updateModeLEDs();
    saveSettings();
    supabaseSendMode();
    Serial.println("[BTN] Mode -> MANUAL");
  }
  if (isButtonPressed(BTN_MODE_AUTO) && g_currentMode != MODE_AUTO) {
    g_currentMode  = MODE_AUTO;
    g_timerSetMode = false;
    updateModeLEDs();
    saveSettings();
    supabaseSendMode();
    Serial.println("[BTN] Mode -> AUTO");
  }
  if (isButtonPressed(BTN_MODE_TIMER) && g_currentMode != MODE_TIMER) {
    g_currentMode  = MODE_TIMER;
    g_timerSetMode = false;
    updateModeLEDs();
    saveSettings();
    supabaseSendMode();
    Serial.println("[BTN] Mode -> TIMER");
  }

  // ── Pump ON/OFF (Hanya di Mode Manual) ────────────────────
  if (isButtonPressed(BTN_PUMP_ON)) {
    if (g_currentMode == MODE_MANUAL && !g_pumpActive) {
      pumpSet(true);
      supabaseSendPumpStatus(true);
      Serial.println("[BTN] Pump -> ON (Manual)");
    }
  }
  if (isButtonPressed(BTN_PUMP_OFF)) {
    if (g_currentMode == MODE_MANUAL && g_pumpActive) {
      pumpSet(false);
      supabaseSendPumpStatus(false);
      Serial.println("[BTN] Pump -> OFF (Manual)");
    }
  }

  // ── Timer UP/DOWN/SET (Hanya di Mode Timer) ───────────────
  if (g_currentMode == MODE_TIMER) {
    // SET: Masuk/keluar mode setting, pindah cursor
    if (isButtonPressed(BTN_TIMER_SET)) {
      if (!g_timerSetMode) {
        // Masuk ke mode setting
        g_timerSetMode   = true;
        g_timerSetCursor = 0;  // Mulai dari JAM
        g_timerSetValues[0] = g_timerHour;
        g_timerSetValues[1] = g_timerMinute;
        g_timerSetValues[2] = g_timerDuration;
        Serial.println("[BTN] Timer SET mode ON (cursor: JAM)");
      } else {
        // Pindah cursor: JAM → MENIT → DURASI → SIMPAN
        g_timerSetCursor++;
        if (g_timerSetCursor > 2) {
          // Simpan semua nilai
          g_timerHour     = g_timerSetValues[0];
          g_timerMinute   = g_timerSetValues[1];
          g_timerDuration = g_timerSetValues[2];
          g_timerSetMode  = false;
          g_timerSetCursor = 0;
          saveSettings();
          Serial.printf("[BTN] Timer DISIMPAN: %02d:%02d (%d menit)\n",
                        g_timerHour, g_timerMinute, g_timerDuration);
        } else {
          const char *labels[] = {"JAM", "MENIT", "DURASI"};
          Serial.printf("[BTN] Timer cursor -> %s\n",
                        labels[g_timerSetCursor]);
        }
      }
    }

    // UP: Naikkan nilai pada cursor aktif
    if (isButtonPressed(BTN_TIMER_UP) && g_timerSetMode) {
      switch (g_timerSetCursor) {
        case 0:
          g_timerSetValues[0] = (g_timerSetValues[0] + 1) % 24;
          break;
        case 1:
          g_timerSetValues[1] = (g_timerSetValues[1] + 1) % 60;
          break;
        case 2:
          g_timerSetValues[2] = min(g_timerSetValues[2] + 1, 60);
          break;
      }
      delay(50);
    }

    // DOWN: Turunkan nilai pada cursor aktif
    if (isButtonPressed(BTN_TIMER_DOWN) && g_timerSetMode) {
      switch (g_timerSetCursor) {
        case 0:
          g_timerSetValues[0] = (g_timerSetValues[0] - 1 + 24) % 24;
          break;
        case 1:
          g_timerSetValues[1] = (g_timerSetValues[1] - 1 + 60) % 60;
          break;
        case 2:
          g_timerSetValues[2] = max(g_timerSetValues[2] - 1, 1);
          break;
      }
      delay(50);
    }
  }
}

// ================================================================
//  SECTION 13 — DHT11: BACA SENSOR
// ================================================================

void sensorRead() {
  float totalTemp = 0, totalHum = 0;
  int validCount = 0;
  for (int i = 0; i < DHT_COUNT; i++) {
    float t = dhtSensors[i]->readTemperature();
    float h = dhtSensors[i]->readHumidity();
    // DHT11 range: -40°C ~ 80°C
    if (!isnan(t) && !isnan(h) && t > -40 && t < 80 && h >= 0 && h <= 100) {
      totalTemp += t;
      totalHum  += h;
      validCount++;
      Serial.printf("[DHT11] Suhu: %.1f°C  Kelembapan: %.1f%%\n", t, h);
    } else {
      Serial.printf("[DHT11] GAGAL BACA!\n");
    }
  }
  if (validCount > 0) {
    g_sensorOK     = true;
    g_validSensors = validCount;
    g_temp = totalTemp / validCount;
    g_hum  = totalHum / validCount;
  } else {
    g_sensorOK     = false;
    g_validSensors = 0;
    Serial.println("[DHT11] SENSOR GAGAL TERBACA!");
  }
}

// ================================================================
//  SECTION 14 — SUPABASE: KIRIM DATA SENSOR
// ================================================================

void supabaseSendSensor() {
  if (!g_wifiOK || !g_sensorOK) return;

  HTTPClient http;
  String url = String(SUPABASE_URL) +
               "/rest/v1/device_settings?device_id=eq." + DEVICE_ID;

  JsonDocument doc;
  doc["temperature"] = round(g_temp * 10.0) / 10.0;
  doc["humidity"]    = round(g_hum * 10.0) / 10.0;
  String body;
  serializeJson(doc, body);

  http.begin(url);
  http.addHeader("apikey", SUPABASE_KEY);
  http.addHeader("Authorization", String("Bearer ") + SUPABASE_KEY);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("Prefer", "return=minimal");

  int code = http.PATCH(body);
  if (code == 200 || code == 204)
    Serial.println("[SUPABASE] Sensor data terkirim OK");
  else
    Serial.printf("[SUPABASE] Sensor error HTTP: %d\n", code);
  http.end();
}

// ================================================================
//  SECTION 15 — SUPABASE: BACA STATUS POMPA DARI WEB
// ================================================================

void supabaseReadPump() {
  if (!g_wifiOK) return;

  HTTPClient http;
  String url = String(SUPABASE_URL) +
               "/rest/v1/device_status?device_id=eq." + DEVICE_ID +
               "&select=pump_active";

  http.begin(url);
  http.addHeader("apikey", SUPABASE_KEY);
  http.addHeader("Authorization", String("Bearer ") + SUPABASE_KEY);

  int code = http.GET();
  if (code == 200) {
    String body = http.getString();
    JsonDocument doc;
    DeserializationError err = deserializeJson(doc, body);
    if (!err && doc.is<JsonArray>() && doc.size() > 0) {
      bool newState = doc[0]["pump_active"].as<bool>();
      if (newState != g_pumpActive) {
        pumpSet(newState);
        updatePumpLEDs();
        Serial.printf("[SUPABASE] Pompa dari Web: %s\n",
                      newState ? "ON" : "OFF");
      }
    }
  }
  http.end();
}

// ================================================================
//  SECTION 16 — SUPABASE: KIRIM STATUS POMPA KE WEB
// ================================================================

void supabaseSendPumpStatus(bool state) {
  if (!g_wifiOK) return;
  HTTPClient http;
  String url = String(SUPABASE_URL) +
    "/rest/v1/device_status?device_id=eq." + DEVICE_ID;
  
  JsonDocument doc;
  doc["pump_active"] = state;
  
  // Kirim format ISO 8601 yang valid untuk kolom timestamptz
  String isoTime = getISOTimeStr();
  if (isoTime != "") {
    doc["last_sync"] = isoTime;
  }
  
  String body;
  serializeJson(doc, body);
  
  http.begin(url);
  http.addHeader("apikey", SUPABASE_KEY);
  http.addHeader("Authorization", String("Bearer ") + SUPABASE_KEY);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("Prefer", "return=minimal");
  
  int code = http.PATCH(body);
  if (code == 200 || code == 204)
    Serial.printf("[SUPABASE] Pump (%s) terkirim OK\n",
                  state ? "ON" : "OFF");
  else
    Serial.printf("[SUPABASE] Pump error HTTP: %d\n", code);
  http.end();
}

// ================================================================
//  SECTION 17 — SUPABASE: KIRIM MODE KE WEB
// ================================================================

void supabaseSendMode() {
  if (!g_wifiOK) return;

  HTTPClient http;
  String url = String(SUPABASE_URL) +
               "/rest/v1/device_settings?device_id=eq." + DEVICE_ID;

  const char *modeStr[] = {"manual", "auto", "timer"};
  JsonDocument doc;
  doc["mode"] = modeStr[g_currentMode];
  String body;
  serializeJson(doc, body);

  http.begin(url);
  http.addHeader("apikey", SUPABASE_KEY);
  http.addHeader("Authorization", String("Bearer ") + SUPABASE_KEY);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("Prefer", "return=minimal");

  int code = http.PATCH(body);
  if (code == 200 || code == 204)
    Serial.printf("[SUPABASE] Mode (%s) terkirim OK\n",
                  modeStr[g_currentMode]);
  else
    Serial.printf("[SUPABASE] Mode error HTTP: %d\n", code);
  http.end();
}

// ================================================================
//  SECTION 18 — SUPABASE: BACA MODE DARI WEB → UPDATE LED
// ================================================================
//
//  Fungsi ini dipanggil setiap 3 detik (INTERVAL_MODE_SYNC).
//  Jika user mengganti mode dari web (verdanist.my.id), maka:
//    1. g_currentMode diupdate
//    2. updateModeLEDs() → LED fisik langsung berubah
//    3. saveSettings() → Simpan ke EEPROM
//

void supabaseReadMode() {
  if (!g_wifiOK) return;

  HTTPClient http;
  String url = String(SUPABASE_URL) +
               "/rest/v1/device_settings?device_id=eq." + DEVICE_ID +
               "&select=mode,temp_threshold,hum_threshold";

  http.begin(url);
  http.addHeader("apikey", SUPABASE_KEY);
  http.addHeader("Authorization", String("Bearer ") + SUPABASE_KEY);

  int code = http.GET();
  if (code == 200) {
    String body = http.getString();
    JsonDocument doc;
    DeserializationError err = deserializeJson(doc, body);
    if (!err && doc.is<JsonArray>() && doc.size() > 0) {
      String modeStr = doc[0]["mode"].as<String>();
      Mode newMode;
      if (modeStr == "auto")       newMode = MODE_AUTO;
      else if (modeStr == "timer") newMode = MODE_TIMER;
      else                         newMode = MODE_MANUAL;

      if (newMode != g_currentMode) {
        g_currentMode = newMode;
        updateModeLEDs();   // ★ LED fisik ikut berubah!
        saveSettings();
        Serial.printf("[SUPABASE] Mode dari Web: %s → LED diupdate\n",
                      modeStr.c_str());
      }

      // Update threshold dari web
      if (doc[0].containsKey("temp_threshold") &&
          !doc[0]["temp_threshold"].isNull())
        g_tempThreshold = doc[0]["temp_threshold"].as<float>();
      if (doc[0].containsKey("hum_threshold") &&
          !doc[0]["hum_threshold"].isNull())
        g_humThreshold = doc[0]["hum_threshold"].as<float>();
    }
  }
  http.end();
}

// ================================================================
//  SECTION 19 — SUPABASE: CEK JADWAL TIMER
// ================================================================

void supabaseCheckSchedule() {
  if (!g_wifiOK || !g_ntpSynced || g_currentMode != MODE_TIMER) return;

  struct tm timeinfo;
  if (!getLocalTime(&timeinfo)) return;

  const char *hariList[] = {"Minggu", "Senin", "Selasa", "Rabu",
                            "Kamis",  "Jumat", "Sabtu"};
  String hariIni = hariList[timeinfo.tm_wday];

  HTTPClient http;
  String url = String(SUPABASE_URL) +
               "/rest/v1/pump_schedules?zone=eq.A&is_active=eq.true"
               "&select=start_time,duration,days";

  http.begin(url);
  http.addHeader("apikey", SUPABASE_KEY);
  http.addHeader("Authorization", String("Bearer ") + SUPABASE_KEY);

  int code = http.GET();
  if (code == 200) {
    String body = http.getString();
    JsonDocument doc;
    DeserializationError err = deserializeJson(doc, body);
    if (!err && doc.is<JsonArray>()) {
      bool shouldPumpOn = false;

      for (JsonObject schedule : doc.as<JsonArray>()) {
        String startTime = schedule["start_time"].as<String>();
        int duration     = schedule["duration"].as<int>();
        String days      = schedule["days"].as<String>();

        bool dayMatch = (days.indexOf(hariIni) >= 0) || days.length() == 0;
        if (!dayMatch) continue;

        int schedH    = startTime.substring(0, 2).toInt();
        int schedM    = startTime.substring(3, 5).toInt();
        int nowMins   = timeinfo.tm_hour * 60 + timeinfo.tm_min;
        int schedMins = schedH * 60 + schedM;
        int endMins   = schedMins + duration;

        if (nowMins >= schedMins && nowMins < endMins) {
          shouldPumpOn = true;
          break;
        }
      }

      if (shouldPumpOn && !g_pumpActive) {
        pumpSet(true);
        supabaseSendPumpStatus(true);
        Serial.println("[TIMER] Jadwal aktif → Pompa ON");
      } else if (!shouldPumpOn && g_pumpActive &&
                 g_currentMode == MODE_TIMER) {
        pumpSet(false);
        supabaseSendPumpStatus(false);
        Serial.println("[TIMER] Jadwal selesai → Pompa OFF");
      }
    }
  }
  http.end();
}

// ================================================================
//  SECTION 20 — LOGIKA MODE AUTO
// ================================================================
//
//  Pompa ON jika:  suhu >= threshold  ATAU  kelembapan <= threshold
//  Pompa OFF jika: suhu < threshold  DAN  kelembapan > threshold
//

void processAutoMode() {
  if (g_currentMode != MODE_AUTO || !g_sensorOK) return;

  if (!g_pumpActive &&
      (g_temp >= g_tempThreshold || g_hum <= g_humThreshold)) {
    pumpSet(true);
    supabaseSendPumpStatus(true);
    Serial.printf("[AUTO] Threshold tercapai (T:%.1f>=%.1f / H:%.1f<=%.1f) "
                  "→ Pompa ON\n",
                  g_temp, g_tempThreshold, g_hum, g_humThreshold);
  } else if (g_pumpActive &&
             g_temp < g_tempThreshold && g_hum > g_humThreshold) {
    pumpSet(false);
    supabaseSendPumpStatus(false);
    Serial.printf("[AUTO] Kondisi normal → Pompa OFF\n");
  }
}

// ================================================================
//  SECTION 21 — SAFETY AUTO-OFF (Mode Manual)
// ================================================================

void processSafetyOff() {
  if (!g_pumpActive) return;
  if (g_currentMode == MODE_MANUAL) {
    if (millis() - g_pumpOnTime >= PUMP_SAFETY_MS) {
      Serial.println("[SAFETY] >30 detik Manual → Auto-OFF");
      pumpSet(false);
      supabaseSendPumpStatus(false);
    }
  }
}

// ================================================================
//  SECTION 22 — TFT ILI9488 3.5" DISPLAY (480×320)
// ================================================================

// ── Color Palette (RGB565) ──
#define CLR_BG       0x1082   // Dark background (#10 10 10)
#define CLR_CARD     0x2104   // Card background (#20 20 20)
#define CLR_PRIMARY  0x3666   // Teal/green accent
#define CLR_TEXT     0xFFFF   // White text
#define CLR_MUTED    0x7BEF   // Muted gray
#define CLR_DANGER   0xF800   // Red
#define CLR_WARNING  0xFDA0   // Orange/amber
#define CLR_SUCCESS  0x07E0   // Green

void displayInit() {
  tft.init();
  tft.setRotation(1);   // Landscape: 480×320
  tft.fillScreen(CLR_BG);

  // ── Splash Screen ──
  tft.setTextDatum(MC_DATUM);

  tft.setTextColor(CLR_PRIMARY, CLR_BG);
  tft.setTextSize(1);
  tft.drawString("~", 240, 80);

  tft.setTextColor(CLR_TEXT, CLR_BG);
  tft.setTextSize(3);
  tft.drawString("VERDANIST", 240, 130);

  tft.setTextSize(1);
  tft.setTextColor(CLR_PRIMARY, CLR_BG);
  tft.drawString("Smart for Every System", 240, 170);

  tft.setTextColor(CLR_MUTED, CLR_BG);
  tft.drawString("Indoor Controller v3.0", 240, 200);

  tft.setTextColor(CLR_MUTED, CLR_BG);
  tft.drawString("Initializing hardware...", 240, 260);

  delay(2500);
  tft.fillScreen(CLR_BG);
  Serial.println("[TFT] Display ILI9488 initialized (480x320, SPI)");
}

void displayUpdate() {
  tft.fillScreen(CLR_BG);

  // ── Header ──
  tft.setTextDatum(TL_DATUM);
  tft.setTextSize(2);
  tft.setTextColor(CLR_PRIMARY, CLR_BG);
  tft.drawString("VERDANIST INDOOR", 10, 8);

  tft.setTextDatum(TR_DATUM);
  tft.setTextColor(CLR_TEXT, CLR_BG);
  tft.drawString(getCurrentTimeStr(), 470, 8);

  // Garis separator
  tft.drawLine(10, 32, 470, 32, CLR_PRIMARY);

  // ── Status Bar ──
  tft.setTextDatum(TL_DATUM);
  tft.setTextSize(1);

  // WiFi status
  tft.setTextColor(g_wifiOK ? CLR_SUCCESS : CLR_DANGER, CLR_BG);
  tft.drawString(g_wifiOK ? "WiFi: OK" : "WiFi: Offline", 10, 40);

  // NTP status
  tft.setTextColor(g_ntpSynced ? CLR_SUCCESS : CLR_WARNING, CLR_BG);
  tft.drawString(g_ntpSynced ? "NTP: Synced" : "NTP: Waiting", 130, 40);

  // Sensor count
  tft.setTextColor(g_sensorOK ? CLR_SUCCESS : CLR_DANGER, CLR_BG);
  char sensorStr[24];
  sprintf(sensorStr, "Sensor: %d OK", g_validSensors);
  tft.drawString(sensorStr, 270, 40);

  // ── Suhu Card (Kiri) ──
  tft.fillRoundRect(10, 62, 225, 100, 12, CLR_CARD);
  tft.setTextSize(1);
  tft.setTextColor(CLR_MUTED, CLR_CARD);
  tft.drawString("SUHU RUANGAN", 25, 74);
  tft.setTextSize(4);
  tft.setTextColor(CLR_TEXT, CLR_CARD);
  if (g_sensorOK) {
    char ts[10];
    sprintf(ts, "%.1f", g_temp);
    tft.drawString(ts, 25, 98);
    tft.setTextSize(2);
    tft.setTextColor(CLR_MUTED, CLR_CARD);
    tft.drawString("C", 185, 105);
  } else {
    tft.drawString("--.-", 25, 98);
  }

  // ── Kelembapan Card (Kanan) ──
  tft.fillRoundRect(245, 62, 225, 100, 12, CLR_CARD);
  tft.setTextSize(1);
  tft.setTextColor(CLR_MUTED, CLR_CARD);
  tft.drawString("KELEMBAPAN RUANGAN", 260, 74);
  tft.setTextSize(4);
  tft.setTextColor(CLR_TEXT, CLR_CARD);
  if (g_sensorOK) {
    char hs[10];
    sprintf(hs, "%.1f", g_hum);
    tft.drawString(hs, 260, 98);
    tft.setTextSize(2);
    tft.setTextColor(CLR_MUTED, CLR_CARD);
    tft.drawString("%", 420, 105);
  } else {
    tft.drawString("--.-", 260, 98);
  }

  // ── Threshold Info ──
  tft.setTextSize(1);
  tft.setTextColor(CLR_MUTED, CLR_BG);
  char threshStr[48];
  sprintf(threshStr, "Threshold: %.1fC / %.1f%%", g_tempThreshold,
          g_humThreshold);
  tft.drawString(threshStr, 10, 170);

  // ── Pump Status Bar ──
  uint16_t pumpColor = g_pumpActive ? CLR_PRIMARY : CLR_CARD;
  tft.fillRoundRect(10, 186, 460, 50, 12, pumpColor);
  tft.setTextDatum(MC_DATUM);
  tft.setTextSize(2);
  uint16_t pumpTextColor = g_pumpActive ? 0x0000 : CLR_TEXT;
  tft.setTextColor(pumpTextColor, pumpColor);
  if (g_pumpActive) {
    tft.drawString("POMPA AKTIF", 240, 211);
  } else {
    tft.drawString("POMPA MATI", 240, 211);
  }

  // ── Mode Indicator ──
  const char *modeLabels[] = {"MANUAL", "AUTO", "TIMER"};
  tft.fillRoundRect(10, 248, 460, 30, 10, CLR_CARD);
  tft.setTextDatum(MC_DATUM);
  tft.setTextSize(1);
  tft.setTextColor(CLR_MUTED, CLR_CARD);
  tft.drawString("MODE:", 50, 263);

  // Tampilkan 3 mode, highlight yang aktif
  int modeX[] = {160, 270, 380};
  for (int i = 0; i < 3; i++) {
    if (i == (int)g_currentMode) {
      tft.fillRoundRect(modeX[i] - 45, 250, 90, 26, 8, CLR_PRIMARY);
      tft.setTextColor(0x0000, CLR_PRIMARY);
    } else {
      tft.setTextColor(CLR_MUTED, CLR_CARD);
    }
    tft.setTextSize(1);
    tft.drawString(modeLabels[i], modeX[i], 263);
  }

  // ── Timer Setting Overlay (saat g_timerSetMode aktif) ──
  if (g_timerSetMode && g_currentMode == MODE_TIMER) {
    tft.fillRoundRect(10, 286, 460, 30, 10, CLR_WARNING);
    tft.setTextDatum(MC_DATUM);
    tft.setTextSize(1);
    tft.setTextColor(0x0000, CLR_WARNING);
    char timerStr[48];
    const char *cursorLabel[] = {"[JAM]", "[MENIT]", "[DURASI]"};
    sprintf(timerStr, "SET: %02d:%02d  Dur:%dmin  %s",
            g_timerSetValues[0], g_timerSetValues[1],
            g_timerSetValues[2], cursorLabel[g_timerSetCursor]);
    tft.drawString(timerStr, 240, 301);
  } else if (g_currentMode == MODE_TIMER) {
    // Tampilkan jadwal timer aktif
    tft.fillRoundRect(10, 286, 460, 30, 10, CLR_CARD);
    tft.setTextDatum(MC_DATUM);
    tft.setTextSize(1);
    tft.setTextColor(CLR_MUTED, CLR_CARD);
    char timerInfo[48];
    sprintf(timerInfo, "Timer: %02d:%02d  Durasi: %d menit",
            g_timerHour, g_timerMinute, g_timerDuration);
    tft.drawString(timerInfo, 240, 301);
  }
}

// ================================================================
//  SECTION 23 — SETUP
// ================================================================

void setup() {
   // ★ WAJIB: Matikan Brownout Detector agar tidak restart saat WiFi & Sensor aktif
  WRITE_PERI_REG(RTC_CNTL_BROWN_OUT_REG, 0); 
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n============================================");
  Serial.println("  VERDANIST - ESP32 Indoor Controller v3.0");
  Serial.println("  Smart for Every System");
  Serial.println("  TFT ILI9488 3.5\" + 1xDHT11 + LED Buttons");
  Serial.println("============================================");

  // 1. Konfigurasi semua pin
  setupPins();
  for (int i = 0; i < 40; i++) {
    g_lastBtnState[i] = HIGH;
  }
  pumpSet(false);  // Pastikan pompa OFF saat boot

  // 2. Inisialisasi sensor DHT
  dht1.begin();
  dht2.begin();   // BARU
  dht3.begin();   // BARU
  Serial.printf("[DHT11] 3 sensor aktif di GPIO %d, %d, %d\n", PIN_DHT1, PIN_DHT2, PIN_DHT3);

  // 3. Inisialisasi TFT Display (splash screen)
  displayInit();

  // 4. Load settings dari EEPROM
  loadSettings();

  // 5. Nyalakan LED sesuai mode tersimpan
  updateModeLEDs();
  updatePumpLEDs();
  Serial.printf("[LED] Mode awal: %s\n",
                g_currentMode == MODE_MANUAL ? "MANUAL" :
                g_currentMode == MODE_AUTO   ? "AUTO" : "TIMER");

  // 6. Koneksi WiFi
  wifiConnect();

  // 7. Sinkronisasi NTP
  ntpSync();

  // 8. Baca sensor pertama kali
  sensorRead();

  Serial.println("============================================");
  Serial.println("  Setup selesai — Loop dimulai!");
  Serial.println("  Tekan tombol Mode untuk mengganti mode.");
  Serial.println("  Perubahan dari web akan update LED fisik.");
  Serial.println("============================================\n");

  // 9. Tampilkan data pertama kali di display
  displayUpdate();
}

// ================================================================
//  SECTION 24 — LOOP UTAMA
// ================================================================

void loop() {
  unsigned long now = millis();

  // 1. Proses semua tombol fisik
  processButtons();

  // 2. Cek & maintain WiFi connection
  if (now - lastWifiCheck >= INTERVAL_WIFI_CHECK) {
    lastWifiCheck = now;
    wifiMaintain();
    if (g_wifiOK && !g_ntpSynced) ntpSync();
  }

  // 3. Baca status pompa dari web (sinkronisasi 2-arah)
  if (now - lastPumpCheck >= INTERVAL_PUMP_CHECK) {
    lastPumpCheck = now;
    supabaseReadPump();
  }

  // 4. Baca sensor & kirim ke web
  if (now - lastSensorSend >= INTERVAL_SENSOR_SEND) {
    lastSensorSend = now;
    sensorRead();
    supabaseSendSensor();
  }

  // 5. Sinkronisasi mode dari web → update LED fisik
  if (now - lastModeSync >= INTERVAL_MODE_SYNC) {
    lastModeSync = now;
    supabaseReadMode();
  }

  // 6. Cek jadwal timer
  if (now - lastScheduleChk >= INTERVAL_SCHEDULE_CHK) {
    lastScheduleChk = now;
    supabaseCheckSchedule();
  }

  // 7. Logika auto mode (kontrol pompa berdasarkan sensor)
  processAutoMode();

  // 8. Safety auto-off (mode manual)
  processSafetyOff();

  // 9. Update tampilan TFT
  if (now - lastDisplayUpd >= INTERVAL_DISPLAY) {
    lastDisplayUpd = now;
    displayUpdate();
  }

  delay(20);  // Stabilisasi loop
}