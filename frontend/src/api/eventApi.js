import api from "./axiosClient";
import ENDPOINTS from "./endpoints";

export const getEvents = () => api.get(ENDPOINTS.EVENTS);
export const getEventById = (id) => api.get(ENDPOINTS.EVENT(id));
export const createEvent = (payload) => api.post(ENDPOINTS.EVENTS, payload);


const BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";


async function request(path, { method = "GET", body, headers } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(headers || {}),
    },
    credentials: "include", // keep session cookies if your backend uses them
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : {}; } catch { data = { message: text }; }

  if (!res.ok) {
    const msg = data?.message || `HTTP ${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

const get  = (path) => request(path);
const post = (path, body) => request(path, { method: "POST", body });


const mockList = [
  { _id: "1", title: "Tech Fair",       start_at: "2025-10-20T10:00:00Z", location: "Hall Building" },
  { _id: "2", title: "Music Night",     start_at: "2025-10-25T19:00:00Z", location: "Loyola Campus" },
  { _id: "3", title: "React Meetup",    start_at: "2025-11-03T18:00:00Z", location: "Downtown" },
  { _id: "4", title: "Career Expo",     start_at: "2025-11-08T10:00:00Z", location: "Conference Hall" },
  { _id: "5", title: "AI & Society",    start_at: "2025-11-12T18:30:00Z", location: "Leacock 132" },
];

function mockSearch({ q = "", category = "All", page = 1, perPage = 2 }) {
  const filtered = mockList.filter((e) =>
    e.title.toLowerCase().includes(q.toLowerCase())
  );
  const start = (page - 1) * perPage;
  const items = filtered.slice(start, start + perPage);
  return { items, total: filtered.length, perPage };
}


export async function searchEvents({ q = "", category = "All", page = 1 }) {
  const params = new URLSearchParams({
    q,
    category: category === "All" ? "" : category,
    page: String(page),
  });

  try {
    return await get(`/events/search?${params.toString()}`);
  } catch (err) {
    // fallback so your UI still renders without backend
    console.warn("[searchEvents] backend not reachable, using mock. Reason:", err.message);
    return mockSearch({ q, category, page, perPage: 2 });
  }
}

/**
 * Fetch a simple list of events (for home page). Optional query.
 * Expected backend: GET /events?q=
 */
export async function fetchEvents(q = "") {
  const params = q ? `?q=${encodeURIComponent(q)}` : "";
  try {
    return await get(`/events${params}`); // expect an array: [{ event_id, title, ... }]
  } catch (err) {
    console.warn("[fetchEvents] using mock list due to:", err.message);
    // Map mock to the student home shape (event_id, etc.)
    return mockList.map((m, i) => ({
      event_id: i + 1,
      title: m.title,
      description: "Mock description for development.",
      start_at: m.start_at,
      end_at: m.start_at,
      location: m.location,
    }));
  }
}

/**
 * Register current user for an event.
 * Expected backend: POST /events/:id/register -> { registration_id, status }
 */
export async function registerForEvent(eventId) {
  try {
    // Real call:
    // return await post(`/events/${eventId}/register`);
    // Dev fallback:
    await new Promise((r) => setTimeout(r, 700));
    return { registration_id: Math.floor(Math.random() * 100000), status: "registered" };
  } catch (err) {
    // If you want: rethrow to display error toast
    throw err;
  }
}

/**
 * Get current user's registrations (for "My Events").
 * Expected backend: GET /registrations/my -> [{ registration_id, status, event: {...}}]
 */
export async function getMyRegistrations() {
  try {
    return await get(`/registrations/my`);
  } catch (err) {
    console.warn("[getMyRegistrations] mock due to:", err.message);
    // Simple mock
    return [
      {
        registration_id: 1,
        status: "registered",
        event: {
          event_id: 101,
          title: "Welcome Party",
          start_at: "2025-10-20T18:00:00Z",
          location: "Hall A",
        },
      },
    ];
  }
}

/**
 * Download an .ics file for a registration (Save to Calendar).
 * Expected backend: GET /registrations/:id/ics -> file
 * This returns a Blob URL you can assign to <a href=... download>.
 */
export async function getIcsDownloadUrl(registrationId) {
  try {
    const res = await fetch(`${BASE}/registrations/${registrationId}/ics`, {
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to generate calendar file");
    const blob = await res.blob();
    return URL.createObjectURL(blob);
  } catch (err) {
    // Dev fallback: build a tiny ICS on the client
    console.warn("[getIcsDownloadUrl] using client-side ICS due to:", err.message);
    const ics =
      "BEGIN:VCALENDAR\r\n" +
      "VERSION:2.0\r\n" +
      "PRODID:-//Flemmards//EN\r\n" +
      "BEGIN:VEVENT\r\n" +
      `UID:${registrationId}@flemmards\r\n` +
      "DTSTAMP:20250101T000000Z\r\n" +
      "DTSTART:20250101T180000Z\r\n" +
      "DTEND:20250101T200000Z\r\n" +
      "SUMMARY:Mock Event\r\n" +
      "LOCATION:Campus\r\n" +
      "END:VEVENT\r\n" +
      "END:VCALENDAR\r\n";
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    return URL.createObjectURL(blob);
  }
}

/**
 * Fetch a single event by id (useful for a details page / confirmation modal).
 * Expected backend: GET /events/:id
 */
export async function getEventById(id) {
  try {
    return await get(`/events/${id}`);
  } catch (err) {
    // simple mock
    const m = mockList.find((e) => e._id === String(id)) || mockList[0];
    return {
      event_id: Number(id) || 1,
      title: m.title,
      description: "Mock single event (backend not running).",
      start_at: m.start_at,
      end_at: m.start_at,
      location: m.location,
    };
  }
}
