import { useCallback, useEffect, useMemo, useState } from "react";
import { ThemeContext } from "./ThemeContext";

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState(() => {
        const savedTheme = localStorage.getItem('theme');

        if (savedTheme)
            return savedTheme;

        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

        return prefersDark ? 'dark' : 'light';
    });

    // toggles the current theme
    const toggleTheme = useCallback(() => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    }, []);

    // Set the theme in the local storage everytime the theme changes
    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [theme]);

    // useMemo to ensure the context value object is stable
    const contextValue = useMemo(() => ({ theme: theme, toggleTheme: toggleTheme }), [theme, toggleTheme]);

    return (
        <ThemeContext.Provider value={contextValue}>
            {children}
        </ThemeContext.Provider>
    );
}
