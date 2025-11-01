import axiosClient from './axiosClient';
import { ENDPOINTS } from './endpoints';

export const adminApi = {
    // Organization Management
    async getOrganizations() {
        const response = await axiosClient.get(ENDPOINTS.ORGANIZATIONS_ALL);
        return response.data;
    },

    async updateOrganizationStatus(id, status) {
        const response = await axiosClient.put(ENDPOINTS.ORGANIZATION_STATUS(id), { status });
        return response.data;
    },

    async deleteOrganization(id) {
        const response = await axiosClient.delete(ENDPOINTS.ORGANIZATION_DELETE(id));
        return response.data;
    },

    async addOrganizationMember(orgId, memberEmail) {
        const response = await axiosClient.post(ENDPOINTS.ORGANIZATION_ADD_MEMBER(orgId), { email: memberEmail });
        return response.data;
    },

    async removeOrganizationMember(orgId, memberId) {
        const response = await axiosClient.delete(ENDPOINTS.ORGANIZATION_REMOVE_MEMBER(orgId, memberId));
        return response.data;
    },

    // Event Moderation
    async getEventsByStatus(status) {
        const response = await axiosClient.get(ENDPOINTS.EVENTS_BY_STATUS(status));
        return response.data;
    },

    async updateEventStatus(id, status, feedback = '') {
        const response = await axiosClient.put(ENDPOINTS.EVENT_STATUS(id), { status, feedback });
        return response.data;
    },

    // Notifications
    async sendNotification(recipientEmail, subject, message) {
        const response = await axiosClient.post(ENDPOINTS.SEND_NOTIFICATION, {
            recipientEmail,
            subject,
            message
        });
        return response.data;
    }
};