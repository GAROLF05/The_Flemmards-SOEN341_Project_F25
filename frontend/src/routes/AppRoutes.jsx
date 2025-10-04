import { useRoutes } from 'react-router-dom';
import AuthenticationRoutes from './AuthenticationRoutes';
import NotFoundRoutes from './NotFoundRoutes';
import HomeRoutes from './HomeRoutes';

const routes = [
    ...HomeRoutes,
    ...AuthenticationRoutes,
    ...NotFoundRoutes,
];

const AppRoutes = () => {
    const element = useRoutes(routes);

    return element;
};

export default AppRoutes;
