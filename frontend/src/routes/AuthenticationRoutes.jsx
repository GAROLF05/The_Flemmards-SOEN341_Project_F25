import Authentication from "../pages/authentication/Authentication";
import PublicRoutes from "./PublicRoutes";

const AuthenticationRoutes = [
    {
        path: '/login',
        element: (
            <PublicRoutes>
                <Authentication />
            </PublicRoutes>
        ),
    },
    {
        path: '/signup',
        element:
            <PublicRoutes>
                <Authentication />
            </PublicRoutes>,
    },
];

export default AuthenticationRoutes;
