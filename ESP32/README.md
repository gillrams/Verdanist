# Smart Greenhouse ESP32 Controller

## Overview
ESP32 microcontroller that acts as a client for Smart Greenhouse system.
- **Pump Control**: Polls Supabase every 5 seconds for pump_status and controls relay
- **Sensor Monitoring**: Reads DHT11/DHT22 sensor every 10 seconds and sends temperature/humidity to Supabase

## Hardware Requirements
- ESP32 Development Board
- Relay Module (5V or 3.3V)
- DHT11 or DHT22 Temperature/Humidity Sensor
- Jumper Wires
- Power Supply for ESP32, Relay, and Sensor

## Wiring Diagram

### Relay Module
```
ESP32    ->    Relay Module
GPIO 5   ->    IN (Signal)
3.3V     ->    VCC (if 3.3V relay) or 5V (if 5V relay)
GND      ->    GND
```

### DHT Sensor (DHT11/DHT22)
```
ESP32    ->    DHT Sensor
GPIO 4   ->    DATA/OUT
3.3V     ->    VCC (+)
GND      ->    GND (-)
```
**Note**: If using bare DHT sensor (not module), add 10k Ohm pull-up resistor between VCC and DATA pins.

## Software Requirements
- Arduino IDE
- ESP32 Board Manager (add: https://dl.espressif.com/dl/package_esp32_index.json)
- ArduinoJson Library (install via Library Manager)
- DHT sensor library by Adafruit (install via Library Manager)
- Adafruit Unified Sensor (dependency, auto-installed)

## Configuration

### 1. WiFi Settings
Update these lines in `smart_greenhouse.ino`:
```cpp
const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
```

### 2. Supabase Settings
Get these from your Supabase project:
1. Go to Project Settings > API
2. Copy Project URL and anon/public key

Update these lines:
```cpp
const String SUPABASE_URL = "https://YOUR_PROJECT.supabase.co";
const String SUPABASE_KEY = "YOUR_SUPABASE_ANON_KEY";
```

### 3. Device Configuration
```cpp
const String DEVICE_ID = "ESP32_INDOOR"; // or "ESP32_OUTDOOR"
```

### 4. Relay Configuration
```cpp
const bool RELAY_ACTIVE_HIGH = false; // true for active-high, false for active-low
```

### 5. DHT Sensor Configuration
```cpp
// Uncomment sesuai sensor yang digunakan:
#define DHT_TYPE DHT11   // untuk DHT11
// #define DHT_TYPE DHT22   // untuk DHT22 (AM2302)
```

## Installation Steps

### 1. Install Arduino IDE
Download and install Arduino IDE from https://www.arduino.cc/en/software

### 2. Add ESP32 Board Support
1. Open Arduino IDE
2. Go to File > Preferences
3. Add this URL to Additional Board Manager URLs:
   ```
   https://dl.espressif.com/dl/package_esp32_index.json
   ```
4. Go to Tools > Board > Boards Manager
5. Search for "ESP32" and install "ESP32 by Espressif Systems"

### 3. Install ArduinoJson Library
1. Go to Tools > Manage Libraries
2. Search for "ArduinoJson"
3. Install "ArduinoJson by Benoit Blanchon"

### 4. Configure and Upload
1. Open `smart_greenhouse.ino`
2. Update configuration settings (WiFi, Supabase, Device ID)
3. Select Board: Tools > Board > ESP32 Arduino > ESP32 Dev Module
4. Select Port: Choose your ESP32's COM port
5. Upload the code

## How It Works

### Polling Mechanism
- Every 5 seconds, ESP32 sends HTTP GET request to Supabase
- URL format: `https://YOUR_PROJECT.supabase.co/rest/v1/device_settings?device_id=eq.ESP32_INDOOR&select=pump_status`
- Response is parsed as JSON to extract `pump_status` value

### Relay Control
- If `pump_status` = `true` → Relay activated → Pump ON
- If `pump_status` = `false` → Relay deactivated → Pump OFF
- Built-in LED mirrors pump status (ON = pump ON, OFF = pump OFF)

### Error Handling
- WiFi reconnection if disconnected
- HTTP error logging
- JSON parsing error handling
- Invalid response detection

## Serial Monitor Output
Open Serial Monitor (115200 baud) to see:
- WiFi connection status
- HTTP requests and responses
- JSON parsing results
- Relay control actions
- Error messages

## Troubleshooting

### WiFi Issues
- Check SSID and password spelling
- Ensure WiFi network is available
- Try moving ESP32 closer to router

### Supabase Connection Issues
- Verify SUPABASE_URL is correct (no trailing slash)
- Check SUPABASE_KEY is the anon/public key, not service role key
- Ensure device_id exists in device_settings table
- Check RLS policies allow anonymous access to device_settings table

### Relay Issues
- Verify wiring connections
- Check relay power supply
- Try different RELAY_ACTIVE_HIGH setting
- Test relay with manual control first

### JSON Parsing Issues
- Check ArduinoJson library version (6.x recommended)
- Ensure response format is valid JSON array
- Monitor serial output for parsing errors

## Database Schema Reference

### device_settings Table
```sql
CREATE TABLE device_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id TEXT NOT NULL,
  mode TEXT NOT NULL DEFAULT 'manual',
  pump_status BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

## Security Notes
- Using anon/public key (read-only access)
- Device only reads pump_status, cannot modify settings
- Consider adding device authentication for production
- HTTPS encryption for all API calls

## Next Steps
- Add sensor reading capabilities (temperature, humidity)
- Implement OTA updates
- Add local fail-safe mechanisms
- Implement device heartbeat monitoring
