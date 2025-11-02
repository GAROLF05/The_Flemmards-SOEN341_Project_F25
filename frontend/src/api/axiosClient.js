// src/api/axiosClient.js
import axios from "axios";

// Use /api since Vite proxy is configured to forward to backend
// If VITE_API_BASE_URL is set, use it; otherwise default to '/api' for proxy
const axiosClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
    headers: {
        "Content-Type": "application/json",
    },
});

// Attach API key to all requests
axiosClient.interceptors.request.use(config => {
    const apiKey = import.meta.env.VITE_API_KEY;
    if (apiKey) {
        config.headers["x-api-key"] = apiKey;
    }

    const token = localStorage.getItem("auth-token");

    if (token)
        config.headers.Authorization = `Bearer ${token}`;

    return config;
}, (error) => Promise.reject(error));

// Handle responses
axiosClient.interceptors.response.use(response =>
    response.data, error => {
        // Preserve error structure for error handling
        return Promise.reject(error);
    }
);

export default axiosClient;
