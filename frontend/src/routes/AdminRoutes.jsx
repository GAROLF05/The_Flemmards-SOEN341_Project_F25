import MainLayout from "../layouts/MainLayout";
import Admin from "../pages/admin/Admin";

const AdminRoutes = [
    {
        path: '/admin',
        element: <MainLayout accountType="admin" />,
        children: [
            {
                path: '',
                element: <Admin />
            }
        ]
    }
];

export default AdminRoutes;
