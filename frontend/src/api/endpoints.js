const ENDPOINTS = {
	LOGIN: "/users/login",
	SIGNUP: "/users/register",

	EVENTS: "/events",
	EVENT: (id) => `/events/${id}`,
	REGISTRATION: "/registrations",
	MYREGISTRATIONS: "/registrations/me",
	TICKETS: (registrationId) => `/tickets/${registrationId}`,
};

export default ENDPOINTS;
