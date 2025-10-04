import Authentication from "../pages/Authentication";

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
