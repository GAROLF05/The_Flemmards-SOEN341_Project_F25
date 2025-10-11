import MainLayout from "../layouts/MainLayout";
import Admin from "../pages/admin/Admin";

const AdminRoutes = [
    {
        path: '/admin',
        element: <MainLayout />,
        children: [
            {
                path: '',
                element: <Admin />
            }
        ]
    }
];

export default AdminRoutes;
