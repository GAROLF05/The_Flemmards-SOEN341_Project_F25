import axiosClient from "./axiosClient";
import ENDPOINTS from "./endpoints";

export const login = (data) => axiosClient.post(ENDPOINTS.LOGIN, data);

export const signup = (data) => axiosClient.post(ENDPOINTS.SIGNUP, data);

export const forgotPassword = (data) =>
  axiosClient.post(ENDPOINTS.FORGOT_PASSWORD, data);

export const resetPassword = (data) =>
  axiosClient.post(ENDPOINTS.RESET_PASSWORD, data);

export const logout = () => axiosClient.post(ENDPOINTS.LOGOUT);

export const getUserProfile = () => axiosClient.get(ENDPOINTS.USER_PROFILE);
