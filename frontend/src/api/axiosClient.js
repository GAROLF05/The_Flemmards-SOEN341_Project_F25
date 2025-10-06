// src/api/axiosClient.js
import axios from "axios";

const axiosClient = axios.create({
    baseURL: import.meta.env.REACT_APP_API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

// Attach API key to all requests
axiosClient.interceptors.request.use(config => {
    const apiKey = import.meta.env.REACT_APP_API_KEY;
    config.headers["x-api-key"] = apiKey;

    const token = localStorage.getItem("token");

    if (token)
        config.headers.Authorization = `Bearer ${token}`;

    return config;
}, (error) => Promise.reject(error));

// Handle responses
axiosClient.interceptors.response.use(response =>
    response.data, error => {
        console.error("API Error:", error);

        return Promise.reject(error);
    }
);

export default axiosClient;
