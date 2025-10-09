const endpoints = {
  events: "/events",
  event: (id) => `/events/${id}`,
  registrations: "/registrations",
  myRegistrations: "/registrations/me",
  tickets: (registrationId) => `/tickets/${registrationId}`,
};

export default endpoints;
