import { Navigate } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import AdminDashboard from "../pages/admin/AdminDashboard";
import ApproveOrganizers from "../pages/admin/ApproveOrganizers";
import EventModeration from "../pages/admin/EventModeration";

const AdminRoutes = [
    {
        path: '/admin',
        element: <MainLayout accountType="admin" />,
        children: [
            {
                path: '',
                element: <AdminDashboard />
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
                element: <ApproveOrganizers />
            },
            {
                path: 'eventModeration',
                element: <EventModeration />
            }
        ]
    }
];

export default AdminRoutes;
