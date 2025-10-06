import { Navigate } from "react-router-dom";

const HomeRoutes = [
    {
        path: "/",
        element: <Navigate to="/login" />, // To be updated to include authentication
    }
];

export default HomeRoutes;
