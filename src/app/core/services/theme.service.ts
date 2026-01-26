import { Injectable, signal } from '@angular/core';

export type ThemeType = 'light' | 'dark' | 'brand';

@Injectable({
    providedIn: 'root'
})
export class ThemeService {
    private themeKey = 'app-theme-preference';

    // Use Angular Signals for reactive state
    currentTheme = signal<ThemeType>(this.getStoredTheme());

    constructor() {
        this.applyTheme(this.currentTheme());
    }

    setTheme(theme: ThemeType): void {
        this.currentTheme.set(theme);
        localStorage.setItem(this.themeKey, theme);
        this.applyTheme(theme);
    }

    toggleTheme(): void {
        const nextTheme: ThemeType = this.currentTheme() === 'light' ? 'dark' : 'light';
        this.setTheme(nextTheme);
    }

    private getStoredTheme(): ThemeType {
        const stored = localStorage.getItem(this.themeKey);
        return (stored as ThemeType) || 'light';
    }

    private applyTheme(theme: ThemeType): void {
        const root = document.documentElement;
        const body = document.body;

        // Remove old theme classes
        body.classList.remove('theme-light', 'theme-dark', 'theme-brand');

        // Add new theme class
        body.classList.add(`theme-${theme}`);

        // Update color-scheme for native elements
        if (theme === 'dark') {
            body.style.colorScheme = 'dark';
            root.classList.add('dark');
        } else {
            body.style.colorScheme = 'light';
            root.classList.remove('dark');
        }
    }
}
