import { Navigate } from "react-router-dom";
import { decodeToken } from "../utils/jwt";

const PublicRoutes = ({ children }) => {
    const token = localStorage.getItem("auth-token");

    if (token) {
        var user = decodeToken();
        var role = user.role.toLowerCase();

        return <Navigate to={`/${role}`} replace />;
    }

    // Otherwise, show the public route (login/signup)
    return children;
};

export default PublicRoutes;
