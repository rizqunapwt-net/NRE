import React, { createContext, useContext, useState, useEffect } from 'react';

type ThemeType = 'bokify' | 'warm' | 'dark';

interface ThemeContextType {
    theme: ThemeType;
    setTheme: (theme: ThemeType) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Get initial theme from localStorage or default to 'bokify'
    const [theme, setThemeState] = useState<ThemeType>(() => {
        const saved = localStorage.getItem('nre-active-theme');
        return (saved as ThemeType) || 'bokify';
    });

    const setTheme = (newTheme: ThemeType) => {
        setThemeState(newTheme);
        localStorage.setItem('nre-active-theme', newTheme);
    };

    // Apple the theme class to the document body
    useEffect(() => {
        // Remove all theme classes first
        document.body.classList.remove('theme-bokify', 'theme-warm', 'theme-dark');
        // Add active theme class
        document.body.classList.add(`theme-${theme}`);
    }, [theme]);

    return (
        <ThemeContext.Provider value={{ theme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
