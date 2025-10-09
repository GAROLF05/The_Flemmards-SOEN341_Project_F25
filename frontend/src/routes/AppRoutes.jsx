import { Routes, Route } from "react-router-dom";
import Authentication from "../pages/Authentication";
import PageNotFound from "../pages/PageNotFound";
import StudentHome from "../pages/StudentHome";
import EventDetail from "../pages/EventDetail";
import MyEvents from "../pages/MyEvents";
import OrganizerCreateEvent from "../pages/OrganizerCreateEvent";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/auth" element={<Authentication />} />

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
