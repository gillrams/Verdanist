// Verdanist Design System - Tailwind Configuration
// Shared across all pages - Light/Dark Mode Support

tailwind.config = {
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                // Primary Brand Colors (consistent across modes)
                "primary": "#2E7D32",
                "primary-light": "#4be277",
                "primary-container": "#22c55e",
                "on-primary": "#ffffff",
                "on-primary-container": "#004b1e",
                
                // Secondary Colors
                "secondary": "#96d5a3",
                "secondary-container": "#15542e",
                "on-secondary": "#00391a",
                "on-secondary-container": "#88c796",
                
                // Tertiary Colors
                "tertiary": "#8bcfff",
                "tertiary-container": "#36b6fb",
                "on-tertiary": "#00344d",
                "on-tertiary-container": "#004564",
                
                // Error Colors
                "error": "#ffb4ab",
                "error-container": "#93000a",
                "on-error": "#690005",
                "on-error-container": "#ffdad6",
                
                // Light Mode (default) - Clean & Fresh
                "lm-background": "#F9FAFB",
                "lm-surface": "#FFFFFF",
                "lm-surface-variant": "#F3F4F6",
                "lm-surface-container": "#F3F4F6",
                "lm-surface-container-low": "#F9FAFB",
                "lm-surface-container-high": "#E5E7EB",
                "lm-surface-container-highest": "#D1D5DB",
                "lm-on-surface": "#111827",
                "lm-on-surface-variant": "#6B7280",
                "lm-outline": "#D1D5DB",
                "lm-outline-variant": "#E5E7EB",
                
                // Dark Mode - Soil/Earth Theme
                "dm-background": "#161311",
                "dm-surface": "#161311",
                "dm-surface-variant": "#383432",
                "dm-surface-container": "#221f1d",
                "dm-surface-container-low": "#1e1b19",
                "dm-surface-container-high": "#2d2927",
                "dm-surface-container-highest": "#383432",
                "dm-on-surface": "#e9e1dd",
                "dm-on-surface-variant": "#bccbb9",
                "dm-outline": "#869585",
                "dm-outline-variant": "#3d4a3d",
                
                // Semantic aliases for compatibility
                "background": "#161311",
                "surface": "#161311",
                "surface-variant": "#383432",
                "surface-container": "#221f1d",
                "surface-container-low": "#1e1b19",
                "surface-container-high": "#2d2927",
                "surface-container-highest": "#383432",
                "surface-container-lowest": "#100e0c",
                "surface-bright": "#3c3836",
                "surface-dim": "#161311",
                "on-surface": "#e9e1dd",
                "on-surface-variant": "#bccbb9",
                "outline": "#869585",
                "outline-variant": "#3d4a3d",
                
                // Fixed colors
                "primary-fixed": "#6bff8f",
                "primary-fixed-dim": "#4ae176",
                "on-primary-fixed": "#002109",
                "on-primary-fixed-variant": "#005321",
                "secondary-fixed": "#b1f2be",
                "secondary-fixed-dim": "#96d5a3",
                "on-secondary-fixed": "#00210d",
                "on-secondary-fixed-variant": "#12512c",
                "tertiary-fixed": "#c9e6ff",
                "tertiary-fixed-dim": "#89ceff",
                "on-tertiary-fixed": "#001e2f",
                "on-tertiary-fixed-variant": "#004c6e",
                
                // Inverse colors
                "inverse-surface": "#e9e1dd",
                "inverse-on-surface": "#33302d",
                "inverse-primary": "#006e2f",
                "surface-tint": "#4ae176"
            },
            borderRadius: {
                DEFAULT: "1rem",
                lg: "2rem",
                xl: "3rem",
                full: "9999px"
            },
            spacing: {},
            fontFamily: {
                headline: ["Plus Jakarta Sans", "sans-serif"],
                body: ["Manrope", "sans-serif"],
                label: ["Manrope", "sans-serif"]
            }
        }
    }
};
