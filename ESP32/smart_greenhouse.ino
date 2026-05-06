/*
 * Smart Greenhouse ESP32 Controller
 * 
 * This ESP32 acts as a client that polls Supabase for pump control commands
 * It reads pump_status from device_settings table and controls relay accordingly
 * 
 * Hardware Requirements:
 * - ESP32 Board
 * - Relay Module (connected to GPIO 5)
 * - WiFi Connection
 * 
 * Library Requirements:
 * - WiFi.h (built-in)
 * - HTTPClient.h (built-in) 
 * - ArduinoJson (install via Library Manager)
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// WiFi Configuration - GANTI DENGAN WiFi ANDA
const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// Supabase Configuration - GANTI DENGAN DATA SUPABASE ANDA
const String SUPABASE_URL = "https://YOUR_PROJECT.supabase.co";
const String SUPABASE_KEY = "YOUR_SUPABASE_ANON_KEY";

// Device Configuration
const String DEVICE_ID = "ESP32_INDOOR"; // GANTI jadi ESP32_OUTDOOR untuk unit outdoor

// Hardware Configuration
const int RELAY_PIN = 5; // GPIO pin untuk relay

// Relay Type Configuration
// true = relay ON when pin is HIGH (active-high)
// false = relay ON when pin is LOW (active-low) 
const bool RELAY_ACTIVE_HIGH = false; // SESUAIKAN dengan jenis relay Anda

// Global Variables
unsigned long lastPollTime = 0;
const unsigned long POLL_INTERVAL = 5000; // 5 detik
bool currentPumpStatus = false;

void setup() {
  Serial.begin(115200);
  Serial.println("=== Smart Greenhouse ESP32 Starting ===");
  
  // Setup Relay Pin
  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, RELAY_ACTIVE_HIGH ? LOW : HIGH); // Initial state: OFF
  
  // Connect to WiFi
  connectWiFi();
  
  Serial.println("Setup completed! Starting main loop...");
}

void loop() {
  // Check WiFi connection
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi disconnected! Reconnecting...");
    connectWiFi();
  }
  
  // Poll Supabase every 5 seconds
  unsigned long currentTime = millis();
  if (currentTime - lastPollTime >= POLL_INTERVAL) {
    lastPollTime = currentTime;
    pollSupabase();
  }
  
  delay(100); // Small delay to prevent overwhelming the loop
}

void connectWiFi() {
  Serial.print("Connecting to WiFi: ");
  Serial.println(WIFI_SSID);
  
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println();
    Serial.print("WiFi connected! IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println();
    Serial.println("Failed to connect to WiFi!");
  }
}

void pollSupabase() {
  Serial.println("\n--- Polling Supabase ---");
  
  HTTPClient http;
  
  // Build Supabase REST API URL
  String url = SUPABASE_URL + "/rest/v1/device_settings";
  url += "?device_id=eq." + DEVICE_ID;
  url += "&select=pump_status";
  
  Serial.println("Request URL: " + url);
  
  // Configure HTTP headers
  http.begin(url);
  http.addHeader("apikey", SUPABASE_KEY);
  http.addHeader("Authorization", "Bearer " + SUPABASE_KEY);
  http.addHeader("Content-Type", "application/json");
  
  // Send GET request
  int httpResponseCode = http.GET();
  
  if (httpResponseCode == 200) {
    String payload = http.getString();
    Serial.println("Response payload: " + payload);
    
    // Parse JSON response
    parseSupabaseResponse(payload);
  } else {
    Serial.print("HTTP Error: ");
    Serial.println(httpResponseCode);
    Serial.println("Error payload: " + http.getString());
  }
  
  http.end();
}

void parseSupabaseResponse(String payload) {
  // Parse JSON using ArduinoJson
  DynamicJsonDocument doc(1024);
  
  DeserializationError error = deserializeJson(doc, payload);
  
  if (error) {
    Serial.print("JSON Parsing Error: ");
    Serial.println(error.c_str());
    return;
  }
  
  // Check if we got valid data
  if (doc.is<JsonArray>() && doc.size() > 0) {
    JsonObject device = doc[0];
    
    if (device.containsKey("pump_status")) {
      bool newPumpStatus = device["pump_status"];
      
      Serial.print("Current pump_status: ");
      Serial.print(currentPumpStatus ? "true" : "false");
      Serial.print(", New pump_status: ");
      Serial.println(newPumpStatus ? "true" : "false");
      
      // Only update relay if status changed
      if (newPumpStatus != currentPumpStatus) {
        currentPumpStatus = newPumpStatus;
        controlRelay(currentPumpStatus);
      } else {
        Serial.println("Pump status unchanged, no action needed");
      }
    } else {
      Serial.println("No pump_status field in response");
    }
  } else {
    Serial.println("Invalid or empty response from Supabase");
  }
}

void controlRelay(bool turnOn) {
  Serial.print("Controlling relay - Turn ");
  Serial.println(turnOn ? "ON" : "OFF");
  
  if (turnOn) {
    // Turn relay ON
    if (RELAY_ACTIVE_HIGH) {
      digitalWrite(RELAY_PIN, HIGH);
    } else {
      digitalWrite(RELAY_PIN, LOW);
    }
    Serial.println("Relay activated - Pump should be ON");
  } else {
    // Turn relay OFF
    if (RELAY_ACTIVE_HIGH) {
      digitalWrite(RELAY_PIN, LOW);
    } else {
      digitalWrite(RELAY_PIN, HIGH);
    }
    Serial.println("Relay deactivated - Pump should be OFF");
  }
  
  // Visual feedback on built-in LED
  if (turnOn) {
    digitalWrite(LED_BUILTIN, HIGH); // LED ON when pump is ON
  } else {
    digitalWrite(LED_BUILTIN, LOW);  // LED OFF when pump is OFF
  }
}
