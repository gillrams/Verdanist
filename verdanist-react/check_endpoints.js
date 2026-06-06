import fs from 'fs';

const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    env[parts[0].trim()] = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
  }
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY;

async function check() {
  const res = await fetch(supabaseUrl + '/rest/v1/', {
    headers: {
      'apikey': supabaseKey,
      'Authorization': 'Bearer ' + supabaseKey
    }
  });
  console.log('Status:', res.status);
  const spec = await res.json();
  console.log('Response:', spec);
}
check();
