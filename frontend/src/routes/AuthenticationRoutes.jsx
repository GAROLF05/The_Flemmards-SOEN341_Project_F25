import Authentication from "../pages/authentication/Authentication";
import PublicRoutes from "./PublicRoutes";
import VerifySuccess from "../pages/VerifySuccess";
import ForgotPassword from "../pages/authentication/ForgotPassword";
import ResetPassword from "../pages/authentication/ResetPassword";

const AuthenticationRoutes = [
  {
    path: "/login",
    element: (
      <PublicRoutes>
        <Authentication />
      </PublicRoutes>
    ),
  },
  {
    path: "/signup",
    element: (
      <PublicRoutes>
        <Authentication />
      </PublicRoutes>
    ),
  },
  {
    path: "/verify-success",
    element: (
      <PublicRoutes>
        <VerifySuccess />
      </PublicRoutes>
    ),
  },
  {
    path: "/forgot-password",
    element: (
      <PublicRoutes>
        <ForgotPassword />
      </PublicRoutes>
    ),
  },
  {
    path: "/reset-password",
    element: (
      <PublicRoutes>
        <ResetPassword />
      </PublicRoutes>
    ),
  },
];

export default AuthenticationRoutes;
