import axiosClient from "./axiosClient"
import ENDPOINTS from "./endpoints"

// // Admin & Organization Management
// 	ORGANIZATION_CREATE: "/org/create",
// 	ORGANIZATIONS_ALL: "/org/all",
// 	ORGANIZATION_BY_ID: (id) => `/org/${id}`,
// 	ORGANIZATION_STATUS: (status) => `/org/status/${status}`,
// 	ORGANIZATION_PENDING_LIST: "/org/pending/list",
// 	ORGANIZATION_STATS: (id) => `/org/stats/${id}`,
// 	ORGANIZATION_UPDATE: (id) => `/org/update/${id}`,
// 	ORGANIZATION_DELETE: (id) => `/org/delete/${id}`,

export const createOrganization = (organization) => axiosClient.post(ENDPOINTS.ORGANIZATION_CREATE, organization);

// Admin endpoint to create organization (bypasses organizer requirement)
export const adminCreateOrganization = (organization) => axiosClient.post(ENDPOINTS.ORGANIZATION_ADMIN_CREATE, organization);

export const getOrganizations = () => 
    axiosClient.get(ENDPOINTS.ORGANIZATIONS_ALL);

// Alias for consistency
export const getAllOrganizations = getOrganizations;

export const getOrganizationById = (id) => 
    axiosClient.get(ENDPOINTS.ORGANIZATION_BY_ID(id));

export const getOrganizationByStatus = (status) => 
    axiosClient.get(ENDPOINTS.ORGANIZATION_STATUS(status));

export const getPendingOrganizations = () => 
    axiosClient.get(ENDPOINTS.ORGANIZATION_PENDING_LIST);

export const getOrganizationStats = (id) => 
    axiosClient.get(ENDPOINTS.ORGANIZATION_STATS(id));

export const updateOrganization = (id, organization) => 
    axiosClient.put(ENDPOINTS.ORGANIZATION_UPDATE(id), organization);

export const deleteOrganization = (id) => 
    axiosClient.delete(ENDPOINTS.ORGANIZATION_DELETE(id));