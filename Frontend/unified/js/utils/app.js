// Verdanist App - Shared JavaScript
// Used across all pages for common functionality

/**
 * Mobile Sidebar Toggle
 * Creates floating menu button for mobile navigation
 */
function initMobileSidebar() {
    // Always remove mobile menu button - we don't want it
    const existingBtn = document.getElementById('mobile-menu-btn');
    if (existingBtn) existingBtn.remove();
    const existingOverlay = document.getElementById('sidebar-overlay');
    if (existingOverlay) existingOverlay.remove();
    // Mobile menu is disabled - sidebar always visible
}

/**
 * Dark/Light Mode Toggle
 * Initializes theme toggles across the application
 * Only affects buttons specifically marked as theme toggles
 */
function initThemeToggle() {
    // Only select icons that are actually theme toggles (dark_mode or light_mode)
    const themeIcons = document.querySelectorAll('button .material-symbols-outlined');
    let isDarkMode = true;

    themeIcons.forEach(icon => {
        const toggle = icon.closest('button');
        if (!toggle) return;

        const iconText = icon.textContent.trim();
        
        // Only process if this is actually a theme toggle button
        // (has dark_mode or light_mode icon, or has data-theme-toggle attribute)
        const isThemeToggle = iconText === 'dark_mode' || 
                              iconText === 'light_mode' || 
                              toggle.hasAttribute('data-theme-toggle') ||
                              toggle.classList.contains('theme-toggle');
        
        if (!isThemeToggle) return;
        
        toggle.addEventListener('click', () => {
            isDarkMode = !isDarkMode;
            const html = document.documentElement;
            
            if (isDarkMode) {
                html.classList.add('dark');
            } else {
                html.classList.remove('dark');
            }
            
            // Only update the theme icon(s), not other icons in the button
            const themeIconsOnly = toggle.querySelectorAll('.material-symbols-outlined');
            themeIconsOnly.forEach(themeIcon => {
                const text = themeIcon.textContent.trim();
                // Only toggle between dark_mode and light_mode
                if (text === 'light_mode' || text === 'dark_mode') {
                    themeIcon.textContent = isDarkMode ? 'dark_mode' : 'light_mode';
                }
            });
        });
    });
}

/**
 * Toast Notification System
 * Shows temporary notifications to the user
 */
function showToast(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    const iconMap = {
        info: 'info',
        success: 'check_circle',
        warning: 'warning',
        error: 'error'
    };
    
    toast.className = `fixed top-6 right-6 z-50 flex items-center gap-4 bg-surface-container-high px-6 py-4 rounded-full shadow-[0_24px_48px_-12px_rgba(75,226,119,0.1)] border border-outline-variant/15 transition-all duration-300 transform translate-x-full`;
    toast.innerHTML = `
        <span class="material-symbols-outlined text-${type === 'success' ? 'primary' : type === 'error' ? 'error' : 'tertiary'}" style="font-variation-settings: 'FILL' 1;">${iconMap[type] || 'info'}</span>
        <p class="font-body text-sm font-medium text-on-surface">${message}</p>
        <button class="text-on-surface-variant hover:text-on-surface transition-colors ml-2" onclick="this.parentElement.remove()">
            <span class="material-symbols-outlined text-[1.25rem]">close</span>
        </button>
    `;
    
    document.body.appendChild(toast);
    
    // Animate in
    requestAnimationFrame(() => {
        toast.classList.remove('translate-x-full');
    });
    
    // Auto remove
    setTimeout(() => {
        toast.classList.add('translate-x-full');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

/**
 * Password Visibility Toggle
 * Toggles password input visibility
 */
function initPasswordToggle() {
    // Use simpler selector - select all buttons with visibility icon
    const passwordToggles = document.querySelectorAll('button .material-symbols-outlined');
    
    passwordToggles.forEach(icon => {
        if (icon.textContent !== 'visibility' && icon.textContent !== 'visibility_off') return;
        
        const toggle = icon.closest('button');
        if (!toggle) return;
        
        toggle.addEventListener('click', () => {
            const input = toggle.parentElement.querySelector('input[type="password"], input[type="text"]');
            
            if (input && icon) {
                if (input.type === 'password') {
                    input.type = 'text';
                    icon.textContent = 'visibility';
                } else {
                    input.type = 'password';
                    icon.textContent = 'visibility_off';
                }
            }
        });
    });
}

/**
 * Form Validation Helper
 * Adds simple validation feedback to forms
 */
function initFormValidation() {
    const forms = document.querySelectorAll('form');
    
    forms.forEach(form => {
        form.addEventListener('submit', (e) => {
            const requiredFields = form.querySelectorAll('[required]');
            let isValid = true;
            
            requiredFields.forEach(field => {
                if (!field.value.trim()) {
                    isValid = false;
                    field.classList.add('border-error');
                    
                    // Remove error after input
                    field.addEventListener('input', () => {
                        field.classList.remove('border-error');
                    }, { once: true });
                }
            });
            
            if (!isValid) {
                e.preventDefault();
                showToast('Please fill in all required fields', 'error');
            }
        });
    });
}

/**
 * Initialize all shared functionality
 * Call this when DOM is ready
 */
function initApp() {
    initMobileSidebar();
    initThemeToggle();
    initPasswordToggle();
    initFormValidation();
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}
