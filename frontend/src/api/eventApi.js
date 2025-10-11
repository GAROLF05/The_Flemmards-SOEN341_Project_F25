import api from "./axiosClient";
import ENDPOINTS from "./endpoints";

export const getEvents = () => api.get(ENDPOINTS.EVENTS);
export const getEventById = (id) => api.get(ENDPOINTS.EVENT(id));
export const createEvent = (payload) => api.post(ENDPOINTS.EVENTS, payload);
