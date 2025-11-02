import { useCallback, useMemo, useState } from "react";
import { NotificationContext } from "./NotificationContext";
import Notification from "../components/notification/Notification";

export function NotificationProvider({ children }) {
    const [notifications, setNotifications] = useState([]);

    const closeNotification = useCallback((id) => {
        // Trigger the exit animation
        setNotifications(prev =>
            prev.map(n => (n.id === id ? { ...n, isExiting: true } : n))
        );

        // Remove the notification from the state after the animation completes
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== id));
        }, 500); // Should match the animation duration
    }, []);


    // Use useCallback to prevent the addNotification function from being recreated on every render
    const addNotification = useCallback((message, type = 'info', duration = 4000) => {
        const id = Date.now() + Math.random();
        setNotifications(prev => [...prev, { id, message, type, isExiting: false }]);

        // Set a timeout to automatically dismiss the notification
        setTimeout(() => {
            closeNotification(id);
        }, duration);
    }, [closeNotification]);

    // useMemo to ensure the context value object is stable
    const contextValue = useMemo(() => ({ showNotification: addNotification }), [addNotification]);

    return (
        <NotificationContext.Provider value={contextValue}>
            {children}
            {/* Notification Container */}
            {
                notifications.length > 0 &&
                (
                    <div className="fixed top-0 right-0 p-4 sm:p-6 z-250 w-full max-w-sm">
                        {notifications.map(notification => (
                            <Notification
                                key={notification.id}
                                message={notification.message}
                                type={notification.type}
                                isExiting={notification.isExiting}
                                onClose={() => closeNotification(notification.id)}
                            />
                        ))}
                    </div>
                )
            }
        </NotificationContext.Provider>
    );
}
