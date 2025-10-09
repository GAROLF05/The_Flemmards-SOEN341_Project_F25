import { Link, Outlet } from "react-router-dom";

export default function AppLayout() {
  return (
    <div>
      <nav className="p-4 border-b flex gap-4">
        <Link to="/">Home</Link>
        <Link to="/me/events">My Events</Link>
        <Link to="/organizer/create">Organizer: Create</Link>
        <Link to="/auth" className="ml-auto">Login</Link>
      </nav>
      <Outlet />
    </div>
  );
}
