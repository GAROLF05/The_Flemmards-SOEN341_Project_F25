import MainLayout from "../layouts/MainLayout";
import Student from "../pages/student/Student";

const StudentRoutes = [
    {
        path: '/student',
        element: <MainLayout />,
        children: [
            {
                path: '',
                element: <Student />
            }
        ]
    }
];

export default StudentRoutes;
