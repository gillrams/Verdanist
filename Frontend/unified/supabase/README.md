# Verdanist Supabase Integration Setup

This guide walks you through setting up Supabase as the Backend-as-a-Service (BaaS) for the Verdanist Smart Greenhouse System.

## Quick Start

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Name: `verdanist-persada-farm`
4. Choose a region closest to your users (e.g., Singapore for Indonesia)
5. Wait for the project to be created (~2 minutes)

### 2. Get Your API Keys

Once the project is ready:

1. Go to **Project Settings** → **API**
2. Copy these values:
   - **Project URL**: `https://xxxxxxxx.supabase.co`
   - **anon/public key**: `eyJhbG...` (starts with eyJ)

### 3. Configure Frontend

Open `js/supabase-client.js` and replace the placeholders:

```javascript
const SUPABASE_URL = 'https://your-project-ref.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key-here';
```

## Database Setup

### Run the Migration

1. In Supabase Dashboard, go to **SQL Editor**
2. Click **New Query**
3. Open the file `supabase/migrations/001_initial_schema.sql` from this project
4. Copy the entire content and paste into the SQL Editor
5. Click **Run**

This creates:
- `profiles` - User profile data (extends auth.users)
- `sensor_readings` - IoT sensor data (temperature, humidity, soil moisture)
- `pump_logs` - Pump activity logs
- `system_settings` - User preferences and thresholds
- `schedules` - Irrigation schedules

### Enable Realtime (Optional but Recommended)

For live sensor updates on the dashboard:

1. Go to **Database** → **Replication**
2. Enable realtime for tables:
   - `sensor_readings`
   - `pump_logs`

## Authentication Setup

### Email/Password Auth

Already enabled by default. No configuration needed.

### Google OAuth (Optional)

For Google Sign-In:

1. Go to **Authentication** → **Providers**
2. Enable **Google**
3. Add your Google Client ID and Secret
4. Set callback URL: `https://your-project-ref.supabase.co/auth/v1/callback`
5. Add authorized redirect URI in Google Cloud Console

## Testing the Integration

### 1. Test Authentication

1. Open `login.html` in browser
2. Try signing up with email/password
3. Check **Authentication** → **Users** in Supabase dashboard
4. Verify user appears in the list

### 2. Test Database

Insert test sensor data via SQL Editor:

```sql
INSERT INTO sensor_readings (zone, type, value, unit)
VALUES 
  ('A', 'temperature', 28.5, '°C'),
  ('A', 'humidity', 72, '%'),
  ('B', 'soil_moisture', 65, '%');
```

Check that dashboard displays these values.

### 3. Test Realtime

With dashboard open, run this in SQL Editor:

```sql
INSERT INTO sensor_readings (zone, type, value, unit)
VALUES ('A', 'temperature', 30.0, '°C');
```

The dashboard temperature should update automatically.

## Data Retention

Sensor data is automatically cleaned up after 60 days (configurable in migration). To adjust:

```sql
-- Change retention to 30 days
SELECT cron.schedule(
  'cleanup-old-sensor-readings',
  '0 3 * * *',
  $$ DELETE FROM sensor_readings WHERE recorded_at < NOW() - INTERVAL '30 days' $$
);
```

## IoT Integration

### Sending Sensor Data from Hardware

Use the Supabase REST API from your IoT device:

```bash
curl -X POST 'https://your-project-ref.supabase.co/rest/v1/sensor_readings' \
  -H "apikey: your-anon-key" \
  -H "Authorization: Bearer your-anon-key" \
  -H "Content-Type: application/json" \
  -d '{"zone": "A", "type": "temperature", "value": 28.5, "unit": "°C"}'
```

Or use the Supabase client library for your IoT platform (Arduino, Raspberry Pi, etc.).

## Security Notes

- **RLS Policies**: All tables have Row Level Security enabled - users can only access their own data
- **API Keys**: The `anon` key is safe to expose in frontend code (RLS protects data)
- **Service Role Key**: Never expose this in frontend - only for server-side operations

## Troubleshooting

### "Failed to fetch" errors
- Check that `SUPABASE_URL` and `SUPABASE_ANON_KEY` are correct
- Ensure no typos or extra spaces

### Authentication not working
- Verify Auth is enabled in Supabase dashboard
- Check browser console for specific error messages

### Realtime not updating
- Confirm realtime is enabled for the table
- Check browser console for subscription errors

## Architecture Overview

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   IoT       │────▶│  Supabase   │◀────│   Web App   │
│  Sensors    │     │   (BaaS)    │     │ (Dashboard) │
└─────────────┘     │  • Auth     │     └─────────────┘
                    │  • Database │
                    │  • Realtime │
                    └─────────────┘
```

## Support

- [Supabase Docs](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)

---

**Verdanist - Persada Farm Smart Greenhouse System**
Powered by Supabase
