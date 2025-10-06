import axiosClient from "./axiosClient"
import ENDPOINTS from "./endpoints"

export const login = (data) =>
    axiosClient.post(ENDPOINTS.LOGIN, data);

export const signup = (data) =>
    axiosClient.post(ENDPOINTS.SIGNUP, data);

export const logout = () =>
    axiosClient.post(ENDPOINTS.LOGOUT);
