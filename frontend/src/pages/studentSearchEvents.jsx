import { useEffect, useState } from "react";
import { searchEvents } from "../../api/eventApi";
import Button from "../../components/button/Button";
import Select from "../../components/select/Select";
import TextField from "../../components/textField/TextField";
import { useNotification } from "../../hooks/useNotification";

export default function SearchEvents() {
  const { showNotification } = useNotification();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [page, setPage] = useState(1);

  useEffect(() => {
    (async () => {
      try {
        const res = await searchEvents({ q: query, category, page });
        setEvents(res.items || []);
      } catch (e) {
        showNotification("Failed to load events", "error");
      } finally {
        setLoading(false);
      }
    })();
  }, [query, category, page]);

  if (loading) return <div className="p-6">Loading events...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Search Events</h1>

      <div className="flex gap-2 mb-4">
        <TextField
          id="q"
          name="q"
          placeholder="Search by name..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Select
          label="Category"
          value={category}
          onChange={(v) => setCategory(v)}
          options={[
            { value: "All", label: "All" },
            { value: "Music", label: "Music" },
            { value: "Sports", label: "Sports" },
            { value: "Technology", label: "Technology" },
          ]}
        />
        <Button variant="outlined" onClick={() => {
          setQuery("");
          setCategory("All");
          setPage(1);
        }}>Clear Filters</Button>
      </div>

      {events.length === 0 && (
        <div className="text-center opacity-70">No results found.</div>
      )}

      <div className="grid gap-4">
        {events.map(e => (
          <div key={e._id} className="p-4 border rounded-lg">
            <h2 className="font-bold">{e.title}</h2>
            <p>{e.location}</p>
            <p>{new Date(e.start_at).toLocaleString()}</p>
          </div>
        ))}
      </div>

      <div className="flex justify-center gap-3 mt-6">
        <Button variant="outlined" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
        <Button variant="outlined" onClick={() => setPage(p => p + 1)}>Next</Button>
      </div>
    </div>
  );
}
