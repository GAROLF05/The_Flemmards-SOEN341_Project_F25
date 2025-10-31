import { Navigate } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import DashboardPage from "../pages/organizer/DashboardPage";
import TicketScannerPage from "../pages/organizer/TicketScannerPage";

const OrganizerRoutes = [
    {
        path: '/organizer',
        element: <MainLayout accountType="organizer" />,
        children: [
            {
                path: '',
                element: <DashboardPage />
            },
            {
                path: 'home',
                element: <Navigate to="/organizer" />
            },
            {
                path: 'ticketScanner',
                element: <TicketScannerPage />
            }
        ]
    }
];

export default OrganizerRoutes;
