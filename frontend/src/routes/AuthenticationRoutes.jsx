import Authentication from "../pages/authentication/Authentication";
import PublicRoutes from "./PublicRoutes";
import VerifySuccess from "../pages/VerifySuccess";

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
];

export default AuthenticationRoutes;
