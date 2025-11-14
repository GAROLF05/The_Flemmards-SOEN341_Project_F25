import { describe, it, expect, jest } from '@jest/globals';
import { renderHook } from '@testing-library/react';
import { useTheme } from '../../src/hooks/useTheme';
import { ThemeContext } from '../../src/context/ThemeContext';

describe('useTheme', () => {
    it('should return the theme context when used within a ThemeProvider', () => {
        // 1. Create a mock context value
        const mockContextValue = {
            theme: 'dark',
            toggleTheme: jest.fn(),
        };

        // 2. Create a wrapper component that provides the mock context
        const wrapper = ({ children }) => (
            <ThemeContext.Provider value={mockContextValue}>
                {children}
            </ThemeContext.Provider>
        );

        // 3. Render the hook with the wrapper
        const { result } = renderHook(() => useTheme(), { wrapper });

        // 4. Assert that the hook returns the correct context value
        expect(result.current.theme).toBe('dark');
        expect(result.current.toggleTheme).toBe(mockContextValue.toggleTheme);
    });

    // it('should throw an error when used outside of a ThemeProvider', () => {
    //     // Suppress the expected console.error from React about the uncaught error
    //     const originalError = console.error;
    //     console.error = jest.fn();

    //     // 1. Render the hook without a wrapper
    //     const { result } = renderHook(() => useTheme());

    //     // 2. Assert that accessing the result throws the expected error
    //     // The error is thrown when the hook executes, and testing-library catches it.
    //     // Accessing result.current will re-throw it.
    //     expect(() => result.current).toThrow('useTheme must be used within a ThemeProvider');

    //     // Restore original console.error
    //     console.error = originalError;
    // });
});
