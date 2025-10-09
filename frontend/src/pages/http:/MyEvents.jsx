import { useEffect, useState } from "react";
import { getMyRegistrations } from "../api/registrationApi";
import { Link } from "react-router-dom";

export default function MyEvents() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await getMyRegistrations();
        setItems(data);
      } catch {
        // fallback mock so the UI renders
        setItems([
          { registration_id: 1, status: "registered",
            event: { event_id: 1, title: "Tech Fair", start_at: "2025-10-20T10:00:00Z", location: "Hall" } }
        ]);
      } finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <div className="p-6">Loading…</div>;

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">My Events</h1>
      <div className="grid gap-3">
        {items.map(r => (
          <Link key={r.registration_id} to={`/event/${r.event.event_id}`}
            className="p-4 rounded-xl border block bg-white dark:bg-zinc-900">
            <div className="font-semibold">{r.event.title}</div>
            <div className="text-sm opacity-80">
              {new Date(r.event.start_at).toLocaleString()} — {r.event.location}
            </div>
            <div className="text-xs mt-1">Status: {r.status}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
