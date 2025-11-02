import axiosClient from './axiosClient';
import ENDPOINTS from './endpoints';

export const adminApi = {
    // Organization Management
    async getOrganizations() {
        return await axiosClient.get(ENDPOINTS.ORGANIZATIONS_ALL);
    },

    async updateOrganizationStatus(id, status) {
        return await axiosClient.put(ENDPOINTS.ORGANIZATION_STATUS(id), { status });
    },

    async deleteOrganization(id) {
        return await axiosClient.delete(ENDPOINTS.ORGANIZATION_DELETE(id));
    },

    async suspendOrganization(id) {
        return await axiosClient.patch(`/admin/suspend-organization/${id}`);
    },

    async addOrganizationMember(orgId, memberEmail) {
        return await axiosClient.post(ENDPOINTS.ORGANIZATION_ADD_MEMBER(orgId), { email: memberEmail });
    },

    async removeOrganizationMember(orgId, memberId) {
        return await axiosClient.delete(ENDPOINTS.ORGANIZATION_REMOVE_MEMBER(orgId, memberId));
    },

    // Event Moderation
    async getEventsByStatus(status) {
        return await axiosClient.get(ENDPOINTS.EVENTS_BY_STATUS(status));
    },

    async updateEventStatus(id, status, feedback = '') {
        return await axiosClient.put(ENDPOINTS.EVENT_STATUS(id), { status, feedback });
    },

    // Notifications
    async sendNotification(recipientEmail, subject, message) {
        return await axiosClient.post(ENDPOINTS.SEND_NOTIFICATION, {
            recipientEmail,
            subject,
            message
        });
    },

    // Dashboard Stats
    async getDashboardStats() {
        return await axiosClient.get('/admin/dashboard/stats');
    },

    // Organizer Approval
    async approveOrganizer(orgId, rejectionReason = '') {
        return await axiosClient.patch(`/admin/approve-organizer/${orgId}`, {
            status: 'approved',
            rejectionReason: rejectionReason
        });
    },

    async rejectOrganizer(orgId, rejectionReason) {
        return await axiosClient.patch(`/admin/approve-organizer/${orgId}`, {
            status: 'rejected',
            rejectionReason: rejectionReason
        });
    }
};