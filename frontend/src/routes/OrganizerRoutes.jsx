import { Navigate } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import DashboardPage from "../pages/organizer/DashboardPage";
import TicketScannerPage from "../pages/organizer/TicketScannerPage";
import ProtectedRoutes from "./ProtectedRoutes";

const OrganizerRoutes = [
    {
        path: '/organizer',
        element: (
            <ProtectedRoutes>
                <MainLayout accountType="organizer" />
            </ProtectedRoutes>
        ),
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
