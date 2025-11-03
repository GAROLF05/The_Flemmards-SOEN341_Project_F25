import api from "./axiosClient";
import axios from "axios";
import ENDPOINTS from "./endpoints";

// Browse events (Public - for students)
export const browseEvents = (filters = {}) => {
    const params = new URLSearchParams();

    if (filters.q) params.append('q', filters.q);
    if (filters.category) params.append('category', filters.category);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.minCapacity) params.append('minCapacity', filters.minCapacity);
    if (filters.maxCapacity) params.append('maxCapacity', filters.maxCapacity);
    if (filters.minDuration) params.append('minDuration', filters.minDuration);
    if (filters.maxDuration) params.append('maxDuration', filters.maxDuration);
    if (filters.page) params.append('page', filters.page);
    if (filters.limit) params.append('limit', filters.limit);
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

    const queryString = params.toString();
    return api.get(`${ENDPOINTS.EVENTS_BROWSE}${queryString ? '?' + queryString : ''}`);
};

// Get all events (Admin only)
export const getAllEvents = () => api.get(ENDPOINTS.EVENTS_ALL);

// Get event by ID (Admin only)
export const getEventById = (id) => api.get(ENDPOINTS.EVENT_BY_ID(id));

// Get events by organization
export const getEventsByOrganization = (orgId) => api.get(ENDPOINTS.EVENTS_BY_ORG(orgId));

// Get events by status
export const getEventsByStatus = (status) => api.get(ENDPOINTS.EVENTS_BY_STATUS(status));

// Get events by category
export const getEventsByCategory = (category) => api.get(ENDPOINTS.EVENTS_BY_CATEGORY(category));

// Get events by date range
export const getEventsByDateRange = (start, end) =>
    api.get(ENDPOINTS.EVENTS_BY_DATERANGE, { params: { start, end } });

// Get events by user registrations
export const getEventsByUser = (userId) => api.get(ENDPOINTS.EVENTS_BY_USER(userId));

// Create event (Admin only, supports multipart/form-data for image upload)
export const createEvent = (eventData, imageFile = null) => {
    console.log('Creating event:', eventData.title);
    if (imageFile || (eventData.location && typeof eventData.location === 'object')) {
        // Use FormData for file upload or when location is an object
        const formData = new FormData();
        Object.keys(eventData).forEach(key => {
            if (key === 'category') {
                formData.append('category', eventData[key].toLowerCase());
            }
            else if (key === 'location' && typeof eventData[key] === 'object') {
                // Backend expects location[name] and location[address] form fields
                formData.append('location[name]', eventData[key].name || '');
                formData.append('location[address]', eventData[key].address || '');
            } else {
                formData.append(key, eventData[key]);
            }
        });
        formData.append('image', imageFile);

        if (imageFile) {
            formData.append('image', imageFile);
        }

        return api.post(ENDPOINTS.EVENT_CREATE, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    } else {
        // Regular JSON request
        return api.post(ENDPOINTS.EVENT_CREATE, eventData);
    }
};

// Update event (Admin only, supports multipart/form-data for image upload)
export const updateEvent = (eventId, eventData, imageFile = null) => {
    console.log('Updating event:', eventId);
    if (imageFile) {
        // Use FormData for file upload
        const formData = new FormData();
        Object.keys(eventData).forEach(key => {
            if (key === 'location' && typeof eventData[key] === 'object') {
                formData.append(key, JSON.stringify(eventData[key]));
            } else {
                formData.append(key, eventData[key]);
            }
        });
        formData.append('image', imageFile);

        return api.put(ENDPOINTS.EVENT_UPDATE(eventId), formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    } else {
        // Regular JSON request
        return api.put(ENDPOINTS.EVENT_UPDATE(eventId), eventData);
    }
};

// Cancel event (Admin only)
export const cancelEvent = (eventId) => {
    console.log('Cancelling event:', eventId);
    return api.patch(ENDPOINTS.EVENT_CANCEL(eventId));
};

// Delete event (Admin only)
export const deleteEvent = (eventId) => {
    console.log('Deleting event:', eventId);
    return api.delete(ENDPOINTS.EVENT_DELETE(eventId));
};

// Get attendees for event (Admin only)
export const getEventAttendees = (eventId) => api.get(ENDPOINTS.EVENT_ATTENDEES(eventId));

// Export attendees as CSV (Admin or Organizer)
export const exportAttendeesCSV = async (eventId) => {
    console.log('Exporting attendees CSV for event:', eventId);

    // Validate eventId
    if (!eventId) {
        throw new Error('Event ID is required');
    }

    // Use axios directly to bypass interceptor that returns only response.data
    // We need full response with headers for blob downloads
    const token = localStorage.getItem("auth-token");
    const baseURL = import.meta.env.VITE_API_BASE_URL || '/api';

    try {
        const response = await axios.get(`${baseURL}/events/export-csv/${eventId}`, {
            responseType: 'blob',
            headers: {
                'Authorization': token ? `Bearer ${token}` : '',
            },
            validateStatus: (status) => status < 500, // Don't throw on 4xx errors
        });

        // Check if response is an error blob (backend returns JSON error as blob)
        if (response.status >= 400) {
            const text = await response.data.text();
            let errorMessage = 'Failed to export attendees';
            try {
                const errorData = JSON.parse(text);
                errorMessage = errorData.error || errorData.message || errorMessage;
            } catch {
                errorMessage = text || errorMessage;
            }
            throw new Error(errorMessage);
        }

        return response;
    } catch (error) {
        console.error('Error exporting attendees CSV:', error);
        if (error.response?.status === 404) {
            throw new Error('Event not found or no attendees available');
        } else if (error.response?.status === 403) {
            throw new Error('You do not have permission to export attendees for this event');
        } else if (error.response?.status === 401) {
            throw new Error('Authentication required. Please log in again.');
        } else if (error.message) {
            throw error;
        } else {
            throw new Error('Failed to export attendees. Please try again.');
        }
    }
};

// Get waitlist for event (Admin only)
export const getEventWaitlist = (eventId) => api.get(ENDPOINTS.EVENT_WAITLIST(eventId));

// Promote waitlisted users (Admin only)
export const promoteWaitlistedUsers = (eventId) => api.patch(ENDPOINTS.EVENT_PROMOTE_WAITLIST(eventId));

// Legacy functions for backward compatibility
export const getEvents = getAllEvents;

export const registerToEvent = (eventId, quantity = 1) => api.post(ENDPOINTS.EVENT_REGISTRATION, { eventId, quantity });

export const getPendingApprovalEvents = () => api.get(ENDPOINTS.EVENT_MODERATION_STATUS('pending_approval'));

export const approveEvent = (eventId) => api.patch(ENDPOINTS.EVENT_APPROVE(eventId));

export const rejectEvent = (eventId) => api.patch(ENDPOINTS.EVENT_REJECT(eventId));
