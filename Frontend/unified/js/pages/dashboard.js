// Verdanist Dashboard - Pump Control & Schedule Logic
// Page-specific JavaScript for dashboard.html

let currentDeviceId = 'ESP32_INDOOR';

/**
 * Switch between devices (Indoor/Outdoor)
 * Updates currentDeviceId and reloads data from Supabase
 */
async function switchDevice(deviceId) {
    console.log(`[Device Switch] Changing from ${currentDeviceId} to ${deviceId}`);
    currentDeviceId = deviceId;
    
    // Update button UI states
    updateDeviceButtonStates(deviceId);
    
    // Reload data for new device
    await fetchInitialSettings();
    await fetchLatestSensorReadings();
    
    console.log(`[Device Switch] Completed switch to ${deviceId}`);
}

/**
 * Update device toggle button visual states
 */
function updateDeviceButtonStates(activeDeviceId) {
    const btnIndoor = document.getElementById('btn-indoor');
    const btnOutdoor = document.getElementById('btn-outdoor');
    
    if (!btnIndoor || !btnOutdoor) return;
    
    // Reset both to inactive state
    const inactiveClass = 'px-6 py-2.5 rounded-full font-label text-sm font-medium text-gray-500 dark:text-on-surface-variant hover:text-gray-700 dark:hover:text-on-surface transition-all';
    const activeClass = 'px-6 py-2.5 rounded-full font-label text-sm font-medium transition-all bg-primary text-on-primary shadow-md';
    
    if (activeDeviceId === 'ESP32_INDOOR') {
        btnIndoor.className = activeClass;
        btnOutdoor.className = inactiveClass;
    } else {
        btnIndoor.className = inactiveClass;
        btnOutdoor.className = activeClass;
    }
}

async function protectDashboard() {
    createLoadingOverlay();
    
    const supabase = getSupabaseDashboard();
    if (!supabase) {
        console.error('Dashboard: Supabase not available');
        await new Promise(r => setTimeout(r, 2000));
        showDashboardSupabaseError();
        return false;
    }

    const MAX_WAIT_MS = 3000;
    const CHECK_INTERVAL_MS = 500;
    const startTime = Date.now();
    
    while (Date.now() - startTime < MAX_WAIT_MS) {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
            currentUser = session.user;
            
            try {
                const { data: profile, error } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', session.user.id)
                    .single();
                
                const role = profile?.role || 'guest';
                
                if (role === 'admin' || role === 'farmer') {
                    // TAHAP 1: BUKA PINTU
                    document.body.classList.add('auth-verified');
                    removeLoadingOverlay();
                    return true;
                } else if (role === 'guest') {
                    // TAHAP 1: TENDANG GUEST
                    window.location.replace('/pages/welcome-guest.html');
                    return false;
                }
            } catch (roleErr) {
                document.body.classList.add('auth-verified');
                removeLoadingOverlay();
                return true;
            }
        }
        updateLoadingText(`Memverifikasi akses... (${Math.round((Date.now() - startTime) / 1000)}s)`);
        await new Promise(r => setTimeout(r, CHECK_INTERVAL_MS));
    }
    
    removeLoadingOverlay();
    window.location.href = window.location.origin + '/pages/login.html';
    return false;
}

function createLoadingOverlay() {
    if (document.getElementById('role-check-overlay')) return;
    const overlay = document.createElement('div');
    overlay.id = 'role-check-overlay';
    overlay.style.cssText = `position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: #1c1917; z-index: 99999; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 20px;`;
    overlay.innerHTML = `
        <div style="width: 50px; height: 50px; border: 3px solid #44403c; border-top-color: #22c55e; border-radius: 50%; animation: spin 1s linear infinite;"></div>
        <p id="loading-text" style="color: #a8a29e; font-family: 'Inter', sans-serif; font-size: 14px;">Memverifikasi akses...</p>
        <style>@keyframes spin { to { transform: rotate(360deg); } }</style>
    `;
    document.body.appendChild(overlay);
}

function updateLoadingText(text) {
    const loadingText = document.getElementById('loading-text');
    if (loadingText) loadingText.textContent = text;
}

function removeLoadingOverlay() {
    const overlay = document.getElementById('role-check-overlay');
    if (overlay) {
        overlay.style.opacity = '0';
        overlay.style.transition = 'opacity 0.3s ease';
        setTimeout(() => overlay.remove(), 300);
    }
    
    // Also remove auth-blocker from dashboard.html
    const authBlocker = document.getElementById('auth-blocker');
    if (authBlocker) authBlocker.remove();
}

document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') removeLoadingOverlay();
});

window.removeOverlay = removeLoadingOverlay;

(function() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', protectDashboard);
    } else {
        protectDashboard();
    }
})();

function getSupabaseDashboard() {
    if (window.supabase && window.supabase.auth) return window.supabase;
    if (typeof window.initSupabase === 'function') {
        const client = window.initSupabase();
        if (client) return client;
    }
    return null;
}

function showDashboardSupabaseError() {
    const errorDiv = document.createElement('div');
    errorDiv.id = 'supabase-error';
    errorDiv.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:#1c1917;z-index:99999;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:20px;font-family:sans-serif;';
    errorDiv.innerHTML = `
        <div style="color:#dc2626;font-size:48px;">⚠️</div>
        <h2 style="color:#f5f5f4;margin:0;">Koneksi Database Gagal</h2>
        <button onclick="location.reload()" style="padding:12px 24px;background:#dc2626;color:white;border:none;border-radius:8px;cursor:pointer;font-size:16px;">🔄 RELOAD HALAMAN</button>
    `;
    document.body.appendChild(errorDiv);
}

// TAHAP 4: INITIAL FETCH SENSOR
async function fetchLatestSensorReadings() {
    const supabase = getSupabaseDashboard();
    if (!supabase) return;

    try {
        const { data, error } = await supabase
            .from('sensor_readings')
            .select('*')
            .eq('device_id', currentDeviceId)
            .order('recorded_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (data) {
             if (systemState['A']) {
                systemState['A'].sensorValue = Math.round(data.humidity || 0);
                const sensorEl = document.getElementById('sensor-A');
                if(sensorEl) sensorEl.textContent = systemState['A'].sensorValue;
             }
             
             const tempEl = document.querySelector('.font-headline.text-6xl, .font-headline.text-\\[5rem\\]');
             if (tempEl && data.temperature) tempEl.textContent = Math.round(data.temperature);
        }
    } catch (e) {
        console.warn('Could not fetch sensor readings:', e);
    }
}

// TAHAP 3: REALTIME CCTV
function setupRealtimeListeners() {
    const supabase = getSupabaseDashboard();
    if (!supabase) return;

    supabase.channel('pantau-settings').on('postgres_changes', { 
        event: 'UPDATE', schema: 'public', table: 'device_settings'
    }, (payload) => {
        const dataBaru = payload.new;
        if (dataBaru.device_id === currentDeviceId) {
            updateUIBasedOnSettings(dataBaru);
        }
    }).subscribe();

    supabase.channel('pantau-sensor').on('postgres_changes', { 
        event: 'INSERT', schema: 'public', table: 'sensor_readings'
    }, (payload) => {
        const sensorBaru = payload.new;
        if (sensorBaru.device_id === currentDeviceId) {
            if (systemState['A']) {
                systemState['A'].sensorValue = Math.round(sensorBaru.humidity || 0);
                const sensorEl = document.getElementById('sensor-A');
                if (sensorEl) sensorEl.textContent = systemState['A'].sensorValue;
            }
            const tempEl = document.querySelector('.font-headline.text-6xl, .font-headline.text-\\[5rem\\]');
            if (tempEl && sensorBaru.temperature) tempEl.textContent = Math.round(sensorBaru.temperature);
        }
    }).subscribe();
}

// TAHAP 4: INITIAL FETCH SETTINGS
async function fetchInitialSettings() {
    const supabase = getSupabaseDashboard();
    if (!supabase) return;

    try {
        const { data, error } = await supabase
            .from('device_settings')
            .select('*')
            .eq('device_id', currentDeviceId)
            .maybeSingle();

        if (data) updateUIBasedOnSettings(data);
    } catch(err) {
        console.error("Error fetch initial settings", err);
    }
}

function updateUIBasedOnSettings(settings) {
    console.log('[SSOT] Updating UI for device:', settings.device_id, 'Mode:', settings.mode, 'Pump:', settings.pump_status);
    const zone = 'A'; 
    systemState[zone].mode = settings.mode;
    systemState[zone].pumpOn = settings.pump_status;
    
    const container = document.getElementById(`mode-switch-${zone}`);
    if (container) {
        const buttons = container.querySelectorAll('button');
        buttons.forEach(b => {
             b.className = 'flex-1 py-2 px-4 rounded-full font-label text-sm font-medium text-on-surface-variant hover:text-on-surface transition-colors';
        });
        
        const activeBtn = container.querySelector(`button[data-mode="${settings.mode}"]`);
        if (activeBtn) {
            activeBtn.className = 'flex-1 py-2 px-4 rounded-full font-label text-sm font-medium bg-surface-container-low text-primary shadow-[0_4px_12px_rgba(0,0,0,0.2)] border border-outline-variant/20 transition-all';
        }
    }
    
    updateTimerPanel(zone);
    updatePumpUI(zone);
}

const systemState = {
    A: { mode: 'auto', pumpOn: true, sensorValue: 75, target: 75, schedule: [], activeScheduleSlot: null },
    B: { mode: 'manual', pumpOn: false, sensorValue: 42, target: 65, schedule: [], activeScheduleSlot: null }
};

// TAHAP 2: REFACTOR TOMBOL POMPA (HANYA UPDATE KE DB)
function setupPumpToggle(zone) {
    const button = document.getElementById(`pump-btn-${zone}`);
    if (!button) return;

    button.addEventListener('click', async () => {
        if (systemState[zone].mode !== 'manual') return;
        
        const newPumpStatus = !systemState[zone].pumpOn;
        button.innerHTML = '<span class="material-symbols-outlined animate-spin">sync</span> Processing...';
        button.classList.add('opacity-70', 'cursor-wait');

        const supabase = getSupabaseDashboard();
        if (supabase) {
            const { error } = await supabase
                .from('device_settings')
                .update({ pump_status: newPumpStatus })
                .eq('device_id', currentDeviceId);
                
            if (error) {
                updatePumpUI(zone);
            }
        }
    });
}

function updatePumpUI(zone) {
    const button = document.getElementById(`pump-btn-${zone}`);
    if (!button) return;

    const state = systemState[zone];
    const isManual = state.mode === 'manual';
    let statusText = state.pumpOn ? 'PUMP ON' : 'PUMP OFF';

    if (state.pumpOn) {
        button.className = 'w-full py-5 rounded-full bg-gradient-to-r from-primary to-primary-container text-on-primary-container font-headline font-bold text-lg shadow-[0_8px_24px_rgba(75,226,119,0.2)] active:scale-[0.98] transition-all flex items-center justify-center gap-3' + (isManual ? ' hover:opacity-90' : ' opacity-80 cursor-not-allowed');
        button.innerHTML = `<span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">power_settings_new</span> ${statusText}`;
    } else {
        button.className = 'w-full py-5 rounded-full bg-surface-container-highest text-on-surface-variant font-headline font-bold text-lg border border-outline-variant/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3' + (isManual ? ' hover:bg-surface-variant' : ' opacity-80 cursor-not-allowed');
        button.innerHTML = `<span class="material-symbols-outlined">power_settings_new</span> ${statusText}`;
    }

    button.disabled = !isManual;
}

// TAHAP 2: REFACTOR TOMBOL MODE (HANYA UPDATE KE DB)
function setupModeSwitch(zone) {
    const container = document.getElementById(`mode-switch-${zone}`);
    if (!container) return;

    const buttons = container.querySelectorAll('button');
    buttons.forEach(btn => {
        btn.addEventListener('click', async () => {
            const selectedMode = btn.dataset.mode;
            const supabase = getSupabaseDashboard();
            if (supabase) {
                await supabase
                    .from('device_settings')
                    .update({ mode: selectedMode })
                    .eq('device_id', currentDeviceId);
            }
        });
    });
}

function updateTimerPanel(zone) {
    const panel = document.getElementById(`timer-panel-${zone}`);
    if (!panel) return;
    if (systemState[zone].mode === 'timer') {
        panel.classList.remove('hidden');
    } else {
        panel.classList.add('hidden');
    }
}

async function initDashboard() {
    // Set initial device button states
    updateDeviceButtonStates(currentDeviceId);
    
    setupModeSwitch('A');
    setupModeSwitch('B');
    setupPumpToggle('A');
    setupPumpToggle('B');

    await fetchInitialSettings();
    await fetchLatestSensorReadings();
    setupRealtimeListeners();
    
    // --- MANTRA BUKA PINTU ---
    // Force remove loading overlay and show content
    document.body.classList.add('auth-verified');
    document.body.style.visibility = 'visible';
    const loadingScreen = document.getElementById('role-check-overlay');
    if (loadingScreen) {
        loadingScreen.style.opacity = '0';
        loadingScreen.style.transition = 'opacity 0.3s ease';
        setTimeout(() => loadingScreen.remove(), 300);
    }
    // -------------------------
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDashboard);
} else {
    initDashboard();
}

async function handleLogout() {
    const supabase = getSupabaseDashboard();
    if (supabase) await supabase.auth.signOut();
    window.location.href = window.location.origin + '/pages/login.html';
}
window.handleLogout = handleLogout;
