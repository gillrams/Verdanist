// Verdanist Supabase Client
// Initialize once and export for use across all pages

console.log('[Supabase Client] Script loading...');

// Check if already initialized to prevent redeclaration errors
if (typeof window.supabaseClient !== 'undefined' && window.supabaseClient) {
    console.log('[Supabase Client] Already initialized, reusing existing client');
} else {
    // Use var to avoid redeclaration errors on reload
    var SUPABASE_URL = 'https://pzktyggopmvyrkwcnwfo.supabase.co';
    var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB6a3R5Z2dvcG12eXJrd2Nud2ZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4ODA3NDEsImV4cCI6MjA5MjQ1Njc0MX0.p-h9x0mswjwjremYia7idtaPpLdi7IEdh7an36UKmEc';

    var supabaseClient = null;

    function initSupabase() {
        console.log('[Supabase Client] initSupabase() called');
        
        if (supabaseClient) {
            console.log('[Supabase Client] Client already exists, returning existing');
            return supabaseClient;
        }

        // Try to get supabase SDK from global scope
        var supabaseSDK = null;
        
        // Check for global supabase object (from CDN)
        if (typeof supabase !== 'undefined' && supabase.createClient) {
            console.log('[Supabase Client] Found global supabase object');
            supabaseSDK = supabase;
        } else if (window.supabase && window.supabase.createClient) {
            console.log('[Supabase Client] Found window.supabase with createClient');
            supabaseSDK = window.supabase;
        } else {
            console.error('[Supabase Client] Supabase SDK NOT found! CDN may not have loaded.');
            console.error('[Supabase Client] typeof supabase:', typeof supabase);
            console.error('[Supabase Client] window.supabase:', window.supabase);
            return null;
        }

        if (SUPABASE_URL === 'YOUR_SUPABASE_URL' || SUPABASE_ANON_KEY === 'YOUR_SUPABASE_ANON_KEY') {
            console.error('[Supabase Client] Credentials not configured!');
            return null;
        }

        try {
            supabaseClient = supabaseSDK.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
                auth: {
                    autoRefreshToken: true,
                    persistSession: true,
                    detectSessionInUrl: true
                }
            });

            // Expose globally
            window.supabase = supabaseClient;
            window.supabaseClient = supabaseClient;
            
            console.log('[Supabase Client] SUCCESS: Supabase Client Berhasil Dimuat');
            return supabaseClient;
        } catch (err) {
            console.error('[Supabase Client] Error creating client:', err);
            return null;
        }
    }

    function getSupabase() {
        if (!supabaseClient) {
            return initSupabase();
        }
        return supabaseClient;
    }

    // Expose globally
    window.getSupabase = getSupabase;
    window.initSupabase = initSupabase;

    console.log('[Supabase Client] Functions exposed to window');

    // Auto-initialize when script loads
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            console.log('[Supabase Client] DOM loaded, initializing...');
            initSupabase();
        });
    } else {
        console.log('[Supabase Client] DOM already loaded, initializing immediately...');
        initSupabase();
    }
}
