import { useRoutes } from 'react-router-dom';
import AuthenticationRoutes from './AuthenticationRoutes';
import HomeRoutes from './HomeRoutes';
import PageNotFoundRoutes from './PageNotFoundRoutes';
import StudentRoutes from './StudentRoutes';
import OrganizerRoutes from './OrganizerRoutes';
import AdminRoutes from './AdminRoutes';

/**
 * Combines all route configurations from different files into a single array.
 * The order of routes is important. `react-router-dom` picks the first match it finds.
 */
const routes = [
    ...HomeRoutes,
    ...AuthenticationRoutes,
    ...StudentRoutes,
    ...OrganizerRoutes,
    ...AdminRoutes,
    ...PageNotFoundRoutes
];

/**
 * The main routing component for the application.
 * It uses the `useRoutes` hook from `react-router-dom` to render the appropriate
 * component tree based on the current URL and the defined routes.
 */
const AppRoutes = () => {
    const element = useRoutes(routes);

    return element;
};

export default AppRoutes;
