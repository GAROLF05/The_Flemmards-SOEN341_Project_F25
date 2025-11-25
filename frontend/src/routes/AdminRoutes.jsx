import { Navigate } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import DashboardPage from "../pages/admin/DashboardPage";
import ApproveOrganizersPage from "../pages/admin/ApproveOrganizersPage";
import EventModerationPage from "../pages/admin/EventModerationPage";
import OrganizationsPage from "../pages/admin/OrganizationsPage";
import ProtectedRoutes from "./ProtectedRoutes";

const AdminRoutes = [
    {
        path: '/admin',
        element: (
            <ProtectedRoutes>
                <MainLayout accountType="admin" />
            </ProtectedRoutes>
        ),
        children: [
            {
                path: '',
                element: <DashboardPage />
            },
            {
                path: 'home',
                element: <Navigate to="/admin" />
            },
            {
                path: 'dashboard',
                element: <Navigate to="/admin" />
            },
            {
                path: 'approveOrganizers',
                element: <ApproveOrganizersPage />
            },
            {
                path: 'eventModeration',
                element: <EventModerationPage />
            },
            {
                path: 'organizations',
                element: <OrganizationsPage />
            }
        ]
    }
];

export default AdminRoutes;
