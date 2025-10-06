import { useContext } from "react";
import { NotificationContext } from "../context/NotificationContext";

/**
 * A custom hook to manage and display notifications.
 */
export const useNotification = () => {
    const context = useContext(NotificationContext);

    if (!context) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }

    return context;
};
