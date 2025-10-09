import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getEventById } from "../api/eventApi";
import { bookTicket } from "../api/registrationApi";
import { getTicket } from "../api/ticketApi";

export default function EventDetail() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [qr, setQr] = useState(null);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await getEventById(id);
        setEvent(res.data);
      } catch {
        setEvent({ event_id: id, title:"Sample Event", description:"Demo fallback",
          start_at:"2025-10-20T10:00:00Z", end_at:"2025-10-20T12:00:00Z", location:"Hall Building" });
      }
    })();
  }, [id]);

  const onBook = async () => {
    setMsg("Booking…");
    try {
      const { data } = await bookTicket(event.event_id);
      const t = await getTicket(data.registration_id);
      setQr(t.data.qrDataURL || null);
      setMsg("Ticket booked! QR below.");
    } catch {
      setMsg("Booking failed (ask backend if route is ready).");
    }
  };

  if (!event) return <div className="p-6">Loading…</div>;

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">{event.title}</h1>
      <div className="opacity-80 text-sm">
        {new Date(event.start_at).toLocaleString()} — {event.location}
      </div>
      <p>{event.description}</p>

      <div className="flex gap-3">
        <button onClick={onBook} className="px-4 py-2 rounded-xl bg-black text-white">Book Ticket</button>
        <button onClick={() => downloadICS(event)} className="px-4 py-2 rounded-xl border">Save to Calendar (.ics)</button>
      </div>

      {msg && <div className="text-sm mt-2">{msg}</div>}
      {qr && <img src={qr} alt="QR" className="w-48 h-48 border rounded-xl" />}
    </div>
  );
}

function downloadICS(e) {
  const fmt = (iso) => iso.replace(/[-:]/g,"").replace(/\.\d+Z?$/,"Z");
  const ics = [
    "BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//Campus Events//EN",
    "BEGIN:VEVENT",
    `UID:${e.event_id}@campus`,
    `DTSTAMP:${fmt(new Date().toISOString())}`,
    `DTSTART:${fmt(e.start_at)}`,
    `DTEND:${fmt(e.end_at)}`,
    `SUMMARY:${e.title}`,
    `LOCATION:${e.location}`,
    `DESCRIPTION:${(e.description||"").replace(/\n/g," ")}`,
    "END:VEVENT","END:VCALENDAR",
  ].join("\r\n");
  const blob = new Blob([ics], { type:"text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = `${e.title}.ics`; a.click();
  URL.revokeObjectURL(url);
}
