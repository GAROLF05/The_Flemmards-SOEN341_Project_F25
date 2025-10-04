import Authentication from "../Authentication";

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
