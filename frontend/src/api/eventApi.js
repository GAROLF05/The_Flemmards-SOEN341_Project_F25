import api from "./axiosClient";
import endpoints from "./endpoints";

export const getEvents = () => api.get(endpoints.events);
export const getEventById = (id) => api.get(endpoints.event(id));
export const createEvent = (payload) => api.post(endpoints.events, payload);
