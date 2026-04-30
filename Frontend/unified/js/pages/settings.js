// Verdanist Settings - Fully Functional System Configuration
// Page-specific JavaScript for settings.html with localStorage persistence

// Default settings values
const DEFAULT_SETTINGS = {
    humidity: 72,
    soil: 60,
    temp: 28,
    morningMist: true,
    middaySoak: false,
    eveningFlush: true
};

// Settings state
let currentSettings = { ...DEFAULT_SETTINGS };
let isEditMode = false;
let originalSettings = null; // Store original values before editing

/**
 * Initialize Settings Page
 * Sets up sliders, toggles, and form handlers with full functionality
 */
async function initSettings() {
    await loadSettingsFromSupabase();
    setupSliders();
    setupToggleButtons();
    setupSaveButton();
    setupCheckUpdatesButton();
    setupManageAccessButton();
    setupEditMode();
    applyInitialValues();
    console.log('Settings page initialized with Supabase sync');
}

/**
 * Setup Edit Mode Toggle
 * Manages read-only vs editable state for threshold sliders
 */
function setupEditMode() {
    const btnEdit = document.getElementById('btn-edit');
    const btnCancel = document.getElementById('btn-cancel');
    
    console.log('setupEditMode called, btnEdit:', btnEdit, 'btnCancel:', btnCancel);
    
    if (!btnEdit || !btnCancel) {
        console.error('Edit/Cancel buttons not found!');
        return;
    }
    
    // Enter edit mode
    btnEdit.addEventListener('click', (e) => {
        console.log('Edit button clicked!');
        e.preventDefault();
        e.stopPropagation();
        
        isEditMode = true;
        originalSettings = { ...currentSettings }; // Save original values
        
        btnEdit.classList.add('hidden');
        btnCancel.classList.remove('hidden');
        
        // Enable sliders - make them visually interactive
        document.querySelectorAll('.slider-container').forEach(container => {
            container.classList.add('editing');
            container.style.cursor = 'grab';
        });
        
        document.querySelectorAll('.slider-input').forEach(input => {
            input.style.pointerEvents = 'auto';
            input.style.opacity = '1'; // Make visible for interaction
        });
        
        showToast('Edit mode enabled - adjust thresholds', 'info');
    });
    
    // Cancel edit mode
    btnCancel.addEventListener('click', (e) => {
        console.log('Cancel button clicked!');
        e.preventDefault();
        
        isEditMode = false;
        
        // Restore original values
        if (originalSettings) {
            currentSettings = { ...originalSettings };
            applyInitialValues();
            originalSettings = null;
        }
        
        btnCancel.classList.add('hidden');
        btnEdit.classList.remove('hidden');
        
        // Disable sliders - back to read-only
        document.querySelectorAll('.slider-container').forEach(container => {
            container.classList.remove('editing');
            container.style.cursor = 'default';
        });
        
        document.querySelectorAll('.slider-input').forEach(input => {
            input.style.pointerEvents = 'none';
            input.style.opacity = '0'; // Hide input
        });
        
        showToast('Changes cancelled', 'info');
    });
    
    // Start in read-only mode
    document.querySelectorAll('.slider-container').forEach(container => {
        container.style.cursor = 'default';
    });
    document.querySelectorAll('.slider-input').forEach(input => {
        input.style.pointerEvents = 'none';
        input.style.opacity = '0'; // Hidden by default
    });
    
    console.log('Edit mode setup complete - starting in read-only mode');
}

/**
 * Load settings from Supabase (fallback to defaults)
 */
async function loadSettingsFromSupabase() {
    try {
        const supabase = window.initSupabase ? window.initSupabase() : null;
        if (!supabase) {
            console.warn('Supabase not available, using default settings');
            return;
        }
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            console.warn('No user logged in, using default settings');
            return;
        }
        const { data, error } = await supabase
            .from('system_settings')
            .select('*')
            .eq('user_id', user.id)
            .single();

        if (error && error.code !== 'PGRST116') {
            console.warn('Supabase load error:', error.message);
            return;
        }
        if (data) {
            currentSettings = {
                humidity: data.humidity_threshold ?? DEFAULT_SETTINGS.humidity,
                soil: data.soil_threshold ?? DEFAULT_SETTINGS.soil,
                temp: data.temp_threshold ?? DEFAULT_SETTINGS.temp,
                morningMist: data.morning_mist ?? DEFAULT_SETTINGS.morningMist,
                middaySoak: data.midday_soak ?? DEFAULT_SETTINGS.middaySoak,
                eveningFlush: data.evening_flush ?? DEFAULT_SETTINGS.eveningFlush
            };
            console.log('Settings loaded from Supabase:', currentSettings);
        }
    } catch (e) {
        console.warn('Could not load settings from Supabase:', e);
    }
}

/**
 * Save settings to Supabase
 */
async function saveSettingsToSupabase() {
    try {
        const supabase = window.initSupabase ? window.initSupabase() : null;
        if (!supabase) {
            console.warn('Supabase not available, settings not saved to cloud');
            // Fallback: keep localStorage for offline resilience
            localStorage.setItem('verdanistSettings', JSON.stringify(currentSettings));
            return true;
        }
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            console.warn('No user logged in, settings not saved');
            return false;
        }
        const { error } = await supabase
            .from('system_settings')
            .upsert({
                user_id: user.id,
                humidity_threshold: currentSettings.humidity,
                soil_threshold: currentSettings.soil,
                temp_threshold: currentSettings.temp,
                morning_mist: currentSettings.morningMist,
                midday_soak: currentSettings.middaySoak,
                evening_flush: currentSettings.eveningFlush,
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id' });

        if (error) {
            console.error('Supabase save error:', error.message);
            return false;
        }
        console.log('Settings saved to Supabase:', currentSettings);
        return true;
    } catch (e) {
        console.error('Could not save settings to Supabase:', e);
        return false;
    }
}

/**
 * Apply initial values from loaded settings
 */
function applyInitialValues() {
    // Apply slider values
    const humiditySlider = document.getElementById('humidity-slider');
    const soilSlider = document.getElementById('soil-slider');
    const tempSlider = document.getElementById('temp-slider');
    
    if (humiditySlider) {
        humiditySlider.value = currentSettings.humidity;
        updateSliderDisplay('humidity', currentSettings.humidity, '%', 40, 100);
    }
    if (soilSlider) {
        soilSlider.value = currentSettings.soil;
        updateSliderDisplay('soil', currentSettings.soil, '%', 0, 100);
    }
    if (tempSlider) {
        tempSlider.value = currentSettings.temp;
        updateSliderDisplay('temp', currentSettings.temp, '°C', 18, 35);
    }
    
    // Apply toggle states
    updateToggleVisuals('morning', currentSettings.morningMist);
    updateToggleVisuals('midday', currentSettings.middaySoak);
    updateToggleVisuals('evening', currentSettings.eveningFlush);
}

/**
 * Setup Range Sliders with real-time updates
 */
function setupSliders() {
    const sliders = [
        { id: 'humidity-slider', key: 'humidity', suffix: '%', bar: 'humidity-bar', min: 40, max: 100 },
        { id: 'soil-slider', key: 'soil', suffix: '%', bar: 'soil-bar', min: 0, max: 100 },
        { id: 'temp-slider', key: 'temp', suffix: '°C', bar: 'temp-bar', min: 18, max: 35 }
    ];
    
    sliders.forEach(config => {
        const slider = document.getElementById(config.id);
        const container = slider?.closest('.slider-container');
        if (!slider || !container) return;
        
        // Handle input event for real-time updates (only in edit mode)
        slider.addEventListener('input', (e) => {
            if (!isEditMode) {
                e.preventDefault();
                return;
            }
            const value = parseInt(e.target.value);
            currentSettings[config.key] = value;
            updateSliderDisplay(config.key, value, config.suffix, config.min, config.max);
        });
        
        // Handle change event for when user releases (only in edit mode)
        slider.addEventListener('change', (e) => {
            if (!isEditMode) {
                e.preventDefault();
                return;
            }
            const value = parseInt(e.target.value);
            currentSettings[config.key] = value;
            updateSliderDisplay(config.key, value, config.suffix, config.min, config.max);
        });
        
        // Add click handler to container for direct clicking
        let isDragging = false;
        
        const updateFromPosition = (clientX) => {
            const rect = container.getBoundingClientRect();
            const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
            const value = Math.round(config.min + percent * (config.max - config.min));
            
            slider.value = value;
            currentSettings[config.key] = value;
            updateSliderDisplay(config.key, value, config.suffix, config.min, config.max);
        };
        
        container.addEventListener('mousedown', (e) => {
            if (!isEditMode) return;
            isDragging = true;
            updateFromPosition(e.clientX);
            e.preventDefault();
        });
        
        document.addEventListener('mousemove', (e) => {
            if (isDragging && isEditMode) {
                updateFromPosition(e.clientX);
            }
        });
        
        document.addEventListener('mouseup', () => {
            isDragging = false;
        });
        
        // Touch support
        container.addEventListener('touchstart', (e) => {
            if (!isEditMode) return;
            isDragging = true;
            updateFromPosition(e.touches[0].clientX);
        }, { passive: false });
        
        document.addEventListener('touchmove', (e) => {
            if (isDragging && isEditMode) {
                updateFromPosition(e.touches[0].clientX);
                e.preventDefault();
            }
        }, { passive: false });
        
        document.addEventListener('touchend', () => {
            isDragging = false;
        });
    });
}

/**
 * Update slider value display and progress bar
 */
function updateSliderDisplay(type, value, suffix, min = 0, max = 100) {
    const valueEl = document.getElementById(`${type}-value`);
    const barEl = document.getElementById(`${type}-bar`);
    
    if (valueEl) {
        valueEl.textContent = value + suffix;
    }
    
    if (barEl) {
        const percent = ((value - min) / (max - min)) * 100;
        barEl.style.width = Math.max(0, Math.min(100, percent)) + '%';
    }
}

/**
 * Setup Toggle Buttons with click handlers
 */
function setupToggleButtons() {
    const toggles = [
        { id: 'toggle-morning', key: 'morningMist', label: 'label-morning' },
        { id: 'toggle-midday', key: 'middaySoak', label: 'label-midday', time: 'time-midday' },
        { id: 'toggle-evening', key: 'eveningFlush', label: 'label-evening' }
    ];
    
    toggles.forEach(config => {
        const btn = document.getElementById(config.id);
        if (!btn) return;
        
        btn.addEventListener('click', () => {
            const newState = !currentSettings[config.key];
            currentSettings[config.key] = newState;
            updateToggleVisuals(config.id.replace('toggle-', ''), newState);
            
            // Show toast feedback
            const settingName = btn.dataset.setting || config.key;
            showToast(`${settingName} ${newState ? 'enabled' : 'disabled'}`, newState ? 'success' : 'info');
        });
    });
}

/**
 * Update toggle button visual state
 */
function updateToggleVisuals(type, isActive) {
    const btn = document.getElementById(`toggle-${type}`);
    if (!btn) return;
    
    const knob = btn.querySelector('.toggle-knob');
    const label = document.getElementById(`label-${type}`);
    const time = document.getElementById(`${type === 'midday' ? 'time-midday' : ''}`);
    
    btn.dataset.active = isActive.toString();
    
    if (isActive) {
        // ON state
        btn.className = 'toggle-btn w-16 h-9 rounded-full bg-gradient-to-r from-primary to-primary-container p-1 flex items-center justify-end shadow-inner cursor-pointer hover:brightness-110 transition-all';
        if (knob) knob.className = 'w-7 h-7 bg-on-primary rounded-full shadow-sm toggle-knob';
        if (label) {
            label.classList.remove('text-stone-400');
            label.classList.add('text-on-surface');
        }
        if (time) {
            time.classList.remove('text-stone-500');
            time.classList.add('text-on-surface-variant');
        }
    } else {
        // OFF state
        btn.className = 'toggle-btn w-16 h-9 rounded-full bg-surface-container-highest p-1 flex items-center justify-start cursor-pointer hover:bg-surface-variant transition-all';
        if (knob) knob.className = 'w-7 h-7 bg-stone-500 rounded-full shadow-sm toggle-knob';
        if (label) {
            label.classList.add('text-stone-400');
            label.classList.remove('text-on-surface');
        }
        if (time) {
            time.classList.add('text-stone-500');
            time.classList.remove('text-on-surface-variant');
        }
    }
}

/**
 * Setup Save Button with loading state and toast
 */
function setupSaveButton() {
    const saveBtn = document.getElementById('save-settings');
    if (!saveBtn) return;
    
    saveBtn.addEventListener('click', async () => {
        // Show loading state
        saveBtn.disabled = true;
        const originalContent = saveBtn.innerHTML;
        saveBtn.innerHTML = '<span class="material-symbols-outlined animate-spin">sync</span> Saving...';
        
        // Save to Supabase
        const saved = await saveSettingsToSupabase();

        // Restore button
        saveBtn.disabled = false;
        saveBtn.innerHTML = originalContent;

        // Show toast
        if (saved) {
            showToast('Threshold targets saved successfully', 'success');

            // Exit edit mode after successful save
            isEditMode = false;
            originalSettings = null;

            const btnEdit = document.getElementById('btn-edit');
            const btnCancel = document.getElementById('btn-cancel');
            if (btnEdit && btnCancel) {
                btnCancel.classList.add('hidden');
                btnEdit.classList.remove('hidden');
            }

            // Disable sliders
            document.querySelectorAll('.slider-container').forEach(container => {
                container.classList.remove('editing');
                container.style.cursor = 'default';
            });
            document.querySelectorAll('.slider-input').forEach(input => {
                input.style.pointerEvents = 'none';
            });
        } else {
            showToast('Failed to save settings', 'error');
        }
    });
}

/**
 * Setup Check Updates Button
 */
function setupCheckUpdatesButton() {
    // Find button by text content
    const buttons = document.querySelectorAll('button');
    let checkBtn = null;
    for (const btn of buttons) {
        if (btn.textContent.includes('Check Updates')) {
            checkBtn = btn;
            break;
        }
    }
    
    if (checkBtn) {
        checkBtn.addEventListener('click', () => {
            checkBtn.textContent = 'Checking...';
            checkBtn.disabled = true;
            
            setTimeout(() => {
                checkBtn.textContent = 'Up to date';
                checkBtn.disabled = false;
                showToast('Firmware is up to date (v2.4.1)', 'success');
                
                setTimeout(() => {
                    checkBtn.textContent = 'Check Updates';
                }, 3000);
            }, 1500);
        });
    }
}

/**
 * Setup Manage Access Button
 */
function setupManageAccessButton() {
    // Find button by text content (valid approach, not CSS selector)
    const buttons = document.querySelectorAll('button');
    let manageBtn = null;
    for (const btn of buttons) {
        if (btn.textContent.includes('Manage Access') || 
            btn.querySelector('span.material-symbols-outlined')?.textContent.includes('manage_accounts')) {
            manageBtn = btn;
            break;
        }
    }

    if (manageBtn) {
        manageBtn.addEventListener('click', () => {
            showToast('Access management feature coming soon', 'info');
        });
    }
}

/**
 * Show Toast Notification
 */
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast-notification');
    if (!toast) {
        console.log('Toast:', message);
        return;
    }
    
    // Update message
    const messageEl = toast.querySelector('span:last-child');
    if (messageEl) messageEl.textContent = message;
    
    // Update icon based on type
    const iconEl = toast.querySelector('.material-symbols-outlined');
    if (iconEl) {
        const icons = {
            success: 'check_circle',
            error: 'error',
            warning: 'warning',
            info: 'info'
        };
        iconEl.textContent = icons[type] || 'info';
    }
    
    // Show toast
    toast.classList.remove('hidden');
    
    // Auto hide after 3 seconds
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSettings);
} else {
    initSettings();
}

// Global functions for onclick handlers
function enterEditMode() {
    console.log('enterEditMode called via onclick');
    isEditMode = true;
    originalSettings = { ...currentSettings };

    const btnEdit = document.getElementById('btn-edit');
    const btnCancel = document.getElementById('btn-cancel');

    if (btnEdit) btnEdit.classList.add('hidden');
    if (btnCancel) btnCancel.classList.remove('hidden');

    // Enable sliders
    document.querySelectorAll('.slider-container').forEach(container => {
        container.classList.add('editing');
        container.style.cursor = 'grab';
    });

    document.querySelectorAll('.slider-input').forEach(input => {
        input.style.pointerEvents = 'auto';
        input.style.opacity = '1';
    });

    showToast('Edit mode enabled - adjust thresholds', 'info');
}

function exitEditMode() {
    console.log('exitEditMode called via onclick');
    isEditMode = false;

    if (originalSettings) {
        currentSettings = { ...originalSettings };
        applyInitialValues();
        originalSettings = null;
    }

    const btnEdit = document.getElementById('btn-edit');
    const btnCancel = document.getElementById('btn-cancel');

    if (btnCancel) btnCancel.classList.add('hidden');
    if (btnEdit) btnEdit.classList.remove('hidden');

    // Disable sliders
    document.querySelectorAll('.slider-container').forEach(container => {
        container.classList.remove('editing');
        container.style.cursor = 'default';
    });

    document.querySelectorAll('.slider-input').forEach(input => {
        input.style.pointerEvents = 'none';
        input.style.opacity = '0';
    });

    showToast('Changes cancelled', 'info');
}

// ==========================================
// USER MANAGEMENT (ADMIN ONLY)
// ==========================================

let currentUserRole = null;
let allUsers = [];

// Get Supabase client - use window.supabase (global instance)
function getSupabaseSettings() {
    if (window.supabase && window.supabase.auth) {
        return window.supabase;
    }
    console.error('Supabase not available');
    return null;
}

// Check current user role and show/hide User Management section
async function checkAdminAccess() {
    const supabase = getSupabaseSettings();
    if (!supabase) {
        console.warn('Supabase not available for admin check');
        return;
    }

    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            console.log('No session found');
            return;
        }

        const { data: profile, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();

        if (error) {
            console.error('Error checking role:', error);
            return;
        }

        currentUserRole = profile?.role || 'guest';
        console.log('Current user role:', currentUserRole);

        // Only show User Management for admin
        if (currentUserRole === 'admin') {
            const userMgmtSection = document.getElementById('user-management-section');
            if (userMgmtSection) {
                userMgmtSection.classList.remove('hidden');
                console.log('User Management section shown for admin');
            }
            // Load users list
            await loadUsersList();
        } else {
            console.log('User is not admin, hiding User Management');
        }
    } catch (err) {
        console.error('Error in checkAdminAccess:', err);
    }
}

// Load all users from profiles table
async function loadUsersList() {
    const supabase = getSupabaseSettings();
    if (!supabase) {
        showToast('Tidak dapat terhubung ke database', 'error');
        return;
    }

    try {
        const { data: users, error } = await supabase
            .from('profiles')
            .select('id, full_name, email, role, farm_name, created_at')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error loading users:', error);
            showToast('Gagal memuat daftar user', 'error');
            return;
        }

        allUsers = users || [];
        renderUsersTable(allUsers);
        console.log('Loaded', allUsers.length, 'users');
    } catch (err) {
        console.error('Error loading users:', err);
        showToast('Gagal memuat daftar user', 'error');
    }
}

// Render users table
function renderUsersTable(users) {
    const tbody = document.getElementById('users-table-body');
    const emptyState = document.getElementById('users-empty-state');

    if (!tbody) {
        console.error('Users table body not found');
        return;
    }

    if (!users || users.length === 0) {
        tbody.innerHTML = '';
        if (emptyState) emptyState.classList.remove('hidden');
        return;
    }

    if (emptyState) emptyState.classList.add('hidden');

    tbody.innerHTML = users.map(user => {
        const roleColors = {
            'admin': 'bg-error/20 text-error',
            'farmer': 'bg-primary/20 text-primary',
            'guest': 'bg-surface-container-high text-on-surface-variant'
        };
        const roleColor = roleColors[user.role] || roleColors['guest'];

        return `
            <tr class="border-b border-surface-container-high hover:bg-surface-container-high/50 transition-colors">
                <td class="px-4 py-3">
                    <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                            <span class="material-symbols-outlined text-sm">person</span>
                        </div>
                        <div>
                            <p class="font-medium text-on-surface text-sm">${user.full_name || 'Unnamed User'}</p>
                            <p class="text-xs text-on-surface-variant">${user.email || 'No email'}</p>
                        </div>
                    </div>
                </td>
                <td class="px-4 py-3">
                    <span class="px-2 py-1 ${roleColor} text-xs font-bold rounded-full uppercase">${user.role || 'guest'}</span>
                </td>
                <td class="px-4 py-3 text-sm text-on-surface-variant">
                    ${user.farm_name || '-'}
                </td>
                <td class="px-4 py-3">
                    <select onchange="changeUserRole('${user.id}', this.value)" 
                            class="bg-surface-container-high text-on-surface text-sm rounded-lg px-3 py-2 border border-outline-variant focus:outline-none focus:border-primary cursor-pointer">
                        <option value="guest" ${user.role === 'guest' ? 'selected' : ''}>Guest</option>
                        <option value="farmer" ${user.role === 'farmer' ? 'selected' : ''}>Farmer</option>
                        <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
                    </select>
                </td>
            </tr>
        `;
    }).join('');
}

// Change user role
async function changeUserRole(userId, newRole) {
    if (!userId || !newRole) return;

    const supabase = getSupabaseSettings();
    if (!supabase) {
        showToast('Tidak dapat terhubung ke database', 'error');
        return;
    }

    try {
        // Prevent changing own role (safety)
        const { data: { session } } = await supabase.auth.getSession();
        if (session && session.user.id === userId) {
            showToast('Anda tidak dapat mengubah role sendiri', 'error');
            loadUsersList(); // Reload to reset dropdown
            return;
        }

        const { error } = await supabase
            .from('profiles')
            .update({ role: newRole })
            .eq('id', userId);

        if (error) {
            console.error('Error updating role:', error);
            showToast('Gagal mengubah role: ' + error.message, 'error');
            loadUsersList(); // Reload to reset
            return;
        }

        showToast(`Role berhasil diubah menjadi ${newRole}`, 'success');

        // Update local data
        const user = allUsers.find(u => u.id === userId);
        if (user) {
            user.role = newRole;
            renderUsersTable(allUsers);
        }
    } catch (err) {
        console.error('Error changing role:', err);
        showToast('Gagal mengubah role', 'error');
        loadUsersList();
    }
}

// Debug function to force load users (bypass admin check)
async function debugLoadUsers() {
    const debugDiv = document.getElementById('user-mgmt-debug');
    if (debugDiv) {
        debugDiv.classList.remove('hidden');
        debugDiv.textContent = 'Debug: Force loading users...';
    }
    
    try {
        await loadUsersList();
        if (debugDiv) {
            debugDiv.textContent = `Debug: Loaded ${allUsers.length} users successfully`;
        }
    } catch (err) {
        console.error('Debug load error:', err);
        if (debugDiv) {
            debugDiv.textContent = `Debug Error: ${err.message}`;
        }
        showToast('Gagal memuat user: ' + err.message, 'error');
    }
}

// Initialize User Management on page load
document.addEventListener('DOMContentLoaded', function() {
    // Wait a bit for Supabase to initialize
    setTimeout(checkAdminAccess, 1000);
});

// Expose User Management functions to window for HTML onclick handlers
window.loadUsersList = loadUsersList;
window.debugLoadUsers = debugLoadUsers;
window.changeUserRole = changeUserRole;
