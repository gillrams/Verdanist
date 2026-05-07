// Verdanist Dashboard - Pump Control & Schedule Logic
// Page-specific JavaScript for dashboard.html

let currentDeviceId = 'ESP32_INDOOR';
let lastModeSwitchTime = 0; // Track when mode was switched to prevent realtime override

/**
 * Switch between devices (Indoor/Outdoor)
 * Updates currentDeviceId and reloads data from Supabase
 */
async function switchDevice(deviceId) {
    console.log(`[Device Switch] Requested change from ${currentDeviceId} to ${deviceId}`);
    
    // Show confirmation dialog for device switch
    const isDarkMode = document.documentElement.classList.contains('dark');
    const targetDevice = deviceId === 'ESP32_INDOOR' ? 'Indoor' : 'Outdoor';
    
    const result = await Swal.fire({
        title: `Beralih ke ${targetDevice}?`,
        text: `Anda akan mengontrol area ${targetDevice === 'Indoor' ? 'dalam ruangan' : 'luar ruangan (polybag)'}. Pastikan Anda memantau kondisi tanaman di area tersebut.`,
        icon: 'question',
        background: isDarkMode ? '#161311' : '#ffffff',
        color: isDarkMode ? '#f5f5f4' : '#1c1917',
        showCancelButton: true,
        confirmButtonText: 'Oke',
        cancelButtonText: 'Batal',
        confirmButtonColor: '#dc2626', // red-600
        cancelButtonColor: '#6c757d', // gray
        reverseButtons: true,
        customClass: {
            popup: 'rounded-2xl shadow-2xl',
            confirmButton: 'px-6 py-2 rounded-full font-medium',
            cancelButton: 'px-6 py-2 rounded-full font-medium'
        }
    });
    
    if (!result.isConfirmed) {
        console.log('[Device Switch] Cancelled by user');
        return; // Don't switch device
    }
    
    console.log(`[Device Switch] Changing from ${currentDeviceId} to ${deviceId}`);
    currentDeviceId = deviceId;
    
    // Update button UI states
    updateDeviceButtonStates(deviceId);
    
    // Update dynamic zone title
    const titleEl = document.getElementById('dynamic-zone-title');
    const subtitleEl = document.getElementById('dynamic-zone-subtitle');
    if (titleEl) {
        titleEl.textContent = deviceId === 'ESP32_INDOOR' ? 'Indoor Pump Control' : 'Outdoor Pump Control';
    }
    if (subtitleEl) {
        subtitleEl.textContent = deviceId === 'ESP32_INDOOR' ? 'Zone A • Overhead' : 'Zone B • Drip Lines';
    }
    
    // Update sensor type label (Indoor=Air Humidity, Outdoor=Soil Moisture)
    const sensorTypeEl = document.getElementById('sensor-type-label');
    if (sensorTypeEl) {
        sensorTypeEl.textContent = deviceId === 'ESP32_INDOOR' ? 'Air Humidity' : 'Soil Moisture';
    }
    
    // Show/hide temperature card (only for Indoor)
    const tempCard = document.getElementById('temp-card');
    if (tempCard) {
        tempCard.style.display = deviceId === 'ESP32_INDOOR' ? 'flex' : 'none';
    }
    
    // Kosongkan tampilan sementara (biar user tau data lagi loading)
    const tempEl = document.querySelector('.font-headline.text-6xl, .font-headline.text-\\[5rem\\]');
    if (tempEl) tempEl.textContent = '--';
    
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
        // Fetch latest readings (get multiple to cover temp + humidity/soil)
        const { data, error } = await supabase
            .from('sensor_readings')
            .select('*')
            .eq('device_id', currentDeviceId)
            .order('recorded_at', { ascending: false })
            .limit(5);

        if (data && data.length > 0) {
            // Determine expected sensor type based on device
            const isIndoor = currentDeviceId === 'ESP32_INDOOR';
            const moistureType = isIndoor ? 'humidity' : 'soil_moisture';
            
            // Find moisture reading (humidity for indoor, soil_moisture for outdoor)
            const moistureReading = data.find(r => r.type === moistureType || r.type === 'humidity' || r.type === 'soil');
            const tempReading = data.find(r => r.type === 'temperature');
            
            // Update moisture gauge
            if (moistureReading && systemState['A']) {
                systemState['A'].sensorValue = Math.round(moistureReading.value || 0);
                const sensorEl = document.getElementById('sensor-A');
                if(sensorEl) sensorEl.textContent = systemState['A'].sensorValue;
            }
            
            // Update temperature display (only for Indoor)
            if (isIndoor) {
                const tempEl = document.querySelector('.font-headline.text-6xl, .font-headline.text-\\[5rem\\]');
                if (tempEl && tempReading) tempEl.textContent = Math.round(tempReading.value);
            }
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
            // Check if we just switched mode (within last 2 seconds)
            // If so, we trust our local state more than the realtime update
            // because we already set pump_status to false in our update
            const timeSinceModeSwitch = Date.now() - lastModeSwitchTime;
            if (timeSinceModeSwitch < 2000) {
                console.log(`[Realtime] Ignoring update - mode switched ${timeSinceModeSwitch}ms ago. Our local state: pumpOn=${systemState['A'].pumpOn}`);
                console.log(`[Realtime] Payload pump_status: ${dataBaru.pump_status}, mode: ${dataBaru.mode}`);
                // Still update the mode from payload, but keep our pump state
                systemState['A'].mode = dataBaru.mode;
                updateTimerPanel('A');
                return;
            }
            updateUIBasedOnSettings(dataBaru);
        }
    }).subscribe();

    supabase.channel('pantau-sensor').on('postgres_changes', { 
        event: 'INSERT', schema: 'public', table: 'sensor_readings'
    }, (payload) => {
        const sensorBaru = payload.new;
        if (sensorBaru.device_id === currentDeviceId) {
            const isIndoor = currentDeviceId === 'ESP32_INDOOR';
            const moistureTypes = isIndoor ? ['humidity'] : ['soil_moisture', 'soil'];
            
            // Update moisture gauge if type matches
            if (moistureTypes.includes(sensorBaru.type) && systemState['A']) {
                systemState['A'].sensorValue = Math.round(sensorBaru.value || 0);
                const sensorEl = document.getElementById('sensor-A');
                if (sensorEl) sensorEl.textContent = systemState['A'].sensorValue;
            }
            
            // Update temperature if type is temperature (only for Indoor)
            if (sensorBaru.type === 'temperature' && isIndoor) {
                const tempEl = document.querySelector('.font-headline.text-6xl, .font-headline.text-\\[5rem\\]');
                if (tempEl) tempEl.textContent = Math.round(sensorBaru.value);
            }
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
    try {
        console.log('[SSOT] Updating UI for device:', settings.device_id, 'Mode:', settings.mode, 'Pump:', settings.pump_status);
        const zone = 'A'; 
        systemState[zone].mode = settings.mode;
        systemState[zone].pumpOn = settings.pump_status;
        
        const container = document.getElementById(`mode-switch-${zone}`);
        if (container) {
            const buttons = container.querySelectorAll('button');
            buttons.forEach(b => {
                 b.className = 'flex-1 py-2 px-4 rounded-full font-label text-sm font-medium text-on-surface-variant hover:text-on-surface transition-colors';
                 // Re-enable buttons after SSOT update
                 b.disabled = false;
                 b.style.opacity = '1';
            });
            
            const activeBtn = container.querySelector(`button[data-mode="${settings.mode}"]`);
            if (activeBtn) {
                activeBtn.className = 'flex-1 py-2 px-4 rounded-full font-label text-sm font-medium bg-surface-container-low text-primary shadow-[0_4px_12px_rgba(0,0,0,0.2)] border border-outline-variant/20 transition-all';
            }
        }
        
        updateTimerPanel(zone);
        updatePumpUI(zone);
    } catch (err) {
        console.error('[SSOT] Error in updateUIBasedOnSettings:', err);
        // Emergency: always try to re-enable buttons
        const container = document.getElementById('mode-switch-A');
        if (container) {
            const buttons = container.querySelectorAll('button');
            buttons.forEach(b => {
                b.disabled = false;
                b.style.opacity = '1';
            });
        }
    }
}

const systemState = {
    A: { mode: 'auto', pumpOn: true, sensorValue: 75, target: 75, schedule: [], activeScheduleSlot: null }
};

// TAHAP 2: REFACTOR TOMBOL POMPA (HANYA UPDATE KE DB)
function setupPumpToggle(zone) {
    // Use event delegation - attach listener to document once
    document.addEventListener('click', async (e) => {
        // Check if clicked element is the pump button or its child
        const button = e.target.closest(`#pump-btn-${zone}`);
        if (!button) return; // Not the pump button, ignore
        
        console.log(`[Pump Toggle] Button clicked! Zone: ${zone}, Current mode: ${systemState[zone]?.mode}`);
        
        // IMPORTANT: Check manual mode before processing
        if (!systemState[zone] || systemState[zone].mode !== 'manual') {
            console.warn('[Pump Toggle] Ignored - not in manual mode. Current mode:', systemState[zone]?.mode);
            // Show visual feedback that button is disabled
            button.classList.add('shake');
            setTimeout(() => button.classList.remove('shake'), 500);
            return;
        }
        
        const newPumpStatus = !systemState[zone].pumpOn;
        console.log(`[Pump Toggle] Changing pump from ${systemState[zone].pumpOn ? 'ON' : 'OFF'} to ${newPumpStatus ? 'ON' : 'OFF'}`);
        
        // OPTIMISTIC UI: Show loading state immediately
        button.disabled = true;
        button.innerHTML = '<span class="material-symbols-outlined animate-spin">sync</span> Memproses...';
        button.classList.add('opacity-70', 'cursor-wait');

        const supabase = getSupabaseDashboard();
        if (!supabase) {
            console.error('[Pump Toggle] Supabase not available');
            // Reset button state
            updatePumpUI(zone);
            return;
        }

        try {
            const { error } = await supabase
                .from('device_settings')
                .update({ pump_status: newPumpStatus })
                .eq('device_id', currentDeviceId);
                
            if (error) {
                console.error('[Pump Toggle] Database error:', error);
            } else {
                console.log('[Pump Toggle] Successfully updated pump status to:', newPumpStatus);
                // Optimistic update: update local state immediately
                systemState[zone].pumpOn = newPumpStatus;
            }
        } catch (e) {
            console.error('[Pump Toggle] Exception:', e);
        } finally {
            // ALWAYS reset button state via updatePumpUI (handles disabled state based on mode)
            console.log('[Pump Toggle] Resetting button UI');
            updatePumpUI(zone);
        }
    });
    
    console.log(`[Pump Toggle] Event delegation setup complete for zone ${zone}`);
}

function updatePumpUI(zone) {
    try {
        const container = document.getElementById(`pump-container-${zone}`);
        const button = document.getElementById(`pump-btn-${zone}`);
        if (!button) return;

        const state = systemState[zone];
        if (!state) return;
        
        const isManual = state.mode === 'manual';
        const isTimer = state.mode === 'timer';
        
        // Hide pump button in timer mode
        if (container) {
            container.style.display = isTimer ? 'none' : 'block';
        }
        
        // ACTION BUTTON LOGIC: Show what will happen when clicked
        // If pump is OFF → Show "PUMP ON" (Green, ready to turn on)
        // If pump is ON → Show "PUMP OFF" (Gray, ready to turn off)
        if (state.pumpOn) {
            // Pump is currently ON → Action is to turn OFF
            button.className = 'w-full py-5 rounded-full bg-surface-container-highest text-on-surface-variant font-headline font-bold text-lg border border-outline-variant/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3' + (isManual ? ' hover:bg-surface-variant hover:text-on-surface' : ' opacity-80 cursor-not-allowed');
            button.innerHTML = `<span class="material-symbols-outlined">power_settings_new</span> PUMP OFF`;
        } else {
            // Pump is currently OFF → Action is to turn ON
            button.className = 'w-full py-5 rounded-full bg-gradient-to-r from-primary to-primary-container text-on-primary-container font-headline font-bold text-lg shadow-[0_8px_24px_rgba(75,226,119,0.2)] active:scale-[0.98] transition-all flex items-center justify-center gap-3' + (isManual ? ' hover:opacity-90' : ' opacity-80 cursor-not-allowed');
            button.innerHTML = `<span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">power_settings_new</span> PUMP ON`;
        }

        button.disabled = !isManual;
        console.log(`[updatePumpUI] Zone ${zone}: pumpOn=${state.pumpOn}, mode=${state.mode}, disabled=${button.disabled}, timer=${isTimer}`);
    } catch (err) {
        console.error('[updatePumpUI] Error:', err);
    }
}

// TAHAP 2: REFACTOR TOMBOL MODE (HANYA UPDATE KE DB)
function setupModeSwitch(zone) {
    const container = document.getElementById(`mode-switch-${zone}`);
    if (!container) return;

    const buttons = container.querySelectorAll('button');
    buttons.forEach(btn => {
        btn.addEventListener('click', async () => {
            const selectedMode = btn.dataset.mode;
            const previousMode = systemState[zone].mode;
            console.log(`[Mode Switch] Clicked: ${selectedMode} for device ${currentDeviceId}`);
            
            // Check if confirmation is needed (Manual or Timer mode)
            let showConfirmation = false;
            let alertTitle = '';
            let alertText = '';
            
            if (selectedMode === 'manual') {
                showConfirmation = true;
                alertTitle = 'Beralih ke Manual?';
                alertText = 'Perhatian! Penyiraman otomatis berhenti. Jangan lupa nyalakan pompa secara manual jika tanah mulai kering.';
            } else if (selectedMode === 'timer') {
                showConfirmation = true;
                alertTitle = 'Beralih ke Timer?';
                alertText = 'Perhatian! Penyiraman otomatis berhenti. Pastikan Anda sudah menentukan jadwal di menu navigasi agar tanaman tersiram tepat waktu.';
            }
            
            // If confirmation needed, show SweetAlert2
            if (showConfirmation) {
                const isDarkMode = document.documentElement.classList.contains('dark');
                
                const result = await Swal.fire({
                    title: alertTitle,
                    text: alertText,
                    icon: 'warning',
                    background: isDarkMode ? '#161311' : '#ffffff',
                    color: isDarkMode ? '#f5f5f4' : '#1c1917',
                    showCancelButton: true,
                    confirmButtonText: 'Oke',
                    cancelButtonText: 'Batal',
                    confirmButtonColor: '#dc2626', // red-600
                    cancelButtonColor: '#6c757d', // gray
                    reverseButtons: true,
                    customClass: {
                        popup: 'rounded-2xl shadow-2xl',
                        confirmButton: 'px-6 py-2 rounded-full font-medium',
                        cancelButton: 'px-6 py-2 rounded-full font-medium'
                    }
                });
                
                if (!result.isConfirmed) {
                    // User clicked Cancel - revert UI to previous mode
                    console.log(`[Mode Switch] Cancelled by user, reverting to ${previousMode}`);
                    updateUIBasedOnSettings({
                        device_id: currentDeviceId,
                        mode: previousMode,
                        pump_status: systemState[zone].pumpOn
                    });
                    return; // Don't proceed with database update
                }
            }
            
            // Immediate visual feedback (optimistic UI)
            buttons.forEach(b => {
                b.className = 'flex-1 py-2 px-4 rounded-full font-label text-sm font-medium text-on-surface-variant hover:text-on-surface transition-colors';
                b.disabled = true;
                b.style.opacity = '0.5';
            });
            btn.className = 'flex-1 py-2 px-4 rounded-full font-label text-sm font-medium bg-surface-container-low text-primary shadow-[0_4px_12px_rgba(0,0,0,0.2)] border border-outline-variant/20 transition-all';
            
            // Track mode switch time to prevent realtime override
            lastModeSwitchTime = Date.now();
            
            const supabase = getSupabaseDashboard();
            if (supabase) {
                try {
                    // SAFE STATE: Reset pump to OFF when switching any mode
                    const { data, error } = await supabase
                        .from('device_settings')
                        .update({ 
                            mode: selectedMode,
                            pump_status: false  // Always reset pump to OFF for safety
                        })
                        .eq('device_id', currentDeviceId)
                        .select(); // Return updated data to verify
                    
                    if (error) {
                        console.error('[Mode Switch] Supabase UPDATE failed:', error);
                        alert('Gagal mengubah mode: ' + error.message);
                    } else {
                        console.log(`[Mode Switch] Successfully updated to ${selectedMode}`);
                        console.log(`[Mode Switch] Returned data:`, data);
                        console.log(`[Mode Switch] Device ID used: ${currentDeviceId}`);
                        
                        // Verify pump_status was actually updated
                        if (data && data.length > 0) {
                            console.log(`[Mode Switch] DB pump_status: ${data[0].pump_status}, mode: ${data[0].mode}`);
                            if (data[0].pump_status === true) {
                                console.error('[Mode Switch] WARNING: pump_status is still TRUE! Update may have been blocked by RLS or trigger.');
                            }
                        } else {
                            console.error('[Mode Switch] WARNING: No data returned. Row may not exist for device_id:', currentDeviceId);
                        }
                        
                        // CRITICAL: Update local state to prevent desynchronization
                        systemState[zone].mode = selectedMode;
                        systemState[zone].pumpOn = false;  // Force local pump state to OFF regardless of DB
                        console.log(`[Mode Switch] Local state updated: mode='${selectedMode}', pumpOn=false`);
                        
                        // IMMEDIATELY update UI to reflect new state
                        updatePumpUI(zone);
                        updateTimerPanel(zone);
                        console.log(`[Mode Switch] UI updated: pump button should now show OFF state`);
                    }
                } catch (e) {
                    console.error('[Mode Switch] Exception:', e);
                }
            } else {
                console.warn('[Mode Switch] Supabase not available');
            }
            
            // ALWAYS re-enable buttons after attempt (even if Supabase fails)
            buttons.forEach(b => {
                b.disabled = false;
                b.style.opacity = '1';
            });
        });
    });
}

function updateTimerPanel(zone) {
    try {
        const panel = document.getElementById(`timer-panel-${zone}`);
        if (!panel) return;
        if (systemState[zone] && systemState[zone].mode === 'timer') {
            panel.classList.remove('hidden');
            // Fetch and display schedules when panel is shown
            fetchSchedules(zone);
            // Start the schedule checker
            startScheduleChecker(zone);
        } else {
            panel.classList.add('hidden');
            // Stop the schedule checker when not in timer mode
            stopScheduleChecker();
        }
    } catch (err) {
        console.error('[updateTimerPanel] Error:', err);
    }
}

// TAHAP 3: MANAJEMEN JADWAL POMPA (pump_schedules)
async function fetchSchedules(zone) {
    const supabase = getSupabaseDashboard();
    if (!supabase) {
        console.error('[fetchSchedules] Supabase not available');
        return;
    }

    try {
        console.log(`[fetchSchedules] Fetching schedules for zone ${zone}, device ${currentDeviceId}`);
        const { data, error } = await supabase
            .from('pump_schedules')
            .select('*')
            .eq('zone', zone)
            .eq('is_active', true)
            .order('start_time', { ascending: true });

        if (error) {
            console.error('[fetchSchedules] Error:', error);
            return;
        }

        console.log(`[fetchSchedules] Found ${data?.length || 0} schedules`);
        systemState[zone].schedule = data || [];
        renderSchedules(zone);
    } catch (e) {
        console.error('[fetchSchedules] Exception:', e);
    }
}

function renderSchedules(zone) {
    const container = document.getElementById(`schedule-list-${zone}`);
    if (!container) return;

    const schedules = systemState[zone]?.schedule || [];

    if (schedules.length === 0) {
        container.innerHTML = `
            <div class="text-center py-4 text-gray-500 dark:text-on-surface-variant font-label text-sm">
                Belum ada jadwal. Tambahkan jadwal di atas.
            </div>
        `;
        return;
    }

    container.innerHTML = schedules.map(schedule => `
        <div class="flex items-center justify-between bg-white dark:bg-surface-container-low rounded-xl px-3 py-2 border border-gray-200 dark:border-outline-variant/20" data-schedule-id="${schedule.id}">
            <div class="flex items-center gap-3">
                <span class="material-symbols-outlined text-primary text-[18px]">schedule</span>
                <div>
                    <div class="font-headline text-sm font-semibold text-gray-900 dark:text-on-surface">${schedule.start_time}</div>
                    <div class="font-label text-xs text-gray-500 dark:text-on-surface-variant">${schedule.duration} menit</div>
                </div>
            </div>
            <button class="delete-schedule-btn p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    data-zone="${zone}"
                    data-schedule-id="${schedule.id}"
                    title="Hapus jadwal">
                <span class="material-symbols-outlined text-[18px]">delete</span>
            </button>
        </div>
    `).join('');

    console.log(`[renderSchedules] Rendered ${schedules.length} schedules for zone ${zone}`);
}

async function addSchedule(zone) {
    const timeInput = document.getElementById(`schedule-time-${zone}`);
    const durationInput = document.getElementById(`schedule-duration-${zone}`);
    const addButton = document.getElementById(`schedule-add-${zone}`);

    if (!timeInput || !durationInput) {
        console.error('[addSchedule] Input elements not found');
        return;
    }

    const startTime = timeInput.value;
    const duration = parseInt(durationInput.value);

    if (!startTime || !duration || duration < 1) {
        alert('Mohon isi waktu dan durasi yang valid');
        return;
    }

    // Show loading state
    const originalHTML = addButton.innerHTML;
    addButton.disabled = true;
    addButton.innerHTML = '<span class="material-symbols-outlined animate-spin">sync</span> Menyimpan...';

    const supabase = getSupabaseDashboard();
    if (!supabase) {
        console.error('[addSchedule] Supabase not available');
        addButton.disabled = false;
        addButton.innerHTML = originalHTML;
        return;
    }

    try {
        console.log(`[addSchedule] Adding schedule: zone=${zone}, time=${startTime}, duration=${duration}`);
        const { data, error } = await supabase
            .from('pump_schedules')
            .insert({
                zone: zone,
                start_time: startTime,
                duration: duration,
                is_active: true
            })
            .select();

        if (error) {
            console.error('[addSchedule] Error:', error);
            alert('Gagal menambahkan jadwal: ' + error.message);
        } else {
            console.log('[addSchedule] Successfully added:', data);
            // Clear inputs
            timeInput.value = '06:00';
            durationInput.value = '15';
            // Refresh list
            await fetchSchedules(zone);
        }
    } catch (e) {
        console.error('[addSchedule] Exception:', e);
        alert('Terjadi kesalahan saat menambahkan jadwal');
    } finally {
        addButton.disabled = false;
        addButton.innerHTML = originalHTML;
    }
}

async function deleteSchedule(zone, scheduleId) {
    if (!confirm('Yakin ingin menghapus jadwal ini?')) {
        return;
    }

    const supabase = getSupabaseDashboard();
    if (!supabase) {
        console.error('[deleteSchedule] Supabase not available');
        return;
    }

    try {
        console.log(`[deleteSchedule] Deleting schedule ${scheduleId} from zone ${zone}`);
        const { error } = await supabase
            .from('pump_schedules')
            .delete()
            .eq('id', scheduleId);

        if (error) {
            console.error('[deleteSchedule] Error:', error);
            alert('Gagal menghapus jadwal: ' + error.message);
        } else {
            console.log('[deleteSchedule] Successfully deleted schedule');
            // Refresh list
            await fetchSchedules(zone);
        }
    } catch (e) {
        console.error('[deleteSchedule] Exception:', e);
        alert('Terjadi kesalahan saat menghapus jadwal');
    }
}

function setupScheduleManager(zone) {
    const addButton = document.getElementById(`schedule-add-${zone}`);
    const listContainer = document.getElementById(`schedule-list-${zone}`);
    
    if (!addButton) {
        console.warn(`[setupScheduleManager] Add button not found for zone ${zone}`);
        return;
    }

    // Use event delegation for add button
    addButton.addEventListener('click', () => {
        console.log(`[setupScheduleManager] Add schedule clicked for zone ${zone}`);
        addSchedule(zone);
    });

    // Use event delegation for delete buttons (works even after re-rendering)
    if (listContainer) {
        listContainer.addEventListener('click', (e) => {
            const deleteBtn = e.target.closest('.delete-schedule-btn');
            if (deleteBtn) {
                const scheduleId = deleteBtn.dataset.scheduleId;
                const btnZone = deleteBtn.dataset.zone;
                console.log(`[ScheduleManager] Delete clicked for schedule ${scheduleId} in zone ${btnZone}`);
                deleteSchedule(btnZone, scheduleId);
            }
        });
    }

    console.log(`[setupScheduleManager] Setup complete for zone ${zone}`);
}

// SATPAM WAKTU: Background interval checker for schedules
let scheduleCheckerInterval = null;

function startScheduleChecker(zone) {
    // Stop any existing checker
    if (scheduleCheckerInterval) {
        clearInterval(scheduleCheckerInterval);
        scheduleCheckerInterval = null;
    }
    
    console.log(`[Satpam Waktu] Starting schedule checker for zone ${zone}`);
    
    // Run every 10 seconds
    scheduleCheckerInterval = setInterval(async () => {
        // Only run if mode is timer
        if (systemState[zone]?.mode !== 'timer') {
            return;
        }
        
        const supabase = getSupabaseDashboard();
        if (!supabase) return;
        
        try {
            // Get current time (HH:mm format)
            const now = new Date();
            const currentTime = now.toTimeString().slice(0, 5); // "13:25"
            const currentMinutes = (now.getHours() * 60) + now.getMinutes();
            
            // Fetch active schedules
            const { data: schedules, error } = await supabase
                .from('pump_schedules')
                .select('*')
                .eq('zone', zone)
                .eq('is_active', true);
            
            if (error) {
                console.error('[Satpam Waktu] Error fetching schedules:', error);
                return;
            }
            
            // Check if current time falls within any schedule
            let shouldPumpBeOn = false;
            
            for (const schedule of schedules || []) {
                const [startHour, startMin] = schedule.start_time.split(':').map(Number);
                const startMinutes = (startHour * 60) + startMin;
                const endMinutes = startMinutes + schedule.duration;
                
                // Check if current time is within schedule range
                if (currentMinutes >= startMinutes && currentMinutes < endMinutes) {
                    shouldPumpBeOn = true;
                    console.log(`[Satpam Waktu] ACTIVE: Schedule ${schedule.start_time} (${schedule.duration}min) is running now (${currentTime})`);
                    break;
                }
            }
            
            // Update pump status if needed
            const currentPumpStatus = systemState[zone]?.pumpOn;
            
            if (shouldPumpBeOn && !currentPumpStatus) {
                // Should be ON but currently OFF
                console.log(`[Satpam Waktu] TURNING PUMP ON - Schedule active at ${currentTime}`);
                const { error: updateError } = await supabase
                    .from('device_settings')
                    .update({ pump_status: true })
                    .eq('device_id', currentDeviceId);
                
                if (updateError) {
                    console.error('[Satpam Waktu] Failed to turn pump ON:', updateError);
                } else {
                    systemState[zone].pumpOn = true;
                    updatePumpUI(zone);
                    console.log('[Satpam Waktu] Pump is now ON');
                }
            } else if (!shouldPumpBeOn && currentPumpStatus) {
                // Should be OFF but currently ON
                console.log(`[Satpam Waktu] TURNING PUMP OFF - No active schedule at ${currentTime}`);
                const { error: updateError } = await supabase
                    .from('device_settings')
                    .update({ pump_status: false })
                    .eq('device_id', currentDeviceId);
                
                if (updateError) {
                    console.error('[Satpam Waktu] Failed to turn pump OFF:', updateError);
                } else {
                    systemState[zone].pumpOn = false;
                    updatePumpUI(zone);
                    console.log('[Satpam Waktu] Pump is now OFF');
                }
            }
            
        } catch (e) {
            console.error('[Satpam Waktu] Exception:', e);
        }
    }, 10000); // Every 10 seconds
    
    console.log(`[Satpam Waktu] Checker started - runs every 10 seconds`);
}

function stopScheduleChecker() {
    if (scheduleCheckerInterval) {
        clearInterval(scheduleCheckerInterval);
        scheduleCheckerInterval = null;
        console.log('[Satpam Waktu] Checker stopped');
    }
}

/**
 * Check user role and hide Admin menu for non-admin users
 */
async function checkUserRoleAndHideAdminMenu() {
    const supabase = getSupabaseDashboard();
    if (!supabase) return;

    try {
        // Get current user
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error || !user) {
            console.warn('[Role Check] No user logged in:', error);
            return;
        }

        // Fetch user role from profiles table
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profileError) {
            console.warn('[Role Check] Error fetching profile:', profileError);
            return;
        }

        const userRole = profile?.role;
        console.log(`[Role Check] User role: ${userRole}`);

        // Hide Admin menus (desktop and mobile) if user is not admin
        const adminMenuDesktop = document.getElementById('nav-admin-menu');
        const adminMenuMobile = document.getElementById('nav-admin-menu-mobile');
        
        if (userRole !== 'admin') {
            if (adminMenuDesktop) {
                adminMenuDesktop.style.display = 'none';
                console.log('[Role Check] Admin menu (desktop) hidden for non-admin user');
            }
            if (adminMenuMobile) {
                adminMenuMobile.style.display = 'none';
                console.log('[Role Check] Admin menu (mobile) hidden for non-admin user');
            }
        } else {
            console.log('[Role Check] Admin menus visible for admin user');
        }
    } catch (e) {
        console.error('[Role Check] Exception:', e);
    }
}

async function initDashboard() {
    // Set initial device button states
    updateDeviceButtonStates(currentDeviceId);
    
    // Check user role and hide Admin menu if needed
    await checkUserRoleAndHideAdminMenu();
    
    setupModeSwitch('A');
    setupPumpToggle('A');
    setupScheduleManager('A');

    await fetchInitialSettings();
    await fetchLatestSensorReadings();
    setupRealtimeListeners();
    
    // Start schedule checker if initial mode is timer
    if (systemState['A']?.mode === 'timer') {
        console.log('[initDashboard] Initial mode is timer, starting schedule checker');
        startScheduleChecker('A');
    }
    
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

// ================= THRESHOLD MODAL FUNCTIONS =================

function showThresholdModal(zone) {
    const modal = document.getElementById('threshold-modal');
    if (!modal) return;

    // Close dropdown menu
    const dropdown = document.getElementById(`dropdown-menu-${zone}`);
    if (dropdown) dropdown.classList.remove('active');

    // Update zone label
    const label = document.getElementById('threshold-zone-label');
    if (label) {
        label.textContent = zone === 'A' ? 'Zone A • Indoor' : 'Zone B • Outdoor';
    }

    modal.classList.remove('hidden');
    modal.classList.add('flex');
    console.log(`[Threshold Modal] Opened for zone ${zone}`);
}

function hideThresholdModal() {
    const modal = document.getElementById('threshold-modal');
    if (!modal) return;

    modal.classList.add('hidden');
    modal.classList.remove('flex');
    console.log('[Threshold Modal] Closed');
}

async function saveThreshold() {
    const tempInput = document.getElementById('temp-threshold-input');
    const humInput = document.getElementById('hum-threshold-input');

    if (!tempInput || !humInput) {
        console.error('[Save Threshold] Input elements not found');
        return;
    }

    const tempThreshold = parseFloat(tempInput.value);
    const humThreshold = parseFloat(humInput.value);

    if (isNaN(tempThreshold) || isNaN(humThreshold)) {
        console.error('[Save Threshold] Invalid input values');
        return;
    }

    const isDarkMode = document.documentElement.classList.contains('dark');
    const supabase = getSupabaseDashboard();
    if (!supabase) {
        console.error('[Save Threshold] Supabase not available');
        return;
    }

    try {
        console.log(`[Save Threshold] Inserting: temp=${tempThreshold}°C, hum=${humThreshold}%`);

        const { data, error } = await supabase
            .from('sensor_readings')
            .insert({
                zone: 'A',
                type: 'system_config',
                device_id: 'ESP32_INDOOR',
                temp_threshold: tempThreshold,
                hum_threshold: humThreshold
            })
            .select();

        if (error) {
            console.error('[Save Threshold] Supabase error:', error);
            Swal.fire({
                title: 'Gagal!',
                text: 'Tidak dapat menyimpan threshold: ' + error.message,
                icon: 'error',
                background: isDarkMode ? '#161311' : '#ffffff',
                color: isDarkMode ? '#f5f5f4' : '#1c1917',
                customClass: { popup: 'rounded-2xl shadow-2xl' }
            });
            return;
        }

        console.log('[Save Threshold] Success:', data);

        Swal.fire({
            title: 'Berhasil!',
            html: `Threshold tersimpan:<br>Temperature: <strong>${tempThreshold}°C</strong><br>Humidity: <strong>${humThreshold}%</strong>`,
            icon: 'success',
            timer: 2500,
            showConfirmButton: false,
            background: isDarkMode ? '#161311' : '#ffffff',
            color: isDarkMode ? '#f5f5f4' : '#1c1917',
            customClass: { popup: 'rounded-2xl shadow-2xl' }
        });

        hideThresholdModal();

    } catch (e) {
        console.error('[Save Threshold] Exception:', e);
        Swal.fire({
            title: 'Error!',
            text: 'Terjadi kesalahan saat menyimpan threshold.',
            icon: 'error',
            background: isDarkMode ? '#161311' : '#ffffff',
            color: isDarkMode ? '#f5f5f4' : '#1c1917',
            customClass: { popup: 'rounded-2xl shadow-2xl' }
        });
    }
}

async function handleLogout() {
    const supabase = getSupabaseDashboard();
    if (supabase) await supabase.auth.signOut();
    window.location.href = window.location.origin + '/pages/login.html';
}
window.handleLogout = handleLogout;
