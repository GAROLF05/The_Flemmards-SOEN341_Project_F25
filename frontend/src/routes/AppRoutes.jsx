import { useRoutes } from 'react-router-dom';
import AuthenticationRoutes from './AuthenticationRoutes';
import HomeRoutes from './HomeRoutes';
import PageNotFoundRoutes from './PageNotFoundRoutes';

const routes = [
    ...HomeRoutes,
    ...AuthenticationRoutes,
    ...PageNotFoundRoutes,
];

const AppRoutes = () => {
    const element = useRoutes(routes);

    return element;
};

export default AppRoutes;
