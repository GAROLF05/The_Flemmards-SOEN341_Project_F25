import { useRoutes } from 'react-router-dom';
import AuthenticationRoutes from './AuthenticationRoutes';
import HomeRoutes from './HomeRoutes';
import PageNotFoundRoutes from './PageNotFoundRoutes';
import StudentRoutes from './StudentRoutes';
import OrganizerRoutes from './OrganizerRoutes';
import AdminRoutes from './AdminRoutes';

const routes = [
    ...HomeRoutes,
    ...AuthenticationRoutes,
    ...PageNotFoundRoutes,
    ...StudentRoutes,
    ...OrganizerRoutes,
    ...AdminRoutes
];

const AppRoutes = () => {
    const element = useRoutes(routes);

    return element;
};

export default AppRoutes;
