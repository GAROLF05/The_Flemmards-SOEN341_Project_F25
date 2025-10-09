import { Routes, Route } from "react-router-dom";
import Authentication from "../pages/Authentication";
import PageNotFound from "../pages/PageNotFound";
import StudentHome from "../pages/StudentHome";
import EventDetail from "../pages/EventDetail";
import MyEvents from "../pages/MyEvents";   // ⬅️ import your new page

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<StudentHome />} />
      <Route path="/event/:id" element={<EventDetail />} />
      <Route path="/auth" element={<Authentication />} />
      <Route path="/me/events" element={<MyEvents />} />  {/* ⬅️ Add this */}
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
}
