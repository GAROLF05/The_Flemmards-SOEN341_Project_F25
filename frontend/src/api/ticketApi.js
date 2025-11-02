import api from "./axiosClient";
import endpoints from "./endpoints";

export const scanTicket = (ticketNumber) =>
    api.post(endpoints.SCAN_TICKET, { code: ticketNumber });
