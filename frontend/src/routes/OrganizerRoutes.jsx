import MainLayout from "../layouts/MainLayout";
import Organizer from "../pages/organizer/Organizer";

const OrganizerRoutes = [
    {
        path: '/organizer',
        element: <MainLayout />,
        children: [
            {
                path: '',
                element: <Organizer />
            }
        ]
    }
];

export default OrganizerRoutes;
