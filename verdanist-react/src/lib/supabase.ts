import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pzktyggopmvyrkwcnwfo.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB6a3R5Z2dvcG12eXJrd2Nud2ZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4ODA3NDEsImV4cCI6MjA5MjQ1Njc0MX0.p-h9x0mswjwjremYia7idtaPpLdi7IEdh7an36UKmEc';

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

