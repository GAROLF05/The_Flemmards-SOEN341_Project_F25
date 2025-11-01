import { useEffect, useState } from "react";
// import { getMyRegistrations } from "../api/registrationApi"; 
import { Link } from "react-router-dom";

export default function MyEvents() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    // Temporary mock until backend works
    setItems([
      { registration_id: 1, status: "registered",
        event: { event_id: 101, title: "Welcome Party", start_at: "2025-10-20T18:00:00Z", location: "Hall A" }
      }
    ]);
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">My Events</h1>
      {items.map(r => (
        <Link key={r.registration_id} to={`/event/${r.event.event_id}`}
          className="block p-4 border rounded-xl mb-2">
          <div className="font-semibold">{r.event.title}</div>
          <div className="text-sm">{new Date(r.event.start_at).toLocaleString()} – {r.event.location}</div>
          <div className="text-xs">Status: {r.status}</div>
        </Link>
      ))}
    </div>
  );
}
