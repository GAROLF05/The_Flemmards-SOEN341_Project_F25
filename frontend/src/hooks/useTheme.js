import { useContext } from "react";
import { ThemeContext } from "../context/ThemeContext";

/**
 * A custom hook to manage the theme.
 */
export const useTheme = () => {
    const context = useContext(ThemeContext);

    if (!context)
        throw new Error('useTheme must be used within a ThemeProvider');

    return context;
};
