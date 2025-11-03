const ENDPOINTS = {
	// Admin & Organization Management
	ORGANIZATION_CREATE: "/org/create",
	ORGANIZATION_ADMIN_CREATE: "/org/admin/create",
	ORGANIZATIONS_ALL: "/org/all",
	ORGANIZATION_BY_ID: (id) => `/org/${id}`,
	ORGANIZATION_STATUS: (status) => `/org/status/${status}`,
	ORGANIZATION_PENDING_LIST: "/org/pending/list",
	ORGANIZATION_STATS: (id) => `/org/stats/${id}`,
	ORGANIZATION_UPDATE: (id) => `/org/update/${id}`,
	ORGANIZATION_DELETE: (id) => `/org/delete/${id}`,

	SEND_NOTIFICATION: "/notifications/send",

	// User Management
	LOGIN: "/users/login",
	SIGNUP: "/users/register",
	LOGOUT: "/users/logout",
	USER_PROFILE: "/users/profile",

	// Events
	EVENTS_BROWSE: "/events/browse", // Public endpoint for students
	EVENTS_ALL: "/events/get/all", // Admin only
	EVENT_BY_ID: (id) => `/events/get/${id}`,
	EVENTS_BY_ORG: (orgId) => `/events/get/by-organization/${orgId}`,
	EVENTS_BY_STATUS: (status) => `/events/get/status/${status}`,
	EVENTS_BY_CATEGORY: (category) => `/events/get/category/${category}`,
	EVENTS_BY_DATERANGE: "/events/get/daterange",
	EVENTS_BY_USER: (userId) => `/events/get/by-user/${userId}`,
	EVENT_CREATE: "/events/create",
	EVENT_UPDATE: (id) => `/events/update/${id}`,
	EVENT_CANCEL: (id) => `/events/cancel/${id}`,
	EVENT_DELETE: (id) => `/events/delete/${id}`,
	EVENT_ATTENDEES: (id) => `/events/get/attendees/${id}`,
	EVENT_WAITLIST: (id) => `/events/get/waitlist/${id}`,
	EVENT_PROMOTE_WAITLIST: (id) => `/events/promote/${id}`,
	EVENT_MODERATION_STATUS: (status) => `/events/moderation/status/${status}`,
	EVENT_APPROVE: (id) => `/admin/events/approve/${id}`,
	EVENT_REJECT: (id) => `/admin/events/reject/${id}`,
	EVENT_FLAG: (id) => `/admin/events/flag/${id}`,

	// Legacy/Simplified endpoints for compatibility
	EVENTS: "/events/get/all",
	EVENT: (id) => `/events/get/${id}`,

	// Registrations
	EVENT_REGISTRATION: "/registrations/register",

	// Tickets
	SCAN_TICKET: "/tickets/ticket/scan",
};

export default ENDPOINTS;
