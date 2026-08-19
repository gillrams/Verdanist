import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('MASUKKAN')) {
  console.warn('⚠️ Supabase URL or Anon Key is missing. Please check your .env.local file.');
}

const finalUrl = (!supabaseUrl || supabaseUrl.includes('MASUKKAN')) ? 'https://placeholder-url.supabase.co' : supabaseUrl;
const finalKey = (!supabaseAnonKey || supabaseAnonKey.includes('MASUKKAN')) ? 'placeholder-key' : supabaseAnonKey;

console.log('Supabase client initialization:', {
  url: finalUrl,
  keyLength: finalKey?.length,
  isPlaceholder: finalUrl.includes('placeholder')
});

export const supabase = createClient(finalUrl, finalKey);
