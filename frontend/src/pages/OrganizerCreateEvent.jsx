import { useState } from "react";
import { createEvent } from "../api/eventApi";

export default function OrganizerCreateEvent() {
  const [form, setForm] = useState({ title:"", description:"", start_at:"", end_at:"", location:"", capacity: "" });
  const [msg, setMsg] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    try {
      await createEvent({ ...form, capacity: form.capacity ? Number(form.capacity) : null });
      setMsg("Event created!");
      setForm({ title:"", description:"", start_at:"", end_at:"", location:"", capacity:"" });
    } catch { setMsg("Create failed (check backend route)."); }
  };

  const on = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <form onSubmit={submit} className="max-w-xl mx-auto p-6 space-y-3">
      <h1 className="text-2xl font-bold">Create Event</h1>
      {["title","description","start_at","end_at","location","capacity"].map(k=>(
        <input key={k} value={form[k]} onChange={on(k)} placeholder={k}
               className="w-full border rounded-lg px-3 py-2" required={k!=="capacity"} />
      ))}
      <button className="px-4 py-2 rounded-xl bg-black text-white">Create</button>
      {msg && <div className="text-sm mt-2">{msg}</div>}
    </form>
  );
}

