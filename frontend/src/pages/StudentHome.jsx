import { useEffect, useState } from "react";
import { getEvents } from "../api/eventApi";
import { Link } from "react-router-dom";

export default function StudentHome() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await getEvents();
        setEvents(res.data);
      } catch {
        // temporary mock so UI shows even if backend isn’t ready
        setEvents([
          { event_id: 1, title: "Tech Fair", description: "Showcase", start_at:"2025-10-20T10:00:00Z", end_at:"2025-10-20T18:00:00Z", location:"Hall Building" },
          { event_id: 2, title: "Music Night", description: "Live bands", start_at:"2025-10-25T19:00:00Z", end_at:"2025-10-25T23:00:00Z", location:"Loyola" },
        ]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="p-6">Loading…</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">Upcoming Events</h1>
      <div className="grid gap-4">
        {events.map(e => (
          <Link key={e.event_id} to={`/event/${e.event_id}`} className="block p-4 rounded-xl border hover:shadow bg-white dark:bg-zinc-900">
            <div className="text-lg font-semibold">{e.title}</div>
            <div className="text-sm opacity-80">{new Date(e.start_at).toLocaleString()} — {e.location}</div>
            <p className="mt-2 line-clamp-2">{e.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
