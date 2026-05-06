/*
 * Smart Greenhouse ESP32 Controller
 * 
 * Tugas ESP32:
 * 1. Poll Supabase tiap 5 detik -> ambil pump_status -> kontrol relay
 * 2. Baca sensor DHT11/DHT22 tiap 10 detik -> kirim temp/humidity ke Supabase
 * 
 * Library yang harus di-install:
 * - ArduinoJson (Library Manager)
 * - DHT sensor library by Adafruit (Library Manager)
 * - Adafruit Unified Sensor (auto-install dependency)
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <DHT.h>

// ================= KONFIGURASI =================

// WiFi
const char* WIFI_SSID     = "TEKOM1";
const char* WIFI_PASSWORD = "12345678";

// Supabase (dari Project Settings > API)
const String SUPABASE_URL = "https://pzktyggopmvyrkwcnwfo.supabase.co";
const String SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB6a3R5Z2dvcG12eXJrd2Nud2ZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4ODA3NDEsImV4cCI6MjA5MjQ1Njc0MX0.p-h9x0mswjwjremYia7idtaPpLdi7IEdh7an36UKmEc";

// Device
const String DEVICE_ID = "ESP32_INDOOR";  // atau "ESP32_OUTDOOR"

// Pin hardware
const int RELAY_PIN = 5;   // Relay ke GPIO 5
const int DHT_PIN   = 4;   // DHT sensor ke GPIO 4
const int LED_PIN   = 2;   // LED bawaan ESP32 (GPIO 2)

// Pilih sensor DHT (uncomment salah satu)
#define DHT_TYPE DHT11
// #define DHT_TYPE DHT22

// Tipe relay: true=active-high, false=active-low
const bool RELAY_ACTIVE_HIGH = false;

// ================= VARIABEL GLOBAL =================

unsigned long lastPollTime   = 0;
unsigned long lastSensorTime = 0;
const unsigned long POLL_INTERVAL    = 5000;   // 5 detik
const unsigned long SENSOR_INTERVAL  = 10000;  // 10 detik

bool currentPumpStatus = false;
DHT dht(DHT_PIN, DHT_TYPE);

// ================= SETUP =================

void setup() {
  Serial.begin(115200);
  Serial.println("\n=== Smart Greenhouse ESP32 ===");

  // Pin setup
  pinMode(RELAY_PIN, OUTPUT);
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, RELAY_ACTIVE_HIGH ? LOW : HIGH);
  digitalWrite(LED_PIN, LOW);

  // Test LED nyala sebentar
  digitalWrite(LED_PIN, HIGH);
  delay(1000);
  digitalWrite(LED_PIN, LOW);

  // Init DHT
  dht.begin();
  Serial.println("DHT sensor ready on GPIO " + String(DHT_PIN));

  // Connect WiFi
  connectWiFi();

  Serial.println("Setup done. Running loop...\n");
}

// ================= LOOP UTAMA =================

void loop() {
  // Reconnect WiFi kalau putus
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi putus! Reconnecting...");
    connectWiFi();
  }

  unsigned long now = millis();

  // 1. Poll pump status tiap 5 detik
  if (now - lastPollTime >= POLL_INTERVAL) {
    lastPollTime = now;
    checkPumpStatus();
  }

  // 2. Baca sensor tiap 10 detik
  if (now - lastSensorTime >= SENSOR_INTERVAL) {
    lastSensorTime = now;
    readAndSendSensor();
  }

  delay(100);
}

// ================= WIFI =================

void connectWiFi() {
  Serial.print("Connecting to ");
  Serial.print(WIFI_SSID);

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi OK! IP: " + WiFi.localIP().toString());
  } else {
    Serial.println("\nWiFi gagal connect!");
  }
}

// ================= PUMP CONTROL =================

void checkPumpStatus() {
  Serial.println("--- Check Pump Status ---");

  HTTPClient http;
  String url = SUPABASE_URL + "/rest/v1/device_settings?device_id=eq." + DEVICE_ID + "&select=pump_status";

  http.begin(url);
  http.addHeader("apikey", SUPABASE_KEY);
  http.addHeader("Authorization", "Bearer " + SUPABASE_KEY);

  int code = http.GET();

  if (code == 200) {
    String payload = http.getString();
    Serial.println("Response: " + payload);

    DynamicJsonDocument doc(1024);
    DeserializationError err = deserializeJson(doc, payload);

    if (!err && doc.is<JsonArray>() && doc.size() > 0) {
      bool newStatus = doc[0]["pump_status"];

      if (newStatus != currentPumpStatus) {
        currentPumpStatus = newStatus;
        setRelay(currentPumpStatus);
      } else {
        Serial.println("Pump status sama, tidak berubah");
      }
    }
  } else {
    Serial.println("HTTP Error: " + String(code));
  }

  http.end();
}

void setRelay(bool turnOn) {
  Serial.print("Relay -> ");
  Serial.println(turnOn ? "ON" : "OFF");

  if (RELAY_ACTIVE_HIGH) {
    digitalWrite(RELAY_PIN, turnOn ? HIGH : LOW);
  } else {
    digitalWrite(RELAY_PIN, turnOn ? LOW : HIGH);
  }

  // LED indicator
  digitalWrite(LED_PIN, turnOn ? HIGH : LOW);
}

// ================= SENSOR DHT =================

void readAndSendSensor() {
  Serial.println("--- Read DHT Sensor ---");

  float temp = dht.readTemperature();
  float hum  = dht.readHumidity();

  if (isnan(temp) || isnan(hum)) {
    Serial.println("DHT read failed! Check wiring.");
    return;
  }

  Serial.println("Temp: " + String(temp) + " C, Hum: " + String(hum) + " %");

  // Kirim ke Supabase
  HTTPClient http;
  String url = SUPABASE_URL + "/rest/v1/device_settings?device_id=eq." + DEVICE_ID;

  DynamicJsonDocument doc(256);
  doc["temperature"] = temp;
  doc["humidity"]    = hum;

  String payload;
  serializeJson(doc, payload);

  http.begin(url);
  http.addHeader("apikey", SUPABASE_KEY);
  http.addHeader("Authorization", "Bearer " + SUPABASE_KEY);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("Prefer", "return=minimal");

  int code = http.PATCH(payload);

  if (code == 200 || code == 204) {
    Serial.println("Sensor data sent OK!");
  } else {
    Serial.println("Send failed! HTTP: " + String(code));
  }

  http.end();
}
