import axiosClient from "./axiosClient"
import ENDPOINTS from "./endpoints"

export const getEvents = (data) =>
    axiosClient.post(ENDPOINTS.GETEVENTS, data);
