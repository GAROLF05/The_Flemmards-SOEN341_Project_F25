import { NotificationProvider } from "./NotificationProvider";

export function AppProviders({ children }) {
    return (
        <NotificationProvider>
            {children}
        </NotificationProvider>
    );
}
