import re

files = [
    r'd:\Project IOT Verdanist\Verdanist\verdanist-react\src\components\dashboard\TimerModal.tsx',
    r'd:\Project IOT Verdanist\Verdanist\verdanist-react\src\components\dashboard\AiAssistantModal.tsx'
]

replacements = [
    # Container background
    (r'bg-white/80 dark:bg-\[\#0A2F1F\]/80', r'bg-card/90'),
    (r'bg-white/80 dark:bg-\[\#071F15\]/80', r'bg-card/90'),
    (r'bg-white/95 dark:bg-\[\#071F15\]/95', r'bg-card/95'),
    
    # Text colors
    (r'text-gray-900 dark:text-white', r'text-foreground'),
    (r'text-gray-500 dark:text-white/60', r'text-muted-foreground'),
    (r'text-gray-500 dark:text-white/50', r'text-muted-foreground'),
    (r'text-gray-400 dark:text-white/40', r'text-muted-foreground'),
    (r'text-gray-400 dark:text-white/30', r'text-muted-foreground/60'),
    (r'text-gray-600 dark:text-white/60', r'text-muted-foreground'),
    (r'text-gray-600 dark:text-white/80', r'text-foreground/80'),
    (r'text-gray-700 dark:text-gray-300', r'text-foreground/90'),
    (r'text-gray-900 dark:text-gray-100', r'text-foreground'),
    
    # Background colors
    (r'bg-gray-100 dark:bg-white/5', r'bg-secondary'),
    (r'bg-gray-50 dark:bg-white/5', r'bg-muted/50'),
    (r'bg-white dark:bg-\[\#05150E\]/60', r'bg-card border border-border'),
    (r'bg-white dark:bg-\[\#05150E\]', r'bg-background'),
    (r'bg-white/50 dark:bg-black/40', r'bg-background/50'),
    (r'bg-gray-100/60 dark:bg-black/30', r'bg-muted'),
    (r'bg-white/60 dark:bg-\[\#071F15\]/40', r'bg-card'),
    (r'bg-gray-50 dark:bg-\[\#05150E\]/50', r'bg-muted/30'),
    (r'bg-emerald-500/5 dark:hover:bg-emerald-500/10', r'bg-emerald-500/10'),
    
    # Border colors
    (r'border-gray-200 dark:border-white/10', r'border-border'),
    (r'border-gray-100 dark:border-white/5', r'border-border/50'),
    (r'border-gray-100 dark:border-white/10', r'border-border'),
    (r'border-gray-200/80 dark:border-white/10', r'border-border'),
    (r'border-gray-200/50 dark:border-white/5', r'border-border/50'),
    (r'border-white/60 dark:border-white/10', r'border-border'),
    
    # Hover states
    (r'hover:bg-gray-200 dark:hover:bg-white/10', r'hover:bg-secondary/80'),
    (r'hover:bg-red-50 dark:hover:bg-red-500/10', r'hover:bg-destructive/10 hover:text-destructive text-muted-foreground'),
]

for file in files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    for old, new in replacements:
        content = re.sub(old, new, content)
        
    with open(file, 'w', encoding='utf-8') as f:
        f.write(content)

print("Done replacing classes.")
