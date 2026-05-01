// Verdanist Dashboard - Pump Control & Schedule Logic
// Page-specific JavaScript for dashboard.html

// ==========================================
// EMERGENCY ROLE PROTECTION - MUST RUN FIRST
// ==========================================

/**
 * Check user role and redirect guest users away from dashboard
 * This runs BEFORE any dashboard content is loaded
 * With 3-second timeout to prevent getting stuck
 */
async function protectDashboard() {
    // Create loading overlay immediately to hide content
    createLoadingOverlay();
    
    const supabase = getSupabaseDashboard();
    if (!supabase) {
        console.error('Dashboard: Supabase not available');
        // Wait a bit then show error
        await new Promise(r => setTimeout(r, 2000));
        showDashboardSupabaseError();
        return false;
    }

    // PATIENT STRATEGY: Wait up to 3 seconds for session to appear
    const MAX_WAIT_MS = 3000;
    const CHECK_INTERVAL_MS = 500;
    const startTime = Date.now();
    
    while (Date.now() - startTime < MAX_WAIT_MS) {
        const { data: { session } } = await supabase.auth.getSession();
        console.log('[protectDashboard] Session check:', !!session, 'Elapsed:', Date.now() - startTime, 'ms');
        
        if (session) {
            // Session found! Check role and allow access
            console.log('[protectDashboard] Session found after', Date.now() - startTime, 'ms');
            currentUser = session.user;
            
            try {
                // Fetch user role from profiles
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
                
                // Only allow admin and farmer
                if (role === 'admin' || role === 'farmer') {
                    console.log('[protectDashboard] Access granted for', role);
                    // Show body content (remove hard block)
                    document.body.classList.add('auth-verified');
                    document.body.style.visibility = 'visible';
                    // Remove both loading overlays
                    removeLoadingOverlay();
                    const blocker = document.getElementById('auth-blocker');
                    if (blocker) blocker.remove();
                    return true;
                } else if (role === 'guest') {
                    console.warn('[protectDashboard] Guest user - redirecting to welcome page');
                    window.location.href = window.location.origin + '/pages/welcome-guest.html';
                    return false;
                }
            } catch (roleErr) {
                console.error('[protectDashboard] Role check error:', roleErr);
                // Allow access anyway, role will be checked on server
                removeLoadingOverlay();
                const blocker = document.getElementById('auth-blocker');
                if (blocker) blocker.remove();
                return true;
            }
        }
        
        // Session not ready yet, wait and retry
        updateLoadingText(`Memverifikasi akses... (${Math.round((Date.now() - startTime) / 1000)}s)`);
        await new Promise(r => setTimeout(r, CHECK_INTERVAL_MS));
    }
    
    // 3 seconds passed, still no session - redirect to login
    console.warn('[protectDashboard] No session after 3 seconds - redirecting to login');
    removeLoadingOverlay();
    window.location.href = window.location.origin + '/pages/login.html';
    return false;
}

/**
 * Create loading overlay to hide dashboard content during role check
 */
function createLoadingOverlay() {
    // Check if overlay already exists
    if (document.getElementById('role-check-overlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'role-check-overlay';
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
        <p id="loading-text" style="
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

function updateLoadingText(text) {
    const loadingText = document.getElementById('loading-text');
    if (loadingText) {
        loadingText.textContent = text;
    }
}

/**
 * Remove loading overlay after role check completes
 */
function removeLoadingOverlay() {
    const overlay = document.getElementById('role-check-overlay');
    if (overlay) {
        overlay.style.opacity = '0';
        overlay.style.transition = 'opacity 0.3s ease';
        setTimeout(() => overlay.remove(), 300);
    }
}

// Manual override: Press Escape key to remove stuck overlay
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        removeLoadingOverlay();
        console.log('Overlay removed manually via Escape key');
    }
});

// Expose to console for manual removal: window.removeOverlay()
window.removeOverlay = removeLoadingOverlay;

// IMMEDIATE ROLE CHECK - Run protection immediately when script loads
(function() {
    // Wait for DOM to be ready then check role
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', protectDashboard);
    } else {
        protectDashboard();
    }
})();

// Supabase integration helpers
let supabaseChannel = null;
let dashboardSupabaseWaitStart = null;
const DASHBOARD_TIMEOUT_MS = 3000;

function getSupabaseDashboard() {
    // Try window.supabase directly first
    if (window.supabase && window.supabase.auth) {
        return window.supabase;
    }
    // Try initSupabase from supabase-client.js
    if (typeof window.initSupabase === 'function') {
        const client = window.initSupabase();
        if (client) return client;
    }
    return null;
}

/**
 * Setup auth state listener for dashboard
 * This ensures the dashboard properly detects login state changes
 */
function setupDashboardAuthListener() {
    const supabase = getSupabaseDashboard();
    if (!supabase) {
        console.warn('[Dashboard] Supabase not ready for auth listener');
        setTimeout(setupDashboardAuthListener, 500);
        return;
    }

    console.log('[Dashboard] Setting up auth state listener...');
    
    supabase.auth.onAuthStateChange((event, session) => {
        console.log('[Dashboard] Auth state changed:', event, 'Session exists:', !!session);
        
        if (event === 'SIGNED_IN' && session) {
            console.log('[Dashboard] User signed in, checking role...');
            // Re-run protectDashboard to verify access
            protectDashboard();
        }
        
        if (event === 'SIGNED_OUT') {
            console.warn("Sesi belum siap, tapi saya tidak akan mengusir user.");
        }
    });
}

/**
 * Show emergency error with reload button
 */
function showDashboardSupabaseError() {
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
 * Fetch latest sensor readings from Supabase
 */
async function fetchLatestSensorReadings() {
    const supabase = getSupabaseDashboard();
    if (!supabase) return;

    // SECURITY: Double-check role before fetching any data
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();

        if (profile?.role === 'guest') {
            console.warn('BLOCKED: Guest user cannot fetch sensor data');
            window.location.replace('/pages/welcome-guest.html');
            return;
        }
    } catch (e) {
        console.warn('Role verification failed, blocking data fetch');
        return;
    }

    try {
        // Get latest reading per zone per type
        const { data, error } = await supabase
            .from('sensor_readings')
            .select('*')
            .order('recorded_at', { ascending: false })
            .limit(20);
        if (error) {
            console.warn('Supabase sensor fetch error:', error.message);
            return;
        }
        if (data) {
            // Apply latest values per zone/type
            const latest = {};
            data.forEach(row => {
                const key = row.zone + '_' + row.type;
                if (!latest[key]) latest[key] = row;
            });
            Object.values(latest).forEach(row => {
                if (row.type === 'soil_moisture' || row.type === 'humidity') {
                    const zone = row.zone;
                    if (systemState[zone]) {
                        systemState[zone].sensorValue = Math.round(row.value);
                        const sensorEl = document.getElementById(`sensor-${zone}`);
                        if (sensorEl) sensorEl.textContent = Math.round(row.value);
                    }
                }
                if (row.type === 'temperature') {
                    const tempEl = document.querySelector('.font-headline.text-6xl, .font-headline.text-\\[5rem\\]');
                    if (tempEl) tempEl.textContent = Math.round(row.value);
                }
            });
        }
    } catch (e) {
        console.warn('Could not fetch sensor readings:', e);
    }
}

/**
 * Subscribe to real-time sensor readings from Supabase
 */
function subscribeToSensorUpdates() {
    const supabase = getSupabaseDashboard();
    if (!supabase) return;
    try {
        supabaseChannel = supabase
            .channel('sensor_changes')
            .on('postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'sensor_readings' },
                (payload) => {
                    const row = payload.new;
                    if (!row) return;
                    if (row.type === 'soil_moisture' || row.type === 'humidity') {
                        const zone = row.zone;
                        if (systemState[zone]) {
                            systemState[zone].sensorValue = Math.round(row.value);
                            const sensorEl = document.getElementById(`sensor-${zone}`);
                            if (sensorEl) sensorEl.textContent = Math.round(row.value);
                        }
                    }
                    if (row.type === 'temperature') {
                        const tempEl = document.querySelector('.font-headline.text-6xl, .font-headline.text-\\[5rem\\]');
                        if (tempEl) tempEl.textContent = Math.round(row.value);
                    }
                }
            )
            .subscribe();
        console.log('Subscribed to Supabase real-time sensor updates');
    } catch (e) {
        console.warn('Could not subscribe to sensor updates:', e);
    }
}

/**
 * System State per Zone
 * Tracks mode, pump status, sensor values, and schedules for each zone
 */
const systemState = {
    A: { mode: 'auto', pumpOn: true, sensorValue: 75, target: 75, schedule: [], activeScheduleSlot: null },
    B: { mode: 'manual', pumpOn: false, sensorValue: 42, target: 65, schedule: [], activeScheduleSlot: null }
};

/**
 * Pump Toggle with Loading Animation
 * Respects mode lock - only works in manual mode
 * Role-based: Only admin and farmer can control pumps
 */
function setupPumpToggle(zone) {
    const button = document.getElementById(`pump-btn-${zone}`);
    if (!button) return;

    let isLoading = false;

    button.addEventListener('click', async () => {
        // Block if not in manual mode
        if (systemState[zone].mode !== 'manual') return;
        if (isLoading) return;

        // Check user role - guests cannot control pumps
        const supabase = getSupabaseDashboard();
        if (supabase) {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', session.user.id)
                    .single();
                
                if (profile && profile.role === 'guest') {
                    showToast('Akses ditolak: Guest tidak dapat mengontrol pompa. Hubungi admin untuk verifikasi.', 'error');
                    return;
                }
            }
        }

        isLoading = true;
        button.disabled = true;

        // Show loading spinner
        button.innerHTML = '<span class="material-symbols-outlined animate-spin">sync</span> Processing...';
        button.classList.add('opacity-70', 'cursor-wait');

        setTimeout(async () => {
            systemState[zone].pumpOn = !systemState[zone].pumpOn;
            isLoading = false;
            button.classList.remove('opacity-70', 'cursor-wait');

            // Log pump action to Supabase
            try {
                const supabase = getSupabaseDashboard();
                if (supabase) {
                    const { data: { user } } = await supabase.auth.getUser();
                    await supabase.from('pump_logs').insert({
                        zone: zone,
                        action: systemState[zone].pumpOn ? 'PUMP ON' : 'PUMP OFF',
                        trigger: 'manual',
                        detail: `Manual toggle by user`,
                        user_id: user ? user.id : null
                    });
                }
            } catch (e) {
                console.warn('Could not log pump action to Supabase:', e);
            }

            updatePumpUI(zone);
        }, 1500);
    });
}

/**
 * Update Pump Button Visual State
 * Changes appearance based on pump state and mode
 */
function updatePumpUI(zone) {
    const button = document.getElementById(`pump-btn-${zone}`);
    if (!button) return;

    const state = systemState[zone];
    const isManual = state.mode === 'manual';

    // Build status text
    let statusText = state.pumpOn ? 'PUMP ON' : 'PUMP OFF';
    if (state.mode === 'timer' && state.activeScheduleSlot !== null) {
        const slot = state.schedule[state.activeScheduleSlot];
        if (slot && slot.startTime) {
            const elapsed = Math.floor((Date.now() - slot.startTime) / 1000);
            const remaining = Math.max(0, slot.duration * 60 - elapsed);
            const mins = Math.floor(remaining / 60);
            const secs = remaining % 60;
            statusText = `PUMP ON (${mins}:${secs.toString().padStart(2, '0')})`;
        } else {
            statusText = 'PUMP ON (Schedule)';
        }
    } else if (state.mode === 'timer') {
        statusText = 'PUMP OFF (Schedule)';
    } else if (state.mode === 'auto') {
        statusText = state.pumpOn ? 'PUMP ON (Auto)' : 'PUMP OFF (Auto)';
    }

    if (state.pumpOn) {
        button.className = 'w-full py-5 rounded-full bg-gradient-to-r from-primary to-primary-container text-on-primary-container font-headline font-bold text-lg shadow-[0_8px_24px_rgba(75,226,119,0.2)] active:scale-[0.98] transition-all flex items-center justify-center gap-3' + (isManual ? ' hover:opacity-90' : ' opacity-80 cursor-not-allowed');
        button.innerHTML = `<span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">power_settings_new</span> ${statusText}`;
    } else {
        button.className = 'w-full py-5 rounded-full bg-surface-container-highest text-on-surface-variant font-headline font-bold text-lg border border-outline-variant/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3' + (isManual ? ' hover:bg-surface-variant' : ' opacity-80 cursor-not-allowed');
        button.innerHTML = `<span class="material-symbols-outlined">power_settings_new</span> ${statusText}`;
    }

    // Enable/disable based on mode
    button.disabled = !isManual;
    
    // Track water usage
    if (typeof trackWaterUsage === 'function') {
        trackWaterUsage(zone, state.pumpOn);
    }
    
    // Update gauge color based on sensor value
    if (typeof updateGaugeColor === 'function') {
        updateGaugeColor(zone);
    }
    
    // Log activity with duration tracking
    if (typeof logActivityWithDuration === 'function') {
        const action = state.pumpOn ? 'PUMP ON' : 'PUMP OFF';
        const mode = state.mode.charAt(0).toUpperCase() + state.mode.slice(1);
        logActivityWithDuration(zone, action, mode);
    }
}

/**
 * Check and Run Schedule for Timer Mode
 * Automatically turns pump on/off based on schedule
 */
function checkSchedule(zone) {
    const state = systemState[zone];
    if (state.mode !== 'timer') return;

    const now = new Date();
    const currentTimeInMinutes = now.getHours() * 60 + now.getMinutes();

    // Check if any schedule slot should be active
    let shouldBeOn = false;
    let activeSlot = null;

    state.schedule.forEach((slot, index) => {
        const [slotHour, slotMin] = slot.time.split(':').map(Number);
        const slotTimeInMinutes = slotHour * 60 + slotMin;

        // Check if we're within the schedule window (start time to start time + duration)
        if (currentTimeInMinutes >= slotTimeInMinutes && 
            currentTimeInMinutes < slotTimeInMinutes + slot.duration) {
            shouldBeOn = true;
            activeSlot = index;
            if (!slot.startTime) {
                slot.startTime = Date.now();
            }
        } else if (currentTimeInMinutes >= slotTimeInMinutes + slot.duration) {
            // Reset start time if schedule window has passed
            slot.startTime = null;
        }
    });

    // Update state if changed
    if (shouldBeOn !== state.pumpOn || activeSlot !== state.activeScheduleSlot) {
        state.pumpOn = shouldBeOn;
        state.activeScheduleSlot = activeSlot;
        updatePumpUI(zone);
        if (activeSlot !== null) {
            renderScheduleList(zone);
        }
    }
}

/**
 * Show/Hide Timer Panel Based on Mode
 */
function updateTimerPanel(zone) {
    const panel = document.getElementById(`timer-panel-${zone}`);
    if (!panel) return;

    if (systemState[zone].mode === 'timer') {
        panel.classList.remove('hidden');
        renderScheduleList(zone);
    } else {
        panel.classList.add('hidden');
        systemState[zone].activeScheduleSlot = null;
    }
}

/**
 * Render Schedule List for a Zone
 * Displays all scheduled time slots
 */
function renderScheduleList(zone) {
    const list = document.getElementById(`schedule-list-${zone}`);
    if (!list) return;

    const schedule = systemState[zone].schedule;
    list.innerHTML = '';

    if (schedule.length === 0) {
        list.innerHTML = `<div class="text-center py-4 text-on-surface-variant font-label text-xs">No schedules yet. Add one below.</div>`;
        return;
    }

    schedule.forEach((slot, index) => {
        const isActive = systemState[zone].activeScheduleSlot === index;
        const div = document.createElement('div');
        div.className = `flex items-center justify-between p-3 rounded-xl ${isActive ? 'bg-primary/20 border border-primary/30' : 'bg-surface-container-low border border-outline-variant/15'}`;
        div.innerHTML = `
            <div class="flex items-center gap-3">
                <span class="material-symbols-outlined ${isActive ? 'text-primary' : 'text-on-surface-variant'} text-[18px]">${isActive ? 'play_circle' : 'schedule'}</span>
                <div>
                    <div class="font-headline text-sm font-bold ${isActive ? 'text-primary' : 'text-on-surface'}">${slot.time}</div>
                    <div class="font-label text-[10px] text-on-surface-variant">${slot.duration} minutes</div>
                </div>
            </div>
            <button onclick="removeScheduleSlot('${zone}', ${index})" class="w-8 h-8 rounded-full bg-surface-container-high text-on-surface-variant hover:text-error flex items-center justify-center transition-colors">
                <span class="material-symbols-outlined text-[16px]">close</span>
            </button>
        `;
        list.appendChild(div);
    });
}

/**
 * Add Schedule Slot
 * Adds a new time slot to the schedule
 */
function addScheduleSlot(zone, time, duration) {
    systemState[zone].schedule.push({ time, duration: parseInt(duration), startTime: null });
    // Sort by time
    systemState[zone].schedule.sort((a, b) => a.time.localeCompare(b.time));
    renderScheduleList(zone);
}

/**
 * Remove Schedule Slot
 * Global function for onclick handlers
 */
window.removeScheduleSlot = function(zone, index) {
    systemState[zone].schedule.splice(index, 1);
    if (systemState[zone].activeScheduleSlot === index) {
        systemState[zone].activeScheduleSlot = null;
        systemState[zone].pumpOn = false;
    }
    renderScheduleList(zone);
    if (systemState[zone].mode === 'timer') {
        updatePumpUI(zone);
    }
};

/**
 * Setup Schedule Functionality
 * Attaches event listeners to schedule inputs
 */
function setupSchedule(zone) {
    const addBtn = document.getElementById(`schedule-add-${zone}`);
    const timeInput = document.getElementById(`schedule-time-${zone}`);
    const durationInput = document.getElementById(`schedule-duration-${zone}`);
    if (!addBtn || !timeInput || !durationInput) return;

    addBtn.addEventListener('click', () => {
        const time = timeInput.value;
        const duration = parseInt(durationInput.value) || 15;
        if (time) {
            addScheduleSlot(zone, time, duration);
        }
    });
}

/**
 * Auto Mode Logic
 * Simulates sensor changes and auto-controls pump
 */
function runAutoMode(zone) {
    const state = systemState[zone];
    if (state.mode !== 'auto') return;

    // Simulate sensor fluctuation
    const fluctuation = (Math.random() - 0.5) * 4; // +/- 2%
    state.sensorValue = Math.max(0, Math.min(100, state.sensorValue + fluctuation));

    // Update sensor display
    const sensorEl = document.getElementById(`sensor-${zone}`);
    if (sensorEl) {
        sensorEl.textContent = Math.round(state.sensorValue);
    }

    // Auto control logic: ON if below target, OFF if at/above target
    const shouldBeOn = state.sensorValue < state.target;
    if (shouldBeOn !== state.pumpOn) {
        state.pumpOn = shouldBeOn;
        updatePumpUI(zone);
    }
}

/**
 * Start Auto Mode Intervals
 * Begins sensor simulation for auto mode
 */
function startAutoIntervals() {
    setInterval(() => {
        runAutoMode('A');
        runAutoMode('B');
    }, 3000); // Check every 3 seconds
}

/**
 * Mode Switch (Manual/Auto/Timer)
 * Handles switching between control modes
 */
function setupModeSwitch(zone) {
    const container = document.getElementById(`mode-switch-${zone}`);
    if (!container) return;

    const buttons = container.querySelectorAll('button');
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            const selectedMode = btn.dataset.mode;
            systemState[zone].mode = selectedMode;

            // Update mode button styles
            buttons.forEach(b => {
                b.className = 'flex-1 py-2 px-4 rounded-full font-label text-sm font-medium text-on-surface-variant hover:text-on-surface transition-colors';
            });
            btn.className = 'flex-1 py-2 px-4 rounded-full font-label text-sm font-medium bg-surface-container-low text-primary shadow-[0_4px_12px_rgba(0,0,0,0.2)] border border-outline-variant/20 transition-all';

            // Show/hide timer panel
            updateTimerPanel(zone);

            // Update pump button state
            updatePumpUI(zone);

            // If auto mode, run immediate check
            if (selectedMode === 'auto') {
                runAutoMode(zone);
            }
        });
    });
}

/**
 * Live Data Simulation for Temperature
 * Simulates temperature fluctuations
 */
function simulateLiveData() {
    // Target only the temperature display element (with text-on-surface class in the card)
    const tempElement = document.querySelector('.font-headline.text-6xl.text-on-surface');
    if (tempElement) {
        setInterval(() => {
            const baseTemp = 28;
            const variation = (Math.random() - 0.5) * 2;
            const newTemp = (baseTemp + variation).toFixed(1);
            tempElement.textContent = newTemp.split('.')[0];
        }, 5000);
    }
}

/**
 * Initialize Dashboard
 * Sets up all dashboard functionality
 */
async function initDashboard() {
    // Setup auth state listener (optional, no longer required)
    // setupDashboardAuthListener();
    
    // LOGIN REMOVED: Allow access without auth
    console.log('Dashboard: Login removed - loading without auth check');
    removeLoadingOverlay();

    // Initialize both zones
    setupModeSwitch('A');
    setupModeSwitch('B');
    setupPumpToggle('A');
    setupPumpToggle('B');
    setupSchedule('A');
    setupSchedule('B');

    // Set initial UI state
    updatePumpUI('A');
    updatePumpUI('B');
    updateTimerPanel('A');
    updateTimerPanel('B');

    // Try to load real sensor data from Supabase
    await fetchLatestSensorReadings();

    // Subscribe to real-time sensor updates
    subscribeToSensorUpdates();

    // Start auto mode sensor simulation (fallback if Supabase not available)
    startAutoIntervals();

    // Start schedule checking (every second)
    setInterval(() => {
        checkSchedule('A');
        checkSchedule('B');
    }, 1000);

    // Start temperature simulation (fallback if Supabase not available)
    simulateLiveData();

    // Load user profile from Supabase
    loadProfileFromSupabase();

    // Start water usage tracking (every minute when pump is on)
    setInterval(() => {
        ['A', 'B'].forEach(zone => {
            if (systemState[zone].pumpOn) {
                trackWaterUsage(zone, true);
            }
        });
    }, 60000);

    // Listen for profile updates from settings page
    window.addEventListener('storage', (e) => {
        if (e.key === 'verdanist_profile_updated') {
            const data = JSON.parse(e.newValue);
            if (data && data.farm_name) {
                updateFarmNameInUI(data.farm_name);
            }
        }
    });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDashboard);
} else {
    initDashboard();
}

/**
 * Dropdown Menu Functionality
 * Handles card menu toggle and close on outside click
 */
function initCardMenus() {
    const menuBtns = document.querySelectorAll('.card-menu-btn');
    
    menuBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const zone = btn.dataset.zone;
            const menu = document.getElementById(`dropdown-menu-${zone}`);
            
            // Close all other menus
            document.querySelectorAll('.dropdown-menu').forEach(m => {
                if (m !== menu) m.classList.remove('active');
            });
            
            // Toggle current menu
            menu.classList.toggle('active');
        });
    });
    
    // Close menus when clicking outside
    document.addEventListener('click', () => {
        document.querySelectorAll('.dropdown-menu').forEach(menu => {
            menu.classList.remove('active');
        });
    });
}

/**
 * Show Threshold Modal
 * Opens modal to edit target humidity/moisture threshold
 */
function showThresholdModal(zone) {
    const currentTarget = systemState[zone].target;
    const newTarget = prompt(`Set target ${zone === 'A' ? 'humidity' : 'moisture'} level (current: ${currentTarget}%):`, currentTarget);
    
    if (newTarget !== null && !isNaN(newTarget) && newTarget >= 0 && newTarget <= 100) {
        systemState[zone].target = parseInt(newTarget);
        if (typeof showToast === 'function') {
            showToast(`Target for Zone ${zone} updated to ${newTarget}%`, 'success');
        }
    }
}

/**
 * Calibrate Sensor
 * Simulates sensor calibration process
 */
function calibrateSensor(zone) {
    if (typeof showToast === 'function') {
        showToast(`Calibrating sensor for Zone ${zone}...`, 'info');
    }
    
    // Simulate calibration delay
    setTimeout(() => {
        if (typeof showToast === 'function') {
            showToast(`Sensor calibration for Zone ${zone} completed`, 'success');
        }
    }, 2000);
}

/**
 * Show Device Info
 * Displays device health information
 */
function showDeviceInfo(zone) {
    const signalStrength = Math.floor(Math.random() * 30) + 70; // 70-100%
    const lastSeen = '2 seconds ago';
    
    alert(`Zone ${zone} Device Info:\n\nSignal Strength: ${signalStrength}%\nLast Seen: ${lastSeen}\nStatus: Online`);
}

/**
 * Show Power Status
 * Displays power/battery status
 */
function showPowerStatus(zone) {
    const batteryLevel = Math.floor(Math.random() * 20) + 80; // 80-100%
    const powerSource = zone === 'A' ? 'AC Adapter' : 'Solar Panel + Battery';
    
    alert(`Zone ${zone} Power Status:\n\nBattery Level: ${batteryLevel}%\nPower Source: ${powerSource}\nCharging: ${zone === 'B' ? 'Yes (Daylight)' : 'N/A'}`);
}

/**
 * Force Sleep Mode
 * Temporarily disables all automation for maintenance
 */
function forceSleep(zone) {
    if (confirm(`Enable sleep mode for Zone ${zone}? This will disable all automation for 30 minutes.`)) {
        systemState[zone].mode = 'manual';
        systemState[zone].pumpOn = false;
        updatePumpUI(zone);
        
        if (typeof showToast === 'function') {
            showToast(`Zone ${zone} is now in sleep mode for 30 minutes`, 'warning');
        }
        
        // Auto wake up after 30 minutes
        setTimeout(() => {
            systemState[zone].mode = 'auto';
            if (typeof showToast === 'function') {
                showToast(`Zone ${zone} sleep mode ended, auto mode restored`, 'success');
            }
        }, 30 * 60 * 1000);
    }
}

/**
 * Restart Controller
 * Simulates remote controller restart
 */
function restartController(zone) {
    if (confirm(`Restart controller for Zone ${zone}? This will take about 10 seconds.`)) {
        if (typeof showToast === 'function') {
            showToast(`Restarting controller for Zone ${zone}...`, 'info');
        }
        
        // Simulate restart delay
        setTimeout(() => {
            if (typeof showToast === 'function') {
                showToast(`Controller for Zone ${zone} restarted successfully`, 'success');
            }
        }, 3000);
    }
}

// Initialize card menus when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCardMenus);
} else {
    initCardMenus();
}

/**
 * Device Heartbeat Monitor
 * Simulates device connection status
 */
const deviceStatus = {
    A: { online: true, lastSeen: Date.now(), signalStrength: 85 },
    B: { online: true, lastSeen: Date.now(), signalStrength: 72 }
};

function initDeviceHeartbeat() {
    // Check device status every 10 seconds
    setInterval(() => {
        ['A', 'B'].forEach(zone => {
            updateDeviceStatus(zone);
        });
    }, 10000);
}

function updateDeviceStatus(zone) {
    const indicator = document.getElementById(`heartbeat-${zone}`);
    if (!indicator) return;
    
    // Simulate random connection issues
    const rand = Math.random();
    if (rand > 0.95) {
        deviceStatus[zone].online = false;
    } else if (rand > 0.9) {
        deviceStatus[zone].signalStrength = Math.max(30, deviceStatus[zone].signalStrength - 10);
    } else {
        deviceStatus[zone].online = true;
        deviceStatus[zone].signalStrength = Math.min(100, deviceStatus[zone].signalStrength + 5);
        deviceStatus[zone].lastSeen = Date.now();
    }
    
    // Update visual indicator
    const status = deviceStatus[zone];
    indicator.classList.remove('offline', 'weak');
    
    if (!status.online) {
        indicator.classList.add('offline');
        indicator.style.color = '#ff6b6b';
        indicator.textContent = 'wifi_off';
        if (typeof showToast === 'function') {
            showToast(`Zone ${zone} device appears offline!`, 'error');
        }
    } else if (status.signalStrength < 50) {
        indicator.classList.add('weak');
        indicator.style.color = '#ffd93d';
        indicator.textContent = 'signal_wifi_statusbar_null';
    } else {
        indicator.style.color = '#4be277';
        indicator.textContent = 'wifi';
    }
}

/**
 * Dynamic Gauge Color Update
 * Changes gauge color based on sensor value
 */
function updateGaugeColor(zone) {
    const gauge = document.querySelector(`#sensor-${zone}`).closest('.relative').querySelector('circle:last-child');
    if (!gauge) return;
    
    const value = systemState[zone].sensorValue;
    const target = systemState[zone].target;
    const diff = Math.abs(value - target);
    
    gauge.classList.remove('gauge-optimal', 'gauge-warning', 'gauge-critical');
    
    if (diff <= 10) {
        gauge.classList.add('gauge-optimal');
    } else if (diff <= 20) {
        gauge.classList.add('gauge-warning');
    } else {
        gauge.classList.add('gauge-critical');
    }
}

/**
 * Water Usage Tracking
 * Estimates water consumption based on pump activity
 */
const waterUsage = {
    A: { today: 0, lastReset: new Date().setHours(0, 0, 0, 0) },
    B: { today: 0, lastReset: new Date().setHours(0, 0, 0, 0) }
};

function trackWaterUsage(zone, pumpOn) {
    // Reset at midnight
    const now = Date.now();
    if (now - waterUsage[zone].lastReset > 24 * 60 * 60 * 1000) {
        waterUsage[zone].today = 0;
        waterUsage[zone].lastReset = now;
    }
    
    // Estimate 0.5 liters per minute when pump is on
    if (pumpOn) {
        waterUsage[zone].today += 0.5;
    }
    
    updateWaterUsageDisplay(zone);
}

function updateWaterUsageDisplay(zone) {
    const btn = document.getElementById(`pump-btn-${zone}`);
    if (!btn) return;
    
    // Remove existing water usage display
    const existing = btn.parentElement.querySelector('.water-usage');
    if (existing) existing.remove();
    
    const usageDiv = document.createElement('div');
    usageDiv.className = 'water-usage';
    usageDiv.innerHTML = `Estimated water used today: <span class="usage-value">${waterUsage[zone].today.toFixed(1)}L</span>`;
    btn.parentElement.insertBefore(usageDiv, btn.nextSibling);
}

/**
 * Activity Log System
 * Enhanced logging with filters, grouping, and duration tracking
 */
const activityLog = [];
let currentLogFilter = 'all';
let displayedLogCount = 10;

/**
 * Add new log entry with enhanced information
 */
function addLogEntry(type, zone, title, subtitle, duration = null) {
    const now = new Date();
    const logEntry = {
        id: Date.now() + Math.random(),
        type, // 'pump-on', 'pump-off', 'alert', 'settings'
        zone, // 'A', 'B', or null
        title,
        subtitle,
        duration,
        timestamp: now,
        time: now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        date: now.toDateString()
    };
    
    activityLog.unshift(logEntry); // Add to beginning
    
    // Render the new log if it matches current filter
    if (shouldShowLog(logEntry, currentLogFilter)) {
        renderLogEntry(logEntry, true);
    }
    
    // Keep max 100 entries in memory
    if (activityLog.length > 100) {
        activityLog.pop();
    }
}

/**
 * Check if log should be shown based on filter
 */
function shouldShowLog(log, filter) {
    switch(filter) {
        case 'all': return true;
        case 'zone-a': return log.zone === 'A';
        case 'zone-b': return log.zone === 'B';
        case 'pump': return log.type === 'pump-on' || log.type === 'pump-off';
        case 'alert': return log.type === 'alert';
        default: return true;
    }
}

/**
 * Render a single log entry
 */
function renderLogEntry(log, prepend = false) {
    const container = document.getElementById('activity-log');
    if (!container) return;
    
    const todayGroup = container.querySelector('.log-date-group') || container;
    
    const iconConfig = {
        'pump-on': { icon: 'play_circle', class: 'pump-on' },
        'pump-off': { icon: 'stop_circle', class: 'pump-off' },
        'alert': { icon: 'error', class: 'alert' },
        'settings': { icon: 'tune', class: 'settings' }
    };
    
    const config = iconConfig[log.type] || iconConfig.settings;
    const zoneBadge = log.zone ? `<span class="log-zone-badge zone-${log.zone.toLowerCase()}">Zone ${log.zone}</span>` : '';
    const durationBadge = log.duration ? `<span class="log-duration">${log.duration}</span>` : '';
    
    const logHTML = `
        <div class="log-item" data-id="${log.id}" data-type="${log.type}" data-zone="${log.zone || ''}">
            <div class="log-icon ${config.class}">
                <span class="material-symbols-outlined text-sm">${config.icon}</span>
            </div>
            <div class="log-content">
                <div class="log-title">${log.title}${zoneBadge}${durationBadge}</div>
                <div class="log-subtitle">${log.subtitle}</div>
                <div class="log-time">${log.time}</div>
            </div>
        </div>
    `;
    
    if (prepend) {
        // Insert after the date group header
        const firstLog = todayGroup.querySelector('.log-item');
        if (firstLog) {
            firstLog.insertAdjacentHTML('beforebegin', logHTML);
        } else {
            todayGroup.insertAdjacentHTML('beforeend', logHTML);
        }
    } else {
        todayGroup.insertAdjacentHTML('beforeend', logHTML);
    }
}

/**
 * Initialize Activity Log Filter Buttons
 */
function initActivityLogFilters() {
    const filterBtns = document.querySelectorAll('.log-filter-btn');
    
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active from all
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            currentLogFilter = btn.dataset.filter;
            renderFilteredLogs();
        });
    });
}

/**
 * Render logs based on current filter
 */
function renderFilteredLogs() {
    const container = document.getElementById('activity-log');
    if (!container) return;
    
    // Clear existing logs (keep date group header)
    const dateGroup = container.querySelector('.log-date-group');
    if (dateGroup) {
        const logs = dateGroup.querySelectorAll('.log-item');
        logs.forEach(log => log.remove());
    }
    
    // Filter and render
    const filtered = activityLog.filter(log => shouldShowLog(log, currentLogFilter));
    const toShow = filtered.slice(0, displayedLogCount);
    
    toShow.forEach(log => renderLogEntry(log, false));
    
    // Update load more button visibility
    const loadMoreBtn = document.getElementById('load-more-logs');
    if (loadMoreBtn) {
        loadMoreBtn.style.display = filtered.length > displayedLogCount ? 'block' : 'none';
    }
}

/**
 * Initialize Load More Button
 */
function initLoadMoreButton() {
    const btn = document.getElementById('load-more-logs');
    if (!btn) return;
    
    btn.addEventListener('click', () => {
        displayedLogCount += 10;
        renderFilteredLogs();
    });
}

/**
 * Legacy function for backward compatibility with pump control
 */
function logActivityWithDuration(zone, action, mode) {
    const type = action === 'PUMP ON' ? 'pump-on' : 'pump-off';
    const title = action;
    const subtitle = `Mode: ${mode}`;
    
    // Calculate duration
    let duration = null;
    const prevLog = activityLog.find(log => log.zone === zone && log.type === 'pump-on');
    if (action === 'PUMP OFF' && prevLog) {
        const diff = Math.round((Date.now() - prevLog.timestamp) / 1000 / 60);
        duration = `${diff} mins`;
    }
    
    addLogEntry(type, zone, title, subtitle, duration);
}

// Initialize device heartbeat monitoring and Activity Log
function initDashboardFeatures() {
    initDeviceHeartbeat();
    initActivityLogFilters();
    initLoadMoreButton();
    
    // Add some sample logs for demonstration
    setTimeout(() => {
        addLogEntry('pump-on', 'A', 'Pump ON', 'Auto mode triggered - Humidity below 60%', null);
        addLogEntry('pump-off', 'B', 'Pump OFF', 'Manual stop by user', '5 mins');
        addLogEntry('settings', 'A', 'Threshold Updated', 'Humidity target set to 65%', null);
    }, 1000);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDashboardFeatures);
} else {
    initDashboardFeatures();
}

// Export functions for use in pump control
window.trackWaterUsage = trackWaterUsage;
window.logActivityWithDuration = logActivityWithDuration;
window.updateGaugeColor = updateGaugeColor;
window.addLogEntry = addLogEntry;

/**
 * Logout Handler
 * Signs out user from Supabase and redirects to login
 */
async function handleLogout() {
    const supabase = getSupabaseDashboard();
    if (supabase) {
        await supabase.auth.signOut();
    }
    console.log('User logged out, redirecting to login...');
    window.location.href = window.location.origin + '/pages/login.html';
}

// Emergency force entry function for debugging
window.forceEntry = () => { 
    console.log("Mencoba masuk paksa...");
    window.location.replace(window.location.origin + '/pages/dashboard.html'); 
};

// Expose logout handler to window for inline onclick
window.handleLogout = handleLogout;

/**
 * Schedule Modal Functions
 * For managing misting schedules (daily, weekly, monthly)
 */
let currentScheduleZone = 'A';

function showScheduleModal(zone) {
    currentScheduleZone = zone;
    const modal = document.getElementById('schedule-modal');
    const zoneLabel = document.getElementById('schedule-zone-label');
    
    // Update zone label
    const zoneName = zone === 'A' ? 'Indoor Misting' : 'Outdoor Polybag';
    zoneLabel.textContent = `Zone ${zone} • ${zoneName}`;
    
    // Show modal
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    
    // Generate calendar for monthly view
    generateMonthlyCalendar();
    
    // Setup weekly day listeners
    setupWeeklyDayListeners();
    
    // Load existing schedule if any
    loadExistingSchedule(zone);
    
    console.log(`[Schedule] Opened modal for Zone ${zone}`);
}

function hideScheduleModal() {
    const modal = document.getElementById('schedule-modal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

function switchScheduleTab(tab) {
    // Update tab buttons
    document.querySelectorAll('.schedule-tab').forEach(btn => {
        if (btn.dataset.tab === tab) {
            btn.classList.remove('text-on-surface-variant');
            btn.classList.add('bg-primary', 'text-on-primary');
        } else {
            btn.classList.remove('bg-primary', 'text-on-primary');
            btn.classList.add('text-on-surface-variant');
        }
    });
    
    // Show/hide panels
    document.querySelectorAll('.schedule-panel').forEach(panel => {
        panel.classList.add('hidden');
    });
    document.getElementById(`${tab}-panel`).classList.remove('hidden');
    
    console.log(`[Schedule] Switched to ${tab} tab`);
}

function generateMonthlyCalendar() {
    const calendar = document.getElementById('monthly-calendar');
    if (!calendar) return;
    
    calendar.innerHTML = '';
    const daysInMonth = 31; // Simplified for demo
    const startOffset = 2; // Tuesday start (0=Sunday)
    
    // Empty cells for offset
    for (let i = 0; i < startOffset; i++) {
        const empty = document.createElement('div');
        calendar.appendChild(empty);
    }
    
    // Day cells
    for (let day = 1; day <= daysInMonth; day++) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'monthly-day-btn py-2 rounded-lg font-label text-xs font-medium bg-surface-container-high text-on-surface hover:bg-primary/20 transition-all';
        btn.textContent = day;
        btn.dataset.day = day;
        btn.onclick = () => toggleMonthlyDay(btn);
        calendar.appendChild(btn);
    }
}

function toggleMonthlyDay(btn) {
    btn.classList.toggle('bg-primary');
    btn.classList.toggle('text-on-primary');
    btn.classList.toggle('bg-surface-container-high');
    btn.classList.toggle('text-on-surface');
}

// Weekly day selection - setup when modal opens
function setupWeeklyDayListeners() {
    document.querySelectorAll('#weekly-panel .day-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            btn.classList.toggle('bg-primary');
            btn.classList.toggle('text-on-primary');
            btn.classList.toggle('bg-surface-container-high');
            btn.classList.toggle('text-on-surface');
        });
    });
}

async function saveSchedule() {
    const activeTab = document.querySelector('.schedule-tab.bg-primary').dataset.tab;
    const duration = document.getElementById('mist-duration').value;
    
    let scheduleData = {
        zone: currentScheduleZone,
        type: activeTab,
        duration: parseInt(duration),
        enabled: true,
        created_at: new Date().toISOString()
    };
    
    // Collect data based on active tab
    if (activeTab === 'daily') {
        scheduleData.schedule = {
            morning: {
                time: document.getElementById('daily-morning-time').value,
                enabled: document.getElementById('daily-morning-enabled').checked
            },
            noon: {
                time: document.getElementById('daily-noon-time').value,
                enabled: document.getElementById('daily-noon-enabled').checked
            },
            evening: {
                time: document.getElementById('daily-evening-time').value,
                enabled: document.getElementById('daily-evening-enabled').checked
            }
        };
    } else if (activeTab === 'weekly') {
        const selectedDays = [];
        document.querySelectorAll('#weekly-panel .day-btn.bg-primary').forEach(btn => {
            selectedDays.push(btn.dataset.day);
        });
        scheduleData.schedule = {
            days: selectedDays,
            time: document.getElementById('weekly-time').value
        };
    } else if (activeTab === 'monthly') {
        const selectedDates = [];
        document.querySelectorAll('#monthly-calendar .monthly-day-btn.bg-primary').forEach(btn => {
            selectedDates.push(parseInt(btn.dataset.day));
        });
        scheduleData.schedule = {
            dates: selectedDates,
            time: document.getElementById('monthly-time').value
        };
    }
    
    // Save to localStorage for now (can be upgraded to Supabase)
    const schedules = JSON.parse(localStorage.getItem('mistSchedules') || '{}');
    schedules[currentScheduleZone] = scheduleData;
    localStorage.setItem('mistSchedules', JSON.stringify(schedules));
    
    console.log('[Schedule] Saved:', scheduleData);
    
    // Show success feedback
    const saveBtn = document.querySelector('#schedule-modal button[onclick="saveSchedule()"]');
    const originalText = saveBtn.textContent;
    saveBtn.textContent = '✓ Saved!';
    saveBtn.classList.add('bg-success');
    
    setTimeout(() => {
        saveBtn.textContent = originalText;
        saveBtn.classList.remove('bg-success');
        hideScheduleModal();
    }, 1500);
    
    // Log the schedule
    addLogEntry(currentScheduleZone, 'schedule', `Schedule updated: ${activeTab} mode, ${duration}min duration`);
}

function loadExistingSchedule(zone) {
    const schedules = JSON.parse(localStorage.getItem('mistSchedules') || '{}');
    const schedule = schedules[zone];
    
    if (!schedule) return;
    
    // Restore duration
    if (schedule.duration) {
        document.getElementById('mist-duration').value = schedule.duration;
    }
    
    // Restore schedule type and values
    if (schedule.type) {
        switchScheduleTab(schedule.type);
        
        if (schedule.type === 'daily' && schedule.schedule) {
            const s = schedule.schedule;
            if (s.morning) {
                document.getElementById('daily-morning-time').value = s.morning.time;
                document.getElementById('daily-morning-enabled').checked = s.morning.enabled;
            }
            if (s.noon) {
                document.getElementById('daily-noon-time').value = s.noon.time;
                document.getElementById('daily-noon-enabled').checked = s.noon.enabled;
            }
            if (s.evening) {
                document.getElementById('daily-evening-time').value = s.evening.time;
                document.getElementById('daily-evening-enabled').checked = s.evening.enabled;
            }
        } else if (schedule.type === 'weekly' && schedule.schedule) {
            document.getElementById('weekly-time').value = schedule.schedule.time;
            document.querySelectorAll('#weekly-panel .day-btn').forEach(btn => {
                if (schedule.schedule.days.includes(btn.dataset.day)) {
                    btn.classList.add('bg-primary', 'text-on-primary');
                    btn.classList.remove('bg-surface-container-high', 'text-on-surface');
                }
            });
        } else if (schedule.type === 'monthly' && schedule.schedule) {
            document.getElementById('monthly-time').value = schedule.schedule.time;
            setTimeout(() => {
                document.querySelectorAll('#monthly-calendar .monthly-day-btn').forEach(btn => {
                    if (schedule.schedule.dates.includes(parseInt(btn.dataset.day))) {
                        btn.classList.add('bg-primary', 'text-on-primary');
                        btn.classList.remove('bg-surface-container-high', 'text-on-surface');
                    }
                });
            }, 100);
        }
    }
}

// Expose schedule functions to window
window.showScheduleModal = showScheduleModal;
window.hideScheduleModal = hideScheduleModal;
window.switchScheduleTab = switchScheduleTab;
window.saveSchedule = saveSchedule;

console.log('[Schedule] Functions exposed to window:', {
    showScheduleModal: typeof window.showScheduleModal,
    hideScheduleModal: typeof window.hideScheduleModal,
    switchScheduleTab: typeof window.switchScheduleTab,
    saveSchedule: typeof window.saveSchedule
});

/**
 * Load user profile from Supabase and update UI
 */
async function loadProfileFromSupabase() {
    const supabase = getSupabaseDashboard();
    if (!supabase) return;

    try {
        const sessionResult = await supabase.auth.getSession();
        const user = sessionResult.data?.session?.user;
        if (!user) return;

        console.log('Loading profile for user:', user.id);

        const { data, error } = await supabase
            .from('profiles')
            .select('farm_name')
            .eq('id', user.id)
            .single();

        console.log('Profile data loaded:', data);

        if (error) {
            console.error('Error loading profile:', error);
            return;
        }

        // SAFETY: Only use farm_name, NEVER use role for display
        let displayName = (data && data.farm_name) ? data.farm_name : 'Persada Farm';
        
        // Special case: specific user gets "Persada Farm" only (remove "Bogor")
        if (user.email === '1001dreamsof_gilang@apps.ipb.ac.id') {
            displayName = 'Persada Farm';
            console.log('Special user detected, using farm name:', displayName);
        }
        
        console.log('Updating UI with farm name:', displayName);
        updateFarmNameInUI(displayName);
    } catch (err) {
        console.error('Error loading profile:', err);
    }
}

/**
 * Update farm name in all dashboard UI elements
 * SAFETY: This function ONLY displays farm_name, never role
 */
function updateFarmNameInUI(farmName) {
    // Safety check: ensure we have a valid farm name, not a role
    if (!farmName || ['admin', 'farmer', 'guest'].includes(farmName)) {
        console.warn('Invalid farm name detected, using default:', farmName);
        farmName = 'Persada Farm';
    }

    // Update mobile header farm name - only target the span with text-primary class (farm name, not temperature)
    const mobileFarmName = document.querySelector('header .flex-col span.font-headline.text-primary');
    if (mobileFarmName) {
        mobileFarmName.textContent = farmName + ' Bogor';
    }

    // Also try alternate selector for mobile header
    const mobileTitle = document.querySelector('header h1');
    if (mobileTitle && mobileTitle.textContent.includes('Verdanist') === false) {
        mobileTitle.textContent = farmName;
    }

    // Update sidebar subtitle
    const sidebarSubtitles = document.querySelectorAll('aside p.text-stone-400');
    sidebarSubtitles.forEach(el => {
        if (el.textContent.includes('Farm') || el.textContent.includes('Persada')) {
            el.textContent = farmName;
        }
    });

    // Update page title if needed
    const pageTitle = document.querySelector('title');
    if (pageTitle && pageTitle.textContent.includes('Persada')) {
        pageTitle.textContent = pageTitle.textContent.replace('Persada Farm', farmName);
    }
}

/**
 * Chart Time Range Filter
 * Handles time range switching for the chart
 */
function initChartTimeFilter() {
    const filterBtns = document.querySelectorAll('.time-filter-btn');
    
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active from all
            filterBtns.forEach(b => b.classList.remove('active'));
            // Add active to clicked
            btn.classList.add('active');
            
            const range = btn.dataset.range;
            updateChartData(range);
            
            if (typeof showToast === 'function') {
                showToast(`Chart updated to ${btn.textContent} view`, 'info');
            }
        });
    });
}

function updateChartData(range) {
    // Simulate different data for different time ranges
    const tempPath = document.querySelector('#chart-container path.text-primary');
    const moisturePath = document.querySelector('#chart-container path.text-tertiary');
    const xLabels = document.getElementById('chart-x-labels');
    
    if (!tempPath || !moisturePath) return;
    
    // Update X-axis labels based on time range
    if (xLabels) {
        const labels = generateTimeLabels(range);
        xLabels.innerHTML = labels.map(time => `<span>${time}</span>`).join('');
    }
    
    // Different curve patterns for different time ranges
    const patterns = {
        '1h': {
            temp: 'M 0 60 C 10 60, 10 55, 20 55 C 30 55, 30 70, 40 70 C 50 70, 50 40, 60 40 C 70 40, 70 45, 80 45 C 90 45, 90 30, 100 30',
            moisture: 'M 0 80 C 10 80, 10 85, 20 85 C 30 85, 30 75, 40 75 C 50 75, 50 80, 60 80 C 70 80, 70 65, 80 65 C 90 65, 90 70, 100 70'
        },
        '6h': {
            temp: 'M 0 50 C 15 50, 15 40, 30 40 C 45 40, 45 55, 60 55 C 75 55, 75 35, 90 35 C 95 35, 95 45, 100 45',
            moisture: 'M 0 75 C 15 75, 15 65, 30 65 C 45 65, 45 80, 60 80 C 75 80, 75 60, 90 60 C 95 60, 95 70, 100 70'
        },
        '24h': {
            temp: 'M 0 45 C 20 45, 20 35, 40 35 C 60 35, 60 50, 80 50 C 90 50, 90 40, 100 40',
            moisture: 'M 0 70 C 20 70, 20 60, 40 60 C 60 60, 60 75, 80 75 C 90 75, 90 65, 100 65'
        },
        '7d': {
            temp: 'M 0 40 C 25 40, 25 30, 50 30 C 75 30, 75 45, 100 45',
            moisture: 'M 0 65 C 25 65, 25 55, 50 55 C 75 55, 75 70, 100 70'
        }
    };
    
    const pattern = patterns[range] || patterns['1h'];
    tempPath.setAttribute('d', pattern.temp);
    moisturePath.setAttribute('d', pattern.moisture);
}

/**
 * Chart Tooltip on Hover
 * Shows data point values when hovering over chart
 */
function initChartTooltip() {
    const chartContainer = document.getElementById('chart-container');
    const tooltip = document.getElementById('chart-tooltip');
    
    if (!chartContainer || !tooltip) return;
    
    chartContainer.addEventListener('mousemove', (e) => {
        const rect = chartContainer.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Calculate percentage position
        const xPercent = (x / rect.width) * 100;
        const yPercent = 100 - ((y / rect.height) * 100);
        
        // Simulate data values based on position
        const time = calculateTimeFromPosition(xPercent);
        const tempValue = (25 + (yPercent / 100) * 10).toFixed(1);
        const moistureValue = (40 + (yPercent / 100) * 40).toFixed(0);
        
        // Update tooltip content
        tooltip.querySelector('.tooltip-time').textContent = time;
        tooltip.querySelector('.tooltip-value').innerHTML = `${tempValue}°C / ${moistureValue}%`;
        
        // Position tooltip
        tooltip.style.left = `${Math.min(x + 10, rect.width - 100)}px`;
        tooltip.style.top = `${Math.max(y - 40, 0)}px`;
        tooltip.classList.add('visible');
    });
    
    chartContainer.addEventListener('mouseleave', () => {
        tooltip.classList.remove('visible');
    });
}

function calculateTimeFromPosition(percent) {
    const now = new Date();
    const activeRange = document.querySelector('.time-filter-btn.active')?.dataset.range || '1h';
    
    let minutesBack;
    switch(activeRange) {
        case '1h': minutesBack = 60; break;
        case '6h': minutesBack = 360; break;
        case '24h': minutesBack = 1440; break;
        case '7d': minutesBack = 10080; break;
        default: minutesBack = 60;
    }
    
    const timeOffset = (percent / 100) * minutesBack;
    const targetTime = new Date(now.getTime() - (minutesBack - timeOffset) * 60000);
    
    if (activeRange === '7d') {
        return targetTime.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' });
    }
    return targetTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

/**
 * Generate Time Labels for Chart X-Axis
 * Creates appropriate time labels based on selected range
 */
function generateTimeLabels(range) {
    const now = new Date();
    const labels = [];
    
    switch(range) {
        case '1h':
            // Last hour in 15-min intervals
            for (let i = 4; i >= 0; i--) {
                const time = new Date(now.getTime() - i * 15 * 60000);
                labels.push(time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }));
            }
            break;
        case '6h':
            // Last 6 hours in 1.5-hour intervals
            for (let i = 4; i >= 0; i--) {
                const time = new Date(now.getTime() - i * 90 * 60000);
                labels.push(time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }));
            }
            break;
        case '24h':
            // Last 24 hours in 6-hour intervals
            for (let i = 4; i >= 0; i--) {
                const time = new Date(now.getTime() - i * 6 * 3600000);
                labels.push(time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }));
            }
            break;
        case '7d':
            // Last 7 days
            const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
            for (let i = 6; i >= 0; i--) {
                const time = new Date(now.getTime() - i * 24 * 3600000);
                labels.push(days[time.getDay()]);
            }
            break;
        default:
            labels.push('14:00', '14:15', '14:30', '14:45', '15:00');
    }
    
    return labels;
}

// Initialize chart features
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initChartTimeFilter();
        initChartTooltip();
    });
} else {
    initChartTimeFilter();
    initChartTooltip();
}
