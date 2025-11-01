/**
 * Transform backend event format to frontend format
 * Backend: { _id, title, start_at, end_at, location: {name, address}, organization: {name}, image, category, ... }
 * Frontend: { id, title, date, location, organization, imageUrl, category, price, ... }
 */
export const transformEventForFrontend = (backendEvent) => {
    // Helper to safely get location name
    const getLocationName = () => {
        if (!backendEvent.location) {
            console.warn('Event has no location:', backendEvent._id || backendEvent.id);
            return '';
        }
        if (typeof backendEvent.location === 'string') {
            return backendEvent.location;
        }
        if (typeof backendEvent.location === 'object') {
            // Location is an object with name and address
            const locationName = backendEvent.location.name || backendEvent.location.address || '';
            if (!locationName) {
                console.warn('Event location object has no name or address:', backendEvent.location, 'for event:', backendEvent._id || backendEvent.id);
            }
            return locationName;
        }
        console.warn('Event location is unexpected type:', typeof backendEvent.location, backendEvent.location, 'for event:', backendEvent._id || backendEvent.id);
        return '';
    };

    // Helper to safely get organization name
    const getOrganizationName = () => {
        if (!backendEvent.organization) return '';
        if (typeof backendEvent.organization === 'string') return backendEvent.organization;
        if (typeof backendEvent.organization === 'object') {
            return backendEvent.organization.name || '';
        }
        return '';
    };

    // Helper to safely get organization status
    const getOrganizationStatus = () => {
        if (!backendEvent.organization) return null;
        if (typeof backendEvent.organization === 'object') {
            return backendEvent.organization.status || null;
        }
        return null;
    };

    // Helper to format category
    const formatCategory = (cat) => {
        if (!cat) return 'Other';
        const str = String(cat);
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    };

    // Helper to get image URL
    const getImageUrl = () => {
        const imagePath = backendEvent.image?.trim();
        
        // If no image or empty, use default
        if (!imagePath) {
            return '/uploads/events/default-event-image.svg';
        }
        
        // If already a full URL, use it directly
        if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
            return imagePath;
        }
        
        // For relative paths (like /uploads/events/...), use as-is
        // Vite proxy will forward /uploads requests to backend
        if (imagePath.startsWith('/')) {
            return imagePath;
        }
        
        // If no leading slash, add one
        return `/${imagePath}`;
    };

    try {
        return {
            id: backendEvent._id || backendEvent.id,
            title: backendEvent.title || 'Untitled Event',
            description: backendEvent.description || '',
            date: backendEvent.start_at || backendEvent.date,
            start_at: backendEvent.start_at,
            end_at: backendEvent.end_at,
            location: getLocationName(),
            address: backendEvent.location?.address || '',
            organization: getOrganizationName(),
            organizationStatus: getOrganizationStatus(),
            imageUrl: getImageUrl(),
            category: formatCategory(backendEvent.category),
            price: 'Free', // Backend doesn't have price field, defaulting to Free
            capacity: backendEvent.capacity || 0,
            status: backendEvent.status || 'upcoming',
            registeredUsers: Array.isArray(backendEvent.registered_users) 
                ? backendEvent.registered_users.length 
                : (backendEvent.registeredUsers || 0),
            waitlistCount: Array.isArray(backendEvent.waitlist) 
                ? backendEvent.waitlist.length 
                : (backendEvent.waitlistCount || 0),
        };
    } catch (error) {
        console.error('Error transforming event:', error, backendEvent);
        // Return minimal safe object
        return {
            id: backendEvent._id || backendEvent.id || 'unknown',
            title: backendEvent.title || 'Unknown Event',
            description: backendEvent.description || '',
            date: backendEvent.start_at || new Date(),
            start_at: backendEvent.start_at,
            end_at: backendEvent.end_at,
            location: '',
            address: '',
            organization: '',
            organizationStatus: null,
            imageUrl: '/uploads/events/default-event-image.svg',
            category: 'Other',
            price: 'Free',
            capacity: 0,
            status: 'upcoming',
            registeredUsers: 0,
            waitlistCount: 0,
        };
    }
};

/**
 * Transform array of backend events to frontend format
 */
export const transformEventsForFrontend = (backendEvents) => {
    if (!Array.isArray(backendEvents)) {
        return [];
    }
    return backendEvents.map(transformEventForFrontend);
};

/**
 * Extract unique categories from events (for filters)
 */
export const getUniqueCategories = (events) => {
    const cats = events.map(e => e.category).filter(Boolean);
    return ['All', ...new Set(cats)];
};

/**
 * Extract unique locations from events (for filters)
 */
export const getUniqueLocations = (events) => {
    return [...new Set(events.map(e => e.location).filter(Boolean))].sort();
};

/**
 * Extract unique organizations from events (for filters)
 */
export const getUniqueOrganizations = (events) => {
    return [...new Set(events.map(e => e.organization).filter(Boolean))].sort();
};

