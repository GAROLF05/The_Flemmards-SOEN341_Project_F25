import { Navigate } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import HomePage from "../pages/student/HomePage";
import CalendarPage from "../pages/student/CalendarPage";
import ProtectedRoutes from "./ProtectedRoutes";
import MyEventsPage from "../pages/student/MyEventsPage";

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
                element: <MyEventsPage />
            }
        ]
    }
];

export default StudentRoutes;
