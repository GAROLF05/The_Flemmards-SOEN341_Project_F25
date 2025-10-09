// src/api/axiosClient.js
import axios from "axios";

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,   // <-- Vite env variable
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach API key + token to all requests
axiosClient.interceptors.request.use(
  (config) => {
    const apiKey = import.meta.env.VITE_API_KEY;  // <-- Vite env variable
    if (apiKey) config.headers["x-api-key"] = apiKey;

    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;

    return config;
  },
  (error) => Promise.reject(error)
);

// Handle responses
axiosClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error("API Error:", error);
    return Promise.reject(error);
  }
);

export default axiosClient;
