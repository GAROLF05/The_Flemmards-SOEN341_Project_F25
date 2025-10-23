import QRCode from "react-qr-code";
import { useEffect, useState } from "react";
import { searchEvents } from "../../api/eventApi";
import Button from "../../components/button/Button";
import Select from "../../components/select/Select";
import TextField from "../../components/textField/TextField";
import { useNotification } from "../../hooks/useNotification";
import SimpleModal from "../../components/modal/SimpleModal";
import { registerForEvent } from "../../api/eventApi";
import Button from "../../components/button/Button"; // you already use it

export default function SearchEvents() {
  
  const { showNotification } = useNotification();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [perPage, setPerPage] = useState(2);
 // track which card is registering (by event id) so we can disable that button only
 const [registeringId, setRegisteringId] = useState(null);
const [confirmOpen, setConfirmOpen] = useState(false);
const [confirmData, setConfirmData] = useState(null); // {title, when, location, registration_id}

  async function handleRegister(eventId) {
    try {
      setRegisteringId(eventId);
      showNotification("Registering…", "info");
      const res = await registerForEvent(eventId);
      showNotification(`Success! Registration #${res.registration_id}`, "success");
    } catch (err) {
      showNotification(err?.message || "Could not register. Please try again.", "error");
    } finally {
      setRegisteringId(null);
    }
  }
  async function handleRegister(evt) {
  try {
    setRegisteringId(evt._id);
    showNotification("Registering…", "info", 1200);
    const res = await registerForEvent(evt._id);
    // build confirmation payload
    setConfirmData({
      title: evt.title,
      when: new Date(evt.start_at).toLocaleString(),
      location: evt.location,
      registration_id: res.registration_id || "TEMP-12345"
    });
    setConfirmOpen(true);
    showNotification("Success! Ticket reserved.", "success");
  } catch (e) {
    showNotification("Could not register. Please try again.", "error");
  } finally {
    setRegisteringId(null);
  }
}

{events.map(e => (
  <div key={e._id} className="p-4 border rounded-lg bg-white dark:bg-zinc-900">
    <h2 className="font-bold">{e.title}</h2>
    <div className="text-sm opacity-80">
      {new Date(e.start_at).toLocaleString()} — {e.location}
    </div>

    {/* 👉 Add this button */}
    <Button
      className="mt-3"
      onClick={() => handleRegister(e._id)}
      disabled={registeringId === e._id}
    >
      {registeringId === e._id ? "Registering…" : "Get Ticket"}
    </Button>
  </div>
))}

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await searchEvents({ q: query, category, page });
        if (cancelled) return;
        setEvents(res.items || []);
        setTotal(res.total || 0);
        setPerPage(res.perPage || 2);
      } catch {
        showNotification("Failed to load events", "error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [query, category, page, showNotification]);

  const clearFilters = () => {
    setQuery("");
    setCategory("All");
    setPage(1);
  };

  const totalPages = Math.max(1, Math.ceil(total / perPage));

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Search Events</h1>

      {/* filters (supports Clear Filters) */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <TextField
          id="q"
          name="q"
          placeholder="Search by name…"
          value={query}
          onChange={(e) => { setPage(1); setQuery(e.target.value); }}
          className="flex-1"
        />
        <Select
          label="Category"
          value={category}
          onChange={(v) => { setPage(1); setCategory(v); }}
          options={[
            { value: "All", label: "All" },
            { value: "Music", label: "Music" },
            { value: "Sports", label: "Sports" },
            { value: "Technology", label: "Technology" },
          ]}
          className="w-40"
        />
        <Button variant="outlined" onClick={clearFilters}>Clear Filters</Button>
      </div>

      {loading && <div className="p-6 opacity-80">Loading events…</div>}

      {!loading && events.length === 0 && (
        <div className="p-10 text-center border rounded-xl bg-white dark:bg-zinc-900">
          <div className="text-xl font-semibold mb-2">No results found</div>
          <div className="opacity-70">Try changing your search or clearing filters.</div>
        </div>
      )}
<SimpleModal
  open={confirmOpen}
  onClose={() => setConfirmOpen(false)}
  title="Registration Confirmed"
>
  {confirmData && (
    <div className="space-y-2">
      <div className="font-semibold">{confirmData.title}</div>
      <div className="text-sm opacity-80">
        {new Date(confirmData.when || Date.now()).toLocaleString()} — {confirmData.location}
      </div>

      {/* Registration number */}
      <div className="text-sm">
        Registration #: <span className="font-mono">{confirmData.registration_id}</span>
      </div>

      {/* ✅ QR CODE GOES EXACTLY HERE (below Registration #) */}
      <div className="pt-4 flex justify-center">
        <div className="bg-white p-3 rounded-lg">
          <QRCode value={`REG:${confirmData.registration_id}`} size={128} />
        </div>
      </div>
      {/* ✅ end QR code block */}
    </div>
  )}

  <div className="mt-6 flex justify-end">
    <a
      href="/student/events"
      className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
    >
      Go to My Events
    </a>
  </div>
</SimpleModal>

      <div className="grid gap-4">
        {events.map(e => (
          <div key={e._id} className="p-4 border rounded-lg bg-white dark:bg-zinc-900">
            <h2 className="font-bold">{e.title}</h2>
            <div className="text-sm opacity-80">{new Date(e.start_at).toLocaleString()} — {e.location}</div>
          </div>
        ))}
      </div>

      {/* pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-3 mt-6">
          <Button variant="outlined" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
          <div className="px-3 py-2 rounded border bg-white dark:bg-zinc-900">{page} / {totalPages}</div>
          <Button variant="outlined" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
        </div>
      )}
    </div>
  );
}
