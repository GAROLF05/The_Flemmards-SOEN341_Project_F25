const ENDPOINTS = {
	// Admin & Organization Management
	ORGANIZATIONS_ALL: "/organizations/all",
	ORGANIZATION_STATUS: (id) => `/organizations/${id}/status`,
	ORGANIZATION_DELETE: (id) => `/organizations/${id}`,
	ORGANIZATION_ADD_MEMBER: (orgId) => `/organizations/${orgId}/members`,
	ORGANIZATION_REMOVE_MEMBER: (orgId, memberId) => `/organizations/${orgId}/members/${memberId}`,
	EVENT_STATUS: (id) => `/events/${id}/status`,
	SEND_NOTIFICATION: "/notifications/send",
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

	// Legacy/Simplified endpoints for compatibility
	EVENTS: "/events/get/all",
	EVENT: (id) => `/events/get/${id}`,

	// Registrations
	EVENT_REGISTRATION: "/registrations/register",

	// Tickets
	TICKETS: (registrationId) => `/tickets/${registrationId}`,
};

export default ENDPOINTS;
