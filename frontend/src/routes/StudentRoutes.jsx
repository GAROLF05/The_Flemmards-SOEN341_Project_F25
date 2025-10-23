import { Navigate } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import HomePage from "../pages/student/HomePage";
import CalendarPage from "../pages/student/CalendarPage";
import SearchEvents from "../pages/student/SearchEvents";

const StudentRoutes = [

    {
        path: '/student',
        element: <MainLayout accountType="student" />,
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
  element: <SearchEvents />
}

        ]
    }
];

export default StudentRoutes;
