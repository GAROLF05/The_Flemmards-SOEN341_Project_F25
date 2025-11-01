import { Navigate } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import HomePage from "../pages/student/HomePage";
import CalendarPage from "../pages/student/CalendarPage";
import ProtectedRoutes from "./ProtectedRoutes";

const StudentRoutes = [
    {
        path: '/student',
        element: (
            <ProtectedRoutes>
                <MainLayout accountType="student" />
            </ProtectedRoutes>
        ),
        children: [
            {
                path: '',
                element: <HomePage />
            },
            {
                path: 'home',
                element: <Navigate to="/student" />
            },
            {
                path: 'calendar',
                element: <CalendarPage />
            },
            {
                path: 'events',
                element: <div>Events</div>
            }
        ]
    }
];

export default StudentRoutes;
