import api from "./axiosClient";
import ENDPOINTS from "./endpoints";

export const bookTicket = (eventId) => {
  console.log('Registering for event:', eventId);
  return api.post(ENDPOINTS.REGISTRATION, { event_id: eventId });
};

export const getMyRegistrations = () => api.get(ENDPOINTS.MYREGISTRATIONS);
