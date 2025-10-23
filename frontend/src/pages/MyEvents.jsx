import { useEffect, useState } from "react";
import { getMyRegistrations } from "../api/registrationApi"; 
import { Link } from "react-router-dom";
import { getIcsDownloadUrl } from "../api/eventApi";
import QRCode from "react-qr-code";
export function getIcsDownloadUrl(eventId) {
  return `http://localhost:3000/api/events/${eventId}/ics`;
}

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
<a
  href={getIcsDownloadUrl(r.event.event_id)}
  className="inline-block mt-2 px-3 py-1 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
>
  Save to Calendar
</a>

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
  
  <div className="text-xs">Status: {r.status}</div>

{/* Save to Calendar (.ics) */}
<a
  href={getIcsDownloadUrl(r.event.event_id)}
  className="inline-block mt-2 px-3 py-1 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
>
  Save to Calendar
</a>


}
