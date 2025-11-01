import { Navigate } from "react-router-dom";

const ProtectedRoutes = ({ children }) => {
    const token = localStorage.getItem("auth-token");

    if (!token) {
        // Redirect to login if no token
        return <Navigate to="/login" replace />;
    }

    // Otherwise render the protected content
    return children;
};

export default ProtectedRoutes;
