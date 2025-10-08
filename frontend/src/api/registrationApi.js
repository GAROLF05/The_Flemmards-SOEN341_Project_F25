import api from "./axiosClient";
import endpoints from "./endpoints";

export const bookTicket = (eventId) =>
  api.post(endpoints.registrations, { event_id: eventId });

export const getMyRegistrations = () => api.get(endpoints.myRegistrations);
