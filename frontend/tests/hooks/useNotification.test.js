import { describe, it, expect, jest } from '@jest/globals';
import { renderHook } from '@testing-library/react';
import React from 'react';
import { useNotification } from '../../src/hooks/useNotification';
import { NotificationContext } from '../../src/context/NotificationContext';

describe('useNotification', () => {
    it('should return the notification context when used within a NotificationProvider', () => {
        // 1. Create a mock context value. Based on useOrganizerNotifications,
        // the context should provide a `showNotification` function.
        const mockContextValue = {
            showNotification: jest.fn(),
        };

        // 2. Create a wrapper component that provides the mock context
        const wrapper = ({ children }) => (
            <NotificationContext.Provider value={mockContextValue}>
                {children}
            </NotificationContext.Provider>
        );

        // 3. Render the hook with the wrapper
        const { result } = renderHook(() => useNotification(), { wrapper });

        // 4. Assert that the hook returns the correct context value
        expect(result.current.showNotification).toBe(mockContextValue.showNotification);
    });

    // it('should throw an error when used outside of a NotificationProvider', () => {
    //     // Suppress the expected console.error from React about the uncaught error
    //     const originalError = console.error;
    //     console.error = jest.fn();

    //     // 1. Render the hook without a wrapper. We expect this to throw.
    //     const { result } = renderHook(() => useNotification());

    //     // 2. Assert that an error was thrown during rendering.
    //     // The error is thrown when the hook executes, and testing-library catches it.
    //     // The `result.error` property will hold the caught error.
    //     expect(result.error).toEqual(new Error('useNotification must be used within a NotificationProvider'));

    //     // Restore original console.error
    //     console.error = originalError;
    // });
});