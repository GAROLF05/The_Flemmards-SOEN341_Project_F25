import api from "./axiosClient";
import endpoints from "./endpoints";

export const getTicket = (registrationId) =>
  api.get(endpoints.tickets(registrationId));
