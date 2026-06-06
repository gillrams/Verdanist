import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase.from('device_settings').select('*');
  console.log('device_settings:', data);

  // Since we can't easily query pg_trigger from anon client, we'll write a quick REST call
  // using postgres meta or just look at the code from previous session
}
check();
