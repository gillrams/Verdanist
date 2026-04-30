// Verdanist Auth - Supabase Authentication Integration
// Real auth using Supabase BaaS (Email/Password + Google OAuth)

let currentUser = null;
let supabaseWaitStartTime = null;
let isAuthChecking = false; // Global loading state
const SUPABASE_TIMEOUT_MS = 3000; // 3 second timeout

/**
 * Get Supabase client (lazy init)
 */
function getSupabaseAuth() {
    // Try window.supabase directly first
    if (window.supabase && window.supabase.auth) {
        return window.supabase;
    }
    // Try supabase-client.js
    if (typeof window.getSupabase === 'function') {
        return window.getSupabase();
    }
    return null;
}

/**
 * Show emergency error with reload button
 */
function showSupabaseError() {
    const errorDiv = document.createElement('div');
    errorDiv.id = 'supabase-error';
    errorDiv.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:#1c1917;z-index:99999;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:20px;font-family:sans-serif;';
    errorDiv.innerHTML = `
        <div style="color:#dc2626;font-size:48px;">⚠️</div>
        <h2 style="color:#f5f5f4;margin:0;">Koneksi Database Gagal</h2>
        <p style="color:#a8a29e;text-align:center;max-width:400px;">Tidak dapat terhubung ke Supabase. Silakan muat ulang halaman.</p>
        <button onclick="location.reload()" style="padding:12px 24px;background:#dc2626;color:white;border:none;border-radius:8px;cursor:pointer;font-size:16px;">🔄 RELOAD HALAMAN</button>
    `;
    document.body.appendChild(errorDiv);
}

/**
 * Show loading overlay during auth checking
 */
function showAuthLoading() {
    if (document.getElementById('auth-loading')) return;
    
    const overlay = document.createElement('div');
    overlay.id = 'auth-loading';
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(28,25,23,0.95);z-index:99998;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:20px;font-family:sans-serif;';
    overlay.innerHTML = '<div class="animate-spin text-6xl">↻</div><p style="color:#f5f5f4;">Memverifikasi sesi...</p>';
    document.body.appendChild(overlay);
}

/**
 * Remove loading overlay
 */
function removeAuthLoading() {
    const overlay = document.getElementById('auth-loading');
    if (overlay) {
        overlay.remove();
    }
}

/**
 * Initialize Auth Page
 */
function initAuth() {
    // Start timer on first call
    if (!supabaseWaitStartTime) {
        supabaseWaitStartTime = Date.now();
    }

    const supabase = getSupabaseAuth();
    
    // Check timeout
    if (!supabase && (Date.now() - supabaseWaitStartTime > SUPABASE_TIMEOUT_MS)) {
        console.error('Supabase failed to load within 3 seconds');
        showSupabaseError();
        return;
    }
    
    // Wait for Supabase to be ready
    if (!supabase) {
        console.warn('Supabase not configured yet. Retrying in 500ms...');
        setTimeout(initAuth, 500);
        return;
    }

    console.log('Auth initialized successfully');
    setupAuthForm();
    setupRememberMe();
    handleAuthRedirect();
}

/**
 * Setup auth form (handles both Login and Sign-Up)
 */
function setupAuthForm() {
    const form = document.getElementById('auth-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const supabase = getSupabaseAuth();
        if (!supabase) {
            alert('Supabase is not configured. Please add your project URL and anon key to js/supabase-client.js');
            return;
        }

        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const submitBtn = document.getElementById('auth-submit-btn');

        if (!email || !password) {
            highlightField(document.getElementById('email'));
            return;
        }

        // Determine mode from global variable
        const mode = (typeof currentAuthMode !== 'undefined') ? currentAuthMode : 'login';

        // Show loading state
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="material-symbols-outlined animate-spin">sync</span> ' + (mode === 'signup' ? 'Creating Account...' : 'Authenticating...');

        try {
            if (mode === 'signup') {
                // Sign Up mode
                const confirmPassword = document.getElementById('confirm-password').value;
                if (password !== confirmPassword) {
                    throw new Error('Passwords do not match');
                }
                if (password.length < 6) {
                    throw new Error('Password must be at least 6 characters');
                }

                const { data, error } = await supabase.auth.signUp({
                    email: email,
                    password: password
                });

                if (error) throw error;

                // Check if email confirmation is required
                if (data.user && data.user.identities && data.user.identities.length === 0) {
                    alert('Please check your email to confirm your account before logging in.');
                } else {
                    alert('Account created successfully! Welcome to Persada Farm.');
                    // NEW USER: Always redirect to welcome-guest first (admin approval required)
                    // Wait 2 seconds for Supabase trigger to create profile with 'guest' role
                    await new Promise(r => setTimeout(r, 2000));
                    window.location.href = window.location.origin + '/pages/welcome-guest.html';
                }
            } else {
                // Log In mode
                const { data, error } = await supabase.auth.signInWithPassword({
                    email: email,
                    password: password
                });

                if (error) throw error;

                // Save email if remember me checked
                const remember = document.getElementById('remember');
                if (remember && remember.checked) {
                    localStorage.setItem('verdanist_saved_email', email);
                } else {
                    localStorage.removeItem('verdanist_saved_email');
                }

                await redirectBasedOnRole(supabase);
            }
        } catch (err) {
            console.error('Auth error:', err);
            alert(err.message || 'Authentication failed. Please try again.');
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    });
}

/**
 * Sign in with Google OAuth via Supabase
 */
async function signInWithGoogle() {
    console.log('=== signInWithGoogle CLICKED ===');
    const supabase = getSupabaseAuth();
    console.log('Supabase client:', supabase);

    if (!supabase) {
        console.error('ERROR: Supabase client is NULL');
        alert('Supabase is not configured. Please check js/supabase-client.js');
        return;
    }

    // Check if auth method exists
    console.log('supabase.auth:', supabase.auth);
    console.log('supabase.auth.signInWithOAuth:', supabase.auth?.signInWithOAuth);

    try {
        console.log('Starting Google OAuth...');
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: 'https://www.verdanist.my.id/pages/dashboard.html',
                skipBrowserRedirect: false
            }
        });

        console.log('OAuth response:', { data, error });
        if (error) {
            console.error('OAuth error:', error);
            throw error;
        }
        console.log('OAuth initiated successfully - browser should redirect to Google');
        // OAuth redirects automatically
    } catch (err) {
        console.error('Google OAuth error:', err);
        alert('Google sign-in failed: ' + (err.message || 'Unknown error'));
    }
}

/**
 * Handle OAuth redirect / session recovery
 * PATIENT STRATEGY: Wait for auth state changes with 3-second grace period
 */
async function handleAuthRedirect() {
    const supabase = getSupabaseAuth();
    if (!supabase) {
        console.error('[handleAuthRedirect] Supabase not available');
        return;
    }

    // Detect current page to prevent infinite redirects
    const currentPage = window.location.pathname;
    const isLoginPage = currentPage.includes('login.html');
    const isDashboardPage = currentPage.includes('dashboard.html');
    const isWelcomeGuestPage = currentPage.includes('welcome-guest.html');

    console.log('[handleAuthRedirect] Starting patient auth handler...');
    console.log('[handleAuthRedirect] Current page:', currentPage, '| isLoginPage:', isLoginPage, '| isDashboardPage:', isDashboardPage);
    
    // CRITICAL: Check for OAuth callback in URL (#access_token)
    // If present, DO NOT redirect - let Supabase process the token
    if (window.location.hash.includes('access_token') || window.location.hash.includes('refresh_token')) {
        console.log('[handleAuthRedirect] OAuth callback detected in URL - waiting for Supabase to process...');
        // Show loading while processing callback
        showAuthLoading();
        
        // Wait for Supabase to process the callback (up to 5 seconds)
        let attempts = 0;
        const maxAttempts = 10;
        const checkInterval = setInterval(async () => {
            attempts++;
            const { data: { session } } = await supabase.auth.getSession();
            
            if (session) {
                clearInterval(checkInterval);
                console.log('[handleAuthRedirect] Session established after OAuth callback');
                removeAuthLoading();
                
                // Check role and redirect
                const role = await getUserRole(supabase);
                console.log('[handleAuthRedirect] User role:', role);
                if (role === 'admin' || role === 'farmer') {
                    window.location.href = window.location.origin + '/pages/dashboard.html';
                } else {
                    window.location.href = window.location.origin + '/pages/welcome-guest.html';
                }
            } else if (attempts >= maxAttempts) {
                clearInterval(checkInterval);
                removeAuthLoading();
                console.error('[handleAuthRedirect] Timeout waiting for OAuth session');
            }
        }, 500);
        
        return;
    }

    // Listen for auth state changes
    supabase.auth.onAuthStateChange((event, session) => {
        console.log('[handleAuthRedirect] Auth state changed:', event, 'Session exists:', !!session);
        console.log('[handleAuthRedirect] Current page during state change:', currentPage);
        
        if (event === 'SIGNED_IN' && session) {
            currentUser = session.user;
            console.log('[handleAuthRedirect] User signed in:', currentUser.email);
            
            // Check if guest is on dashboard - redirect to welcome-guest
            if (isDashboardPage) {
                getUserRole(supabase).then(role => {
                    if (role === 'guest') {
                        console.log('[handleAuthRedirect] Guest on dashboard - redirecting to welcome-guest');
                        window.location.href = window.location.origin + '/pages/welcome-guest.html';
                    }
                });
                return;
            }
            
            // CRITICAL: Only redirect if on login page, NOT if already on dashboard/welcome
            if (!isLoginPage) {
                console.log('[handleAuthRedirect] Already on protected page, no redirect needed');
                return;
            }
            
            // Check role before redirecting
            getUserRole(supabase).then(role => {
                console.log('[handleAuthRedirect] User role:', role);
                if (role === 'admin' || role === 'farmer') {
                    console.log('[handleAuthRedirect] Redirecting to dashboard...');
                    window.location.href = window.location.origin + '/pages/dashboard.html';
                } else if (role === 'guest') {
                    console.log('[handleAuthRedirect] Redirecting to welcome-guest...');
                    window.location.href = window.location.origin + '/pages/welcome-guest.html';
                }
            });
        }
        
        if (event === 'SIGNED_OUT') {
            currentUser = null;
            console.log('[handleAuthRedirect] User signed out');
        }
    });

    // Initial session check with PATIENT strategy
    // Don't redirect immediately - give Supabase time to restore session from storage
    const MAX_WAIT_MS = 3000;
    const CHECK_INTERVAL_MS = 500;
    const startTime = Date.now();
    
    while (Date.now() - startTime < MAX_WAIT_MS) {
        const { data: { session } } = await supabase.auth.getSession();
        const elapsed = Date.now() - startTime;
        
        console.log(`[handleAuthRedirect] Checking session... (${elapsed}ms)`);
        
        if (session) {
            console.log('[handleAuthRedirect] Session found after', elapsed, 'ms');
            currentUser = session.user;
            
            // CRITICAL: Only redirect if we're on login page and have a valid session
            // If already on dashboard/welcome, DON'T redirect to prevent infinite reload
            if (isLoginPage) {
                const role = await getUserRole(supabase);
                console.log('[handleAuthRedirect] User role:', role);
                
                if (role === 'admin' || role === 'farmer') {
                    console.log('[handleAuthRedirect] Redirecting to dashboard...');
                    window.location.href = window.location.origin + '/pages/dashboard.html';
                } else if (role === 'guest') {
                    console.log('[handleAuthRedirect] Redirecting to welcome-guest...');
                    window.location.href = window.location.origin + '/pages/welcome-guest.html';
                }
            } else {
                // Check if guest is wrongly on dashboard
                if (isDashboardPage) {
                    const role = await getUserRole(supabase);
                    if (role === 'guest') {
                        console.log('[handleAuthRedirect] Guest on dashboard - redirecting to welcome-guest');
                        window.location.href = window.location.origin + '/pages/welcome-guest.html';
                        return;
                    }
                }
                console.log('[handleAuthRedirect] Session found but already on protected page, staying here');
            }
            return;
        }
        
        // Wait before next check
        await new Promise(r => setTimeout(r, CHECK_INTERVAL_MS));
    }
    
    console.log('[handleAuthRedirect] No session found after 3 seconds - staying on login page');
}

/**
 * Check if user is authenticated (async)
 */
async function isAuthenticated() {
    const supabase = getSupabaseAuth();
    if (!supabase) return false;

    const { data: { session } } = await supabase.auth.getSession();
    return !!session;
}

/**
 * Get user role from Supabase profiles table
 */
async function getUserRole(supabase) {
    if (!supabase) supabase = getSupabaseAuth();
    if (!supabase) return null;

    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return null;

        const { data, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();

        if (error) throw error;
        return data?.role || 'guest';
    } catch (err) {
        console.error('Error getting user role:', err);
        return 'guest';
    }
}

/**
 * Redirect user based on their role
 * admin/farmer -> dashboard.html
 * guest -> welcome-guest.html
 */
async function redirectBasedOnRole(supabase) {
    console.log('[redirectBasedOnRole] Starting redirect logic...');
    const role = await getUserRole(supabase);
    console.log('[redirectBasedOnRole] User role:', role);
    console.log('[redirectBasedOnRole] Current page:', window.location.pathname);

    if (role === 'admin' || role === 'farmer') {
        console.log('[redirectBasedOnRole] Redirecting to dashboard.html');
        window.location.href = window.location.origin + '/pages/dashboard.html';
    } else {
        console.log('[redirectBasedOnRole] Redirecting to welcome-guest.html');
        window.location.href = window.location.origin + '/pages/welcome-guest.html';
    }
}

/**
 * Check if user can access dashboard (admin or farmer only)
 * PATIENT STRATEGY: Show loading overlay for 3 seconds before deciding to redirect
 * This prevents 'bounce' during login transition
 */
async function protectDashboard() {
    console.log('[protectDashboard] Starting PATIENT role check...');
    
    // Create loading overlay immediately to hide content
    createDashboardLoadingOverlay();
    
    const supabase = getSupabaseAuth();
    if (!supabase) {
        console.error('[protectDashboard] Supabase not available');
        await new Promise(r => setTimeout(r, 2000));
        removeDashboardLoadingOverlay();
        showDashboardSupabaseError();
        return false;
    }

    // PATIENT STRATEGY: Wait up to 3 seconds for session to appear
    const MAX_WAIT_MS = 3000;
    const CHECK_INTERVAL_MS = 500;
    const startTime = Date.now();
    
    while (Date.now() - startTime < MAX_WAIT_MS) {
        const { data: { session } } = await supabase.auth.getSession();
        const elapsed = Date.now() - startTime;
        
        console.log(`[protectDashboard] Session check: ${!!session} (${elapsed}ms)`);
        
        if (session) {
            // Session found! Check role
            console.log('[protectDashboard] Session found after', elapsed, 'ms');
            currentUser = session.user;
            
            try {
                const { data: profile, error } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', session.user.id)
                    .single();
                
                if (error) {
                    console.warn('[protectDashboard] Could not fetch role:', error.message);
                }
                
                const role = profile?.role || 'guest';
                console.log('[protectDashboard] User role:', role);
                
                if (role === 'admin' || role === 'farmer') {
                    console.log('[protectDashboard] Access granted for', role);
                    removeDashboardLoadingOverlay();
                    return true;
                } else if (role === 'guest') {
                    console.warn('[protectDashboard] Guest user - redirecting to welcome page');
                    removeDashboardLoadingOverlay();
                    window.location.href = window.location.origin + '/pages/welcome-guest.html';
                    return false;
                }
            } catch (roleErr) {
                console.error('[protectDashboard] Role check error:', roleErr);
                // Allow access anyway on error
                removeDashboardLoadingOverlay();
                return true;
            }
        }
        
        // Update loading text with progress
        updateDashboardLoadingText(`Memverifikasi akses... (${Math.round(elapsed / 1000)}s)`);
        await new Promise(r => setTimeout(r, CHECK_INTERVAL_MS));
    }
    
    // 3 seconds passed, still no session - redirect to login
    console.warn('[protectDashboard] No session after 3 seconds - redirecting to login');
    removeDashboardLoadingOverlay();
    window.location.href = window.location.origin + '/pages/login.html';
    return false;
}

// ... (rest of the code remains the same)
function createDashboardLoadingOverlay() {
    if (document.getElementById('dashboard-auth-loading')) return;
    
    const overlay = document.createElement('div');
    overlay.id = 'dashboard-auth-loading';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: #1c1917;
        z-index: 99999;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 20px;
    `;
    
    overlay.innerHTML = `
        <div style="
            width: 50px;
            height: 50px;
            border: 3px solid #44403c;
            border-top-color: #22c55e;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        "></div>
        <p id="dashboard-loading-text" style="
            color: #a8a29e;
            font-family: 'Inter', sans-serif;
            font-size: 14px;
        ">Memverifikasi akses...</p>
        <style>
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
        </style>
    `;
    
    document.body.appendChild(overlay);
}

function updateDashboardLoadingText(text) {
    const loadingText = document.getElementById('dashboard-loading-text');
    if (loadingText) loadingText.textContent = text;
}

function removeDashboardLoadingOverlay() {
    const overlay = document.getElementById('dashboard-auth-loading');
    if (overlay) {
        overlay.style.opacity = '0';
        overlay.style.transition = 'opacity 0.3s ease';
        setTimeout(() => overlay.remove(), 300);
    }
}

/**
 * Get current user (async)
 */
async function getCurrentUser() {
    const supabase = getSupabaseAuth();
    if (!supabase) return null;

    const { data: { user } } = await supabase.auth.getUser();
    return user;
}

/**
 * Logout user via Supabase
 */
async function logout() {
    const supabase = getSupabaseAuth();
    if (supabase) {
        await supabase.auth.signOut();
    }
    console.warn("Sesi belum siap, tapi saya tidak akan mengusir user.");
}

// No emergency force entry - login flow is now stable

/**
 * Reset password
 */
async function supabaseResetPassword(email) {
    const supabase = getSupabaseAuth();
    if (!supabase) {
        alert('Supabase is not configured.');
        return;
    }

    try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + '/pages/dashboard.html'
        });
        if (error) throw error;
        alert('Password reset link sent to ' + email);
    } catch (err) {
        alert('Failed to send reset link: ' + err.message);
    }
}

/**
 * Setup Remember Me
 */
function setupRememberMe() {
    const emailInput = document.getElementById('email');
    if (emailInput) {
        const savedEmail = localStorage.getItem('verdanist_saved_email');
        if (savedEmail) {
            emailInput.value = savedEmail;
            const rememberCheckbox = document.getElementById('remember');
            if (rememberCheckbox) rememberCheckbox.checked = true;
        }
    }
}

/**
 * Highlight Field with error styling
 */
function highlightField(field) {
    field.classList.add('border-tertiary', 'ring-1', 'ring-tertiary');
    field.focus();
    field.addEventListener('input', () => {
        field.classList.remove('border-tertiary', 'ring-1', 'ring-tertiary');
    }, { once: true });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAuth);
} else {
    initAuth();
}

// Expose functions to global scope for inline onclick handlers
window.signInWithGoogle = signInWithGoogle;
