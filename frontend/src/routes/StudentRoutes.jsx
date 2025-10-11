import { Navigate } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import HomePage from "../pages/student/HomePage";
import CalendarPage from "../pages/student/CalendarPage";

const StudentRoutes = [
    {
        path: '/student',
        element: <MainLayout />,
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
            },
            {
                path: 'settings',
                element: <div>Settings</div>
            }
        ]
    }
];

export default StudentRoutes;
