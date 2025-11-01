import Authentication from "../pages/authentication/Authentication";

const AuthenticationRoutes = [
    {
        path: '/login',
        element: <Authentication />,
    },
    {
        path: '/signup',
        element: <Authentication />,
    },
];

export default AuthenticationRoutes;
