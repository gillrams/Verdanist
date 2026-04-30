/**
 * Verdanist Theme Toggle Module
 * Handles Light/Dark mode switching with localStorage persistence
 */

(function() {
    'use strict';

    const STORAGE_KEY = 'verdanist-theme';
    const DARK_CLASS = 'dark';

    // Initialize theme on page load
    function initTheme() {
        const savedTheme = localStorage.getItem(STORAGE_KEY);
        const html = document.documentElement;

        if (savedTheme === 'dark') {
            html.classList.add(DARK_CLASS);
        } else {
            // Default to light mode - remove dark class
            html.classList.remove(DARK_CLASS);
        }

        // Update all toggle buttons
        updateToggleIcons();
    }

    // Toggle between light and dark mode
    function toggleTheme() {
        const html = document.documentElement;
        const isDark = html.classList.contains(DARK_CLASS);

        if (isDark) {
            html.classList.remove(DARK_CLASS);
            localStorage.setItem(STORAGE_KEY, 'light');
        } else {
            html.classList.add(DARK_CLASS);
            localStorage.setItem(STORAGE_KEY, 'dark');
        }

        updateToggleIcons();
    }

    // Update icon on all theme toggle buttons
    function updateToggleIcons() {
        const isDark = document.documentElement.classList.contains(DARK_CLASS);
        const toggleButtons = document.querySelectorAll('[data-theme-toggle]');

        toggleButtons.forEach(btn => {
            const icon = btn.querySelector('.material-symbols-outlined');
            if (icon) {
                // Current State pattern:
                // In light mode, show sun (currently in light/day)
                // In dark mode, show moon (currently in dark/night)
                icon.textContent = isDark ? 'dark_mode' : 'light_mode';
            }
        });
    }

    // Setup click handlers for theme toggle buttons
    function setupToggleHandlers() {
        const toggleButtons = document.querySelectorAll('[data-theme-toggle]');
        toggleButtons.forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                toggleTheme();
            });
        });
    }

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            initTheme();
            setupToggleHandlers();
        });
    } else {
        // DOM already loaded
        initTheme();
        setupToggleHandlers();
    }

    // Expose to global scope for manual triggering
    window.verdanistTheme = {
        toggle: toggleTheme,
        init: initTheme,
        isDark: () => document.documentElement.classList.contains(DARK_CLASS)
    };

})();
