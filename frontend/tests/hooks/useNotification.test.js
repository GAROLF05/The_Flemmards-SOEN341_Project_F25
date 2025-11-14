import { describe, it, expect, jest } from '@jest/globals';
import { renderHook, act } from '@testing-library/react';
import { useNotification } from '../../src/hooks/useNotification';
import { NotificationContext } from '../../src/context/NotificationContext';

describe('useNotification', () => {
    it('should return the notification context when used within a NotificationProvider', () => {
        // 1. Create a mock context value.
        // This will typically include a function to show notifications.
        const mockContextValue = {
            showNotification: jest.fn(),
        };

        // 2. Create a wrapper component that provides the mock context.
        const wrapper = ({ children }) => (
            <NotificationContext.Provider value={mockContextValue}>
                {children}
            </NotificationContext.Provider>
        );

        // 3. Render the hook with the wrapper.
        const { result } = renderHook(() => useNotification(), { wrapper });

        // 4. Assert that the hook returns the correct context value.
        expect(result.current.showNotification).toBe(mockContextValue.showNotification);
    });

    it('should call the showNotification function with the correct parameters', () => {
        const mockShowNotification = jest.fn();
        const wrapper = ({ children }) => (
            <NotificationContext.Provider value={{ showNotification: mockShowNotification }}>
                {children}
            </NotificationContext.Provider>
        );

        const { result } = renderHook(() => useNotification(), { wrapper });

        // Call the function provided by the hook
        act(() => {
            result.current.showNotification('Test Message', 'success');
        });

        // Assert that the underlying mock function was called correctly
        expect(mockShowNotification).toHaveBeenCalledTimes(1);
        expect(mockShowNotification).toHaveBeenCalledWith('Test Message', 'success');
    });

    // it('should throw an error when used outside of a NotificationProvider', () => {
    //     // Suppress the expected console.error from React for the uncaught error.
    //     const originalError = console.error;
    //     console.error = jest.fn();

    //     // Render the hook without a wrapper, which should cause an error.
    //     const { result } = renderHook(() => useNotification());

    //     // Assert that the hook throws the specific error.
    //     expect(result.error).toEqual(new Error('useNotification must be used within a NotificationProvider'));

    //     // Restore the original console.error function.
    //     console.error = originalError;
    // });
});