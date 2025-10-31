import { Navigate } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import AdminDashboard from "../pages/admin/AdminDashboard";

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
            }
        ]
    }
];

export default AdminRoutes;
