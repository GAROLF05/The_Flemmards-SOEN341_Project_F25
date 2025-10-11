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

      {/* Student flow */}
      <Route path="/" element={<StudentHome />} />
      <Route path="/event/:id" element={<EventDetail />} />
      <Route path="/me/events" element={<MyEvents />} />

      {/* Organizer progress */}
      <Route path="/organizer/create" element={<OrganizerCreateEvent />} />

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
}
