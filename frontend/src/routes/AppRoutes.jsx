import { Routes, Route } from "react-router-dom";
import Authentication from "../pages/Authentication";
import PageNotFound from "../pages/PageNotFound";
import StudentHome from "../pages/StudentHome";
import EventDetail from "../pages/EventDetail";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<StudentHome />} />
      <Route path="/event/:id" element={<EventDetail />} />
      <Route path="/auth" element={<Authentication />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
}
