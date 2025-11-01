/* NOTE: This file should only contain the following:
- Calls to Models (Ticket, User, etc..)
- Functions that handle requests async (req,res)
- Logic for data validation, creation, modification
- Responses sent back to the frontend with res.json({....})
*/

/* For MongoDB session transactions, use it when doing multiple CRUD operations in
multiple collections/DB, it ensures to abort at anytime if any operation fails for 
any reason. Lil cheat sheet to help:
===============================================
const session = await mongoose.startSession();
session.startTransaction();
try {
    await Model1.updateOne(..., { session });
    await Model2.create(..., { session });
    // other atomic ops
    await session.commitTransaction();
} catch (e) {
    await session.abortTransaction();
} finally {
    session.endSession();
}
=============================================

*/
// Models of DB
const Administrator = require('../models/Administrators');
const { User, USER_ROLE } = require('../models/User');
const { Event, EVENT_STATUS, MODERATION_STATUS, CATEGORY } = require('../models/Event');
const { Organization, ORGANIZATION_STATUS } = require('../models/Organization');
const {Registration, REGISTRATION_STATUS} = require('../models/Registrations');
const Ticket = require('../models/Ticket');

// QR Code setup (npm install qrcode)
const qrcode = require('qrcode');

// Dotenv setup
const path = require('path')
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

// MongoDB setup
const mongoose = require('mongoose');
const { error } = require('console');
const { notifyEventModeration } = require('./notificationController');

// Helper function to ensure events have a default image if none is provided
const DEFAULT_EVENT_IMAGE = '/uploads/events/default-event-image.svg';
const normalizeEventImage = (event) => {
    // Handle null, undefined, empty string, or whitespace-only strings
    if (!event.image || (typeof event.image === 'string' && !event.image.trim())) {
        event.image = DEFAULT_EVENT_IMAGE;
    }
    return event;
};

// Helper function to normalize image field for an array of events
const normalizeEventsImages = (events) => {
    if (Array.isArray(events)) {
        return events.map(normalizeEventImage);
    }
    return events;
};

// Public API Endpoint for students to browse events (no authentication required)
exports.browseEvents = async (req, res) => {
    try {
        // Get query parameters for filtering
        const { 
            q, // search query
            category, 
            startDate, 
            endDate,
            minCapacity,
            maxCapacity,
            minDuration,
            maxDuration,
            page = 1,
            limit = 50,
            sortBy = 'start_at',
            sortOrder = 'asc'
        } = req.query;

        // Build query
        let query = {};

        // Filter by status - only show upcoming and active events to students
        query.status = { $in: ['upcoming', 'active'] };

        // Search in title and description
        if (q) {
            query.$or = [
                { title: { $regex: q, $options: 'i' } },
                { description: { $regex: q, $options: 'i' } }
            ];
        }

        // Filter by category
        if (category) {
            query.category = category;
        }

        // Filter by date range
        if (startDate || endDate) {
            query.start_at = {};
            if (startDate) {
                query.start_at.$gte = new Date(startDate);
            }
            if (endDate) {
                const endDateObj = new Date(endDate);
                endDateObj.setHours(23, 59, 59, 999);
                query.start_at.$lte = endDateObj;
            }
        }

        // Filter by capacity
        if (minCapacity || maxCapacity) {
            query.capacity = {};
            if (minCapacity) query.capacity.$gte = parseInt(minCapacity);
            if (maxCapacity) query.capacity.$lte = parseInt(maxCapacity);
        }

        // Build sort
        const sort = {};
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Fetch events
        const events = await Event.find(query)
            .select('organization title description category start_at end_at capacity status location image')
            .populate({
                path: 'organization',
                select: 'name description website status'
            })
            .sort(sort)
            .skip(skip)
            .limit(parseInt(limit))
            .lean()
            .exec();

        // Get total count for pagination
        const total = await Event.countDocuments(query);

        // Filter by duration if specified (post-query filtering since it's calculated)
        let filteredEvents = events;
        if (minDuration || maxDuration) {
            filteredEvents = events.filter(event => {
                if (!event.start_at || !event.end_at) return false;
                const durationHours = (new Date(event.end_at) - new Date(event.start_at)) / (1000 * 60 * 60);
                if (minDuration && durationHours < parseFloat(minDuration)) return false;
                if (maxDuration && durationHours > parseFloat(maxDuration)) return false;
                return true;
            });
        }

        // Apply default image to events
        const normalizedEvents = normalizeEventsImages(filteredEvents);

        return res.status(200).json({
            message: 'Events fetched successfully',
            total: normalizedEvents.length,
            totalPages: Math.ceil(total / parseInt(limit)),
            currentPage: parseInt(page),
            events: normalizedEvents
        });

    } catch (e) {
        console.error(e);
        return res.status(500).json({ error: "Failed to fetch events" });
    }
};

// API Endpoint to get all Events (Admin only)
exports.getAllEvents = async (req,res) => {
    try{
        // Only administrators can fetch all events
        const { ensureAdmin } = require('../utils/authHelpers');
        try { await ensureAdmin(req); } catch (e) { return res.status(e.status || 401).json({ code: e.code || 'UNAUTHORIZED', message: e.message }); }

        const events = await Event.find()
            .select('organization title description category start_at end_at capacity status location registered_users waitlist image')
            .populate({
                path: 'organization',
                select: 'name description website contact.email contact.phone contact.socials'
            })
            .populate({
                path: 'registered_users',
                select: 'name email'
            })
            .populate({
                path: 'waitlist',
                select: 'registrationId user quantity status',
                populate: {
                    path: 'user',
                    select: 'name email'
                }
            })
            .sort({ start_at: 1 }) // optional: sort by start date
            .lean()
            .exec();

        // Apply default image to events
        const normalizedEvents = normalizeEventsImages(events);

        return res.status(200).json({
            message: 'All events fetched successfully',
            total: normalizedEvents.length,
            events: normalizedEvents,
        });

        
    } catch(e){
        console.error(e);
        return res.status(500).json({error: "Failed to fetch all events"})
    }
}

// API Endpoint to get an event by it's _id
exports.getEventById = async (req,res) => {
    try{
        // Admin only
        const { ensureAdmin } = require('../utils/authHelpers');
        try { await ensureAdmin(req); } catch (e) { return res.status(e.status || 401).json({ code: e.code || 'UNAUTHORIZED', message: e.message }); }

        const {event_id} =  req.params;
        if (!event_id)
            return res.status(400).json({error: "event_id is required"});
        if (!mongoose.Types.ObjectId.isValid(event_id))
            return res.status(400).json({error: "Invalid event id format"});

        const event = await Event.findById(event_id)
            .select('organization title description category start_at end_at capacity status moderationStatus location registered_users waitlist image')
            .populate({
                path: 'organization',
                select: 'name description website contact.email contact.phone contact.socials'
            })
            .populate({
                path: 'registered_users',
                select: 'name email'
            })
            .populate({
                path: 'waitlist',
                select: 'registrationId user quantity status',
                populate: {
                    path: 'user',
                    select: 'name email'
                }
            })
            .lean()
            .exec();

        if (!event) return res.status(404).json({error: "Event not found"});
    
        // Apply default image to event
        const normalizedEvent = normalizeEventImage(event);

        return res.status(200).json({
            message: 'Event fetched successfully',
            event: normalizedEvent
        });

        
    } catch(e){
        console.error(e);
        return res.status(500).json({error: "Failed to fetch all events"})
    }
}

// API Endpoint to get events by organizations
exports.getEventByOrganization = async (req,res) =>{
    try{
        
        const {org_id} = req.params;
        if (!org_id)
            return res.status(400).json({error: "org_id is required"});
        if (!mongoose.Types.ObjectId.isValid(org_id)){
            return res.status(400).json({error: "Invalid org_ig format"});
        }

        const events = await Event.find({organization: org_id})
        .select('organization title description category start_at end_at capacity status location registered_users waitlist image')
        .populate({
            path: 'organization',
            select: 'name description website contact.email contact.phone contact.socials'
        })
        .populate({
            path: 'registered_users',
            select: 'name email'
        })
        .populate({
            path: 'waitlist',
            select: 'registrationId user quantity status',
            populate: {
                path: 'user',
                select: 'name email'
            }
        })
        .sort({ start_at: 1 }) // optional: sort by start date
        .lean()
        .exec();

        if (!events) 
            return res.status(404).json({error: "Events not found"});
    
        // Apply default image to events
        const normalizedEvents = normalizeEventsImages(events);

        return res.status(200).json({
            message: 'Events fetched successfully',
            events: normalizedEvents
        });

    } catch(e){
        console.error(e);
        return res.status(500).json({error: "Failed to fetch events by organization"});
    }
}

// API Endpoint to get events by status
exports.getEventsByStatus = async (req,res) =>{
    try{

        const { ensureAdmin } = require('../utils/authHelpers');
        try { await ensureAdmin(req); } catch (e) { return res.status(e.status || 401).json({ code: e.code || 'UNAUTHORIZED', message: e.message }); }

        const events = await Event.find({status: status})
        .select('organization title description start_at end_at capacity status registered_users waitlist image')
        .populate({
            path: 'organization',
            select: 'name description website contact.email contact.phone contact.socials'
        })
        .populate({
            path: 'registered_users',
            select: 'name email'
        })
        .populate({
            path: 'waitlist',
            select: 'registrationId user quantity status',
            populate: {
                path: 'user',
                select: 'name email'
            }
        })
        .sort({ start_at: 1 }) // optional: sort by start date
        .lean()
        .exec();

        if (!events) 
            return res.status(404).json({error: "Events not found"});
    
        // Apply default image to events
        const normalizedEvents = normalizeEventsImages(events);

        return res.status(200).json({
            message: 'Events fetched successfully',
            events: normalizedEvents
        });

    } catch(e){
        console.error(e);
        return res.status(500).json({error: "Failed to fetch events by organization"});
    }
}

// API Endpoint to get events by category
exports.getEventsByCategory = async (req,res)=>{
    try{
        const {category} = req.params;
        if (!category)
            return res.status(400).json({error: "category is required"});
        if (!Object.values(CATEGORY).includes(category)) {
            return res.status(400).json({
                error: `Invalid category. Must be one of: ${Object.values(CATEGORY).join(', ')}`
            });
        }

        const events = await Event.find({category: category})
        .select('organization title description start_at end_at capacity status registered_users waitlist image')
        .populate({
            path: 'organization',
            select: 'name description website contact.email contact.phone contact.socials'
        })
        .populate({
            path: 'registered_users',
            select: 'name email'
        })
        .populate({
            path: 'waitlist',
            select: 'registrationId user quantity status',
            populate: {
                path: 'user',
                select: 'name email'
            }
        })
        .sort({ start_at: 1 }) // optional: sort by start date
        .lean()
        .exec();

        if (!events) 
            return res.status(404).json({error: "Events not found"});
    
        // Apply default image to events
        const normalizedEvents = normalizeEventsImages(events);

        return res.status(200).json({
            message: 'Events fetched successfully',
            events: normalizedEvents
        });

    } catch(e){
        console.error(e);
        return res.status(500).json({error: "Failed to fetch events by organization"});
    }

}

// API Endpoint to get events by a certain date range in the queries
exports.getEventsByDateRange = async (req, res) => {
  try {
        const { start, end } = req.query;

        // Validate input
        if (!start || !end)
            return res.status(400).json({ error: "Both start and end dates are required (YYYY-MM-DD)" });

        const startDate = new Date(start);
        const endDate = new Date(end);

        // Validate format
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime()))
            return res.status(400).json({ error: "Invalid date format. Use YYYY-MM-DD." });
        
        // Ensure start < end
        if (endDate < startDate)
            return res.status(400).json({ error: "End date must be after start date." });

        // Query: events whose start_at or end_at fall within the range
        const events = await Event.find({
        $or: [
            { start_at: { $gte: startDate, $lte: endDate } },
            { end_at: { $gte: startDate, $lte: endDate } }
        ]
        })
        .select('organization title description category start_at end_at capacity status location registered_users waitlist image')
        .populate({
            path: 'organization',
            select: 'name description website contact.email contact.phone contact.socials'
        })
        .populate({
            path: 'registered_users',
            select: 'name email'
        })
        .populate({
            path: 'waitlist',
            select: 'registrationId user quantity status',
            populate: {
            path: 'user',
            select: 'name email'
            }
        })
        .sort({ start_at: 1 })
        .lean();

        if (!events)
            return res.status(404).json({ error: "No events found within the specified date range." });

        // Apply default image to events
        const normalizedEvents = normalizeEventsImages(events);

        return res.status(200).json({
            message: `Events between ${start} and ${end} fetched successfully.`,
            total: normalizedEvents.length,
            events: normalizedEvents
        });

    } catch (e) {
        console.error(e);
        return res.status(500).json({ error: "Failed to fetch events by date range." });
    }
};


// API Endpoint to get events by user id --> queries through registrations
exports.getEventsByUserRegistrations = async (req,res)=>{
    try{
        const {user_id} = req.params;
        if (!user_id)
            return res.status(400).json({error: "user_id is required"});
        if(!mongoose.Types.ObjectId.isValid(user_id))
            return res.status(400).json({error: "Invalid user_id format"});

        const regs = await Registration.find({user: user_id})
        .populate({
            path: 'user', 
            select: 'name email'})
        .populate({
            path: 'event', 
            select: 'organization title description start_at end_at location image',
            populate:{
            path: 'organization',
            select: 'name website',
        }})
        .populate({
            path: 'ticketIds',
            model: 'Ticket', 
            select: 'ticketId code status scannedAt scannedBy',
        })
        .sort({createdAt: -1})
        .lean()
        .exec();
        
        if (regs.length === 0)
            return res.status(404).json({error: "No registration found for this user"});

        const events = regs.map(r => {
            const eventObj = r.event ? normalizeEventImage({ ...r.event }) : null;
            const tickets = Array.isArray(r.ticketIds) ? r.ticketIds : [];
            
            // Get ticket numbers (codes or ticketIds) if confirmed
            const ticketNumbers = r.status === REGISTRATION_STATUS.CONFIRMED && tickets.length > 0
                ? tickets.map(t => t.code || t.ticketId).filter(Boolean)
                : [];
            
            return {
                event: eventObj ? {
                    ...eventObj,
                    location: eventObj.location || { name: '', address: '' },
                    price: eventObj.price || null,
                    description: eventObj.description || '',
                } : null,
                status: r.status,
                quantity: r.quantity,
                ticketsIssued: r.ticketsIssued,
                registeredAt: r.createdAt,
                ticketNumbers: ticketNumbers,
            };
        });

        if (!events) 
            return res.status(404).json({error: "Events not found"});
    

        return res.status(200).json({
            message: 'Events fetched successfully',
            events
        });

    } catch(e){
        console.error(e);
        return res.status(500).json({error: "Failed to fetch events by organization"});
    }
}

// API Endpoint to create an event
exports.createEvent = async (req,res)=>{

    try {
        // Check authentication
        if (!req.user || !req.user._id) {
            return res.status(401).json({ code: 'UNAUTHORIZED', message: 'Authentication required' });
        }

        // Check if user is admin or organizer
        const { isAdmin } = require('../utils/authHelpers');
        
        const userIsAdmin = await isAdmin(req);
        // Handle role comparison - check both exact match and case-insensitive
        const userRole = req.user.role || '';
        const userIsOrganizer = userRole === USER_ROLE.ORGANIZER || 
                                 userRole.toLowerCase() === USER_ROLE.ORGANIZER.toLowerCase();

        if (!userIsAdmin && !userIsOrganizer) {
            return res.status(403).json({ 
                code: 'FORBIDDEN', 
                message: 'Only administrators and organizers can create events',
                userRole: userRole,
                expectedRole: USER_ROLE.ORGANIZER
            });
        }

        // Handle both JSON and multipart/form-data (file upload)
        let requestBody = req.body;
        
        // If Content-Type is text/plain, try to parse as JSON
        if (typeof req.body === 'string' && req.get('Content-Type') === 'text/plain') {
            try {
                requestBody = JSON.parse(req.body);
            } catch (e) {
                return res.status(400).json({error: 'Invalid JSON in request body'});
            }
        }

        // Handle location if it's sent as nested form fields (location[name], location[address])
        // or as a JSON string
        let location = requestBody.location;
        if (typeof location === 'string') {
            try {
                location = JSON.parse(location);
            } catch (e) {
                // If not JSON, might be in form field format - handle separately
            }
        }
        // If location is sent as separate fields (location[name], location[address])
        if (!location || !location.name) {
            const locationName = requestBody['location[name]'] || requestBody.locationName;
            const locationAddress = requestBody['location[address]'] || requestBody.locationAddress;
            if (locationName && locationAddress) {
                location = { name: locationName, address: locationAddress };
            }
        }

        const { organization, title, description, start_at, end_at, capacity = 0, category } = requestBody;

        if (!organization || !title || !start_at || !end_at) {
            return res.status(400).json({ error: 'organization, title, start_at and end_at are required' });
        }

        if (!location || !location.name || !location.address) {
            return res.status(400).json({ error: 'location.name and location.address are required' });
        }

        if (!mongoose.Types.ObjectId.isValid(organization)) {
            return res.status(400).json({ error: 'Invalid organization id format' });
        }

        const org = await Organization.findById(organization).lean();
        if (!org) return res.status(404).json({ error: 'Organization not found' });

        // If user is organizer (not admin), verify they own this organization
        if (!userIsAdmin && userIsOrganizer) {
            // Fetch full user to get organization reference
            const user = await User.findById(req.user._id).select('organization').lean();
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }
            
            // Check if organizer's organization matches the event organization
            // Handle both ObjectId and string formats
            let userOrgId = null;
            if (user.organization) {
                userOrgId = user.organization.toString ? user.organization.toString() : String(user.organization);
            }
            
            const eventOrgId = String(organization);
            
            if (!userOrgId || userOrgId !== eventOrgId) {
                return res.status(403).json({ 
                    code: 'FORBIDDEN',
                    error: 'Organizers can only create events for their own organization',
                    message: userOrgId 
                        ? 'You do not have permission to create events for this organization'
                        : 'You must be associated with an organization to create events'
                });
            }
        }

        // Task #122: Restrict event creation to only approved organizations
        if (org.status !== 'approved') {
            return res.status(403).json({ 
                error: 'Only approved organizations can create events',
                organizationStatus: org.status,
                message: org.status === 'pending' 
                    ? 'Your organization is pending approval' 
                    : 'Your organization has been rejected or suspended'
            });
        }

        // Handle image: prioritize file upload (req.file) over URL input
        let imageUrl = null;
        if (req.file) {
            // File uploaded via multer - construct URL
            imageUrl = `/uploads/events/${req.file.filename}`;
            console.log(`[AUDIT] Image uploaded: ${req.file.filename} for event: ${title || 'Unknown'}`);
        } else if (requestBody.image && requestBody.image.trim()) {
            // Image URL or base64 provided in request body (fallback option)
            imageUrl = requestBody.image.trim();
        }

        // Validate dates before creating event
        const startDate = new Date(start_at);
        const endDate = new Date(end_at);
        
        if (isNaN(startDate.getTime())) {
            return res.status(400).json({ error: 'Invalid start_at date format' });
        }
        if (isNaN(endDate.getTime())) {
            return res.status(400).json({ error: 'Invalid end_at date format' });
        }
        if (endDate <= startDate) {
            return res.status(400).json({ error: 'end_at must be after start_at' });
        }

        const eventDoc = await Event.create({
            organization,
            title: title.trim(),
            description: description ? description.trim() : '',
            start_at: startDate,
            end_at: endDate,
            capacity: Number(capacity) || 0,
            category: category || CATEGORY.OTHER,
            location,
            status: EVENT_STATUS.UPCOMING,
            moderationStatus: MODERATION_STATUS.PENDING_APPROVAL,
            image: imageUrl,
        });

        console.log('Event created:', eventDoc._id, title.trim());

        // Convert to plain object and apply default image if needed
        const eventObj = eventDoc.toObject();
        const normalizedEvent = normalizeEventImage(eventObj);

        return res.status(201).json({ 
            message: 'Event created successfully', 
            event: normalizedEvent 
        });
    } catch (e) {
        console.error('Error creating event:', e);
        console.error('Error stack:', e.stack);
        console.error('Request body:', req.body);
        console.error('User:', req.user);
        
        // If file was uploaded but event creation failed, clean up the file
        if (req.file) {
            const fs = require('fs');
            const path = require('path');
            const filePath = path.join(__dirname, '..', 'uploads', 'events', req.file.filename);
            try {
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            } catch (cleanupError) {
                console.error('Error cleaning up uploaded file:', cleanupError);
            }
        }
        return res.status(500).json({ 
            error: 'Failed to create event',
            message: e.message || 'An unexpected error occurred',
            details: process.env.NODE_ENV === 'development' ? e.stack : undefined
        });
    }

}

// API Endpoint to update an event
exports.updateEvent = async (req,res) => {

    try {
        const { event_id } = req.params;
        if (!event_id) return res.status(400).json({ error: 'event_id is required' });
        if (!mongoose.Types.ObjectId.isValid(event_id)) return res.status(400).json({ error: 'Invalid event_id format' });

        // // Admin only
        // if (!req.user) return res.status(401).json({ code: 'UNAUTHORIZED', message: 'Authentication required' });
        // const admin = await Administrator.findOne({ email: req.user.email }).lean();
        // if (!admin) return res.status(403).json({ code: 'FORBIDDEN', message: 'Admin access required' });

        const updates = {};
        const allowed = ['title','description','start_at','end_at','capacity','status','location','category'];
        for (const k of allowed) if (req.body[k] !== undefined) updates[k] = req.body[k];

        // Handle location if it's sent as nested form fields or JSON string
        if (req.body.location) {
            let location = req.body.location;
            if (typeof location === 'string') {
                try {
                    location = JSON.parse(location);
                } catch (e) {
                    // If not JSON, might be in form field format
                }
            }
            // If location is sent as separate fields
            if (!location.name || !location.address) {
                const locationName = req.body['location[name]'] || req.body.locationName;
                const locationAddress = req.body['location[address]'] || req.body.locationAddress;
                if (locationName && locationAddress) {
                    location = { name: locationName, address: locationAddress };
                }
            }
            if (location && location.name && location.address) {
                updates.location = location;
            }
        }

        // Handle image: prioritize file upload (req.file) over URL input
        if (req.file) {
            // File uploaded via multer - construct URL
            updates.image = `/uploads/events/${req.file.filename}`;
            console.log(`[AUDIT] Image updated: ${req.file.filename} for event: ${event_id}`);
            
            // Optionally delete old image file if it exists
            const event = await Event.findById(event_id).select('image').lean();
            if (event && event.image && event.image.startsWith('/uploads/events/')) {
                const fs = require('fs');
                const path = require('path');
                const oldFilePath = path.join(__dirname, '..', event.image);
                try {
                    if (fs.existsSync(oldFilePath)) {
                        fs.unlinkSync(oldFilePath);
                    }
                } catch (cleanupError) {
                    console.error('Error cleaning up old image file:', cleanupError);
                }
            }
        } else if (req.body.image !== undefined) {
            // Image URL provided in request body or image removal
            // If image is null/empty string, allow removing the image
            if (req.body.image && req.body.image.trim()) {
                updates.image = req.body.image.trim();
            } else {
                updates.image = null;
            }
        }

        // Use a session when capacity change might affect waitlist/promotions
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const before = await Event.findById(event_id).session(session);
            if (!before) {
                await session.abortTransaction();
                session.endSession();
                return res.status(404).json({ error: 'Event not found' });
            }

            // apply updates
            const updated = await Event.findByIdAndUpdate(event_id, updates, { new: true, session });

            await session.commitTransaction();
            session.endSession();

            // If capacity increased, try to promote waitlist (run after commit so other readers see new capacity)
            try {
                const beforeCap = Number(before.capacity || 0);
                const afterCap = Number(updated.capacity || 0);
                if (afterCap > beforeCap) {
                    const { promoteWaitlistForEvent } = require('./eventController');
                    await promoteWaitlistForEvent(updated._id);
                }
            } catch (promErr) {
                console.log('Promotion after update failed (non-critical):', promErr.message);
            }

            // Convert to plain object and apply default image if needed
            const updatedObj = updated.toObject();
            const normalizedEvent = normalizeEventImage(updatedObj);

            console.log('Event updated:', event_id, updated.title);
            return res.status(200).json({ message: 'Event updated', event: normalizedEvent });
        } catch (e) {
            await session.abortTransaction();
            session.endSession();
            throw e;
        }
    } catch (e) {
        console.error(e);
        return res.status(500).json({ error: 'Failed to update event' });
    }

}

// API Endpoint to cancel an event
exports.cancelEvent = async (req,res) => {

    try {
        const { event_id } = req.params;
        if (!event_id) return res.status(400).json({ error: 'event_id is required' });
        if (!mongoose.Types.ObjectId.isValid(event_id)) return res.status(400).json({ error: 'Invalid event_id format' });

        // Admin only
        const { ensureAdmin } = require('../utils/authHelpers');
        try { await ensureAdmin(req); } catch (e) { return res.status(e.status || 401).json({ code: e.code || 'UNAUTHORIZED', message: e.message }); }

        // Transactionally mark event cancelled, cancel registrations and delete tickets
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const event = await Event.findById(event_id).session(session);
            if (!event) {
                await session.abortTransaction();
                session.endSession();
                return res.status(404).json({ error: 'Event not found' });
            }

            // Mark event cancelled
            event.status = EVENT_STATUS.CANCELLED;
            await event.save({ session });

            // Cancel all registrations for this event
            const regs = await Registration.find({ event: event_id }).session(session);
            const regIds = regs.map(r => r._id);

            if (regIds.length > 0) {
                await Registration.updateMany({ _id: { $in: regIds } }, { $set: { status: REGISTRATION_STATUS.CANCELLED, ticketIds: [], ticketsIssued: 0 } }).session(session);

                // Delete tickets linked to those registrations
                await Ticket.deleteMany({ registration: { $in: regIds } }).session(session);
            }

            await session.commitTransaction();
            session.endSession();

            console.log('Event cancelled:', event._id, regIds.length, 'registrations');
            return res.status(200).json({ message: 'Event cancelled and related registrations/tickets cleaned up', eventId: event._id, cancelledRegistrations: regIds.length });
        } catch (e) {
            await session.abortTransaction();
            session.endSession();
            throw e;
        }
    } catch (e) {
        console.error(e);
        return res.status(500).json({ error: 'Failed to cancel event' });
    }

}

// API Endpoint to delete an event
exports.deleteEvent = async (req,res) => {
    try{
        const {event_id} = req.params;
        if(!event_id)
            return res.status(400).json({error: "event_id is required"});
        if (!mongoose.Types.ObjectId.isValid(event_id))
            return res.status(400).json({error: "Invalid event_id format"})
        // Admin only
        const { ensureAdmin } = require('../utils/authHelpers');
        try { await ensureAdmin(req); } catch (e) { return res.status(e.status || 401).json({ code: e.code || 'UNAUTHORIZED', message: e.message }); }

        const event = await Event.findById(event_id).lean();
        if (!event)
            return res.status(404).json({error: "Event not found"});

        const session = await mongoose.startSession();
        session.startTransaction();
        let deletedRegistrationsCount = 0;
        let deletedTicketsCount = 0;
        try{
            // Find registrations for this event inside the session
            const regs = await Registration.find({event: event_id}).session(session);
            const regIds = regs.map(r => r._id);
            deletedRegistrationsCount = regIds.length;

            // Delete tickets linked to those registrations
            if (regIds.length > 0) {
                const ticketDelRes = await Ticket.deleteMany({registration: {$in: regIds}}).session(session);
                deletedTicketsCount += ticketDelRes.deletedCount || 0;
            }

            // Also delete any tickets that reference the event directly (defensive)
            const ticketEventDelRes = await Ticket.deleteMany({event: event_id}).session(session);
            deletedTicketsCount += ticketEventDelRes.deletedCount || 0;

            // Delete all registrations
            await Registration.deleteMany({event: event_id}).session(session);

            // Delete event itself
            await Event.findByIdAndDelete(event_id).session(session);

            await session.commitTransaction();

            console.log('Event deleted:', event._id, event.title, deletedRegistrationsCount, 'regs', deletedTicketsCount, 'tickets');
            return res.status(200).json({
                message: `Event '${event.title}' and all related data deleted successfully`,
                deletedEventId: event._id,
                deletedRegistrations: deletedRegistrationsCount,
                deletedTickets: deletedTicketsCount,
            });

        } catch(e){
            console.error(e);
            await session.abortTransaction();
            return res.status(500).json({ error: "Failed to delete event and related data" });
        } finally{
            session.endSession();
        }

    } catch(e){
        console.error(e);
        return res.status(500).json({error: "Could not delete events"})
    }
}

// API Endpoint to get attendees for an event
exports.getAttendees = async (req,res) => {
    try{
        const {event_id} = req.params;
        if (!event_id)
            return res.status(400).json({error: "event_id is required"});
        if (!mongoose.Types.ObjectId.isValid(event_id))
            return res.status(400).json({error: "Invalid event_id format"});

        // Check authentication and authorization (admin or event organizer)
        if (!req.user || !req.user._id) {
            return res.status(401).json({ code: 'UNAUTHORIZED', message: 'Authentication required' });
        }

        const { ensureAdmin, isAdmin } = require('../utils/authHelpers');
        
        const userIsAdmin = await isAdmin(req);
        
        // If not admin, check if organizer owns this event's organization
        if (!userIsAdmin) {
            const userRole = req.user.role || '';
            const userIsOrganizer = userRole === USER_ROLE.ORGANIZER || 
                                 userRole.toLowerCase() === USER_ROLE.ORGANIZER.toLowerCase();
            
            if (userIsOrganizer) {
                // Fetch full user to get organization reference
                const user = await User.findById(req.user._id).select('organization').lean();
                if (!user) {
                    return res.status(404).json({ error: 'User not found' });
                }
                
                // Check if user has an organization
                if (!user.organization) {
                    return res.status(403).json({ 
                        code: 'FORBIDDEN',
                        error: 'Organizers must be associated with an organization to view attendees'
                    });
                }
            } else {
                return res.status(403).json({ 
                    code: 'FORBIDDEN',
                    error: 'Admin or organizer access required'
                });
            }
        }

        const event = await Event.findById(event_id)
        .select('organization title description start_at end_at capacity status registered_users waitlist image')
        .populate({
            path: 'organization',
            select: 'name description website contact.email contact.phone contact.socials'
        })
        .populate({
            path: 'registered_users',
            select: 'name email username'
        })
        .populate({
            path: 'waitlist',
            select: 'registrationId user quantity status',
            populate: {
                path: 'user',
                select: 'name email'
            }
        })
        .sort({ start_at: 1 }) // optional: sort by start date
        .lean()
        .exec();

        if (!event) 
            return res.status(404).json({error: "Events not found"});

        // If organizer, verify they own this event's organization
        if (!userIsAdmin) {
            const user = await User.findById(req.user._id).select('organization').lean();
            const userOrgId = user.organization ? user.organization.toString() : null;
            const eventOrgId = event.organization ? (event.organization._id ? event.organization._id.toString() : String(event.organization)) : null;
            
            if (!userOrgId || userOrgId !== eventOrgId) {
                return res.status(403).json({ 
                    code: 'FORBIDDEN',
                    error: 'Organizers can only view attendees for their own organization\'s events'
                });
            }
        }

        // Apply default image to event
        const normalizedEvent = normalizeEventImage(event);

        if (!normalizedEvent.registered_users || normalizedEvent.registered_users.length === 0)
            return res.status(404).json({ error: "No confirmed attendees found for this event" });
    
        const attendees = normalizedEvent.registered_users.map(user => ({
            _id: user._id,
            name: user.name || '',
            username: user.username || '',
            email: user.email || ''
        }));

        return res.status(200).json({
            message: `Confirmed attendees for event '${normalizedEvent.title}' fetched successfully`,
            event: {
                _id: normalizedEvent._id,
                title: normalizedEvent.title,
                start_at: normalizedEvent.start_at,
                end_at: normalizedEvent.end_at,
                capacity: normalizedEvent.capacity,
                organization: normalizedEvent.organization,
                image: normalizedEvent.image
            },
            total_attendees: attendees.length,
            attendees
        });

    } catch(e){
        console.error(e);
        return res.status(500).json({error: "Failed to fetch attendees"});
    }
}

// API Endpoint to get waitlisted users for an event
exports.getWaitlistedUsers = async (req,res) =>{
    try{
        const {event_id} = req.params;
        if (!event_id)
            return res.status(400).json({error: "event_id is required"});
        if (!mongoose.Types.ObjectId.isValid(event_id))
            return res.status(400).json({error: "Invalid event_id format"});

        const event = await Event.findById(event_id)
        .select('organization title description start_at end_at capacity status registered_users waitlist image')
        .populate({
            path: 'organization',
            select: 'name description website contact.email contact.phone contact.socials'
        })
        .populate({
            path: 'registered_users',
            select: 'name email'
        })
        .populate({
            path: 'waitlist',
            select: 'registrationId user quantity status',
            populate: {
                path: 'user',
                select: 'name email'
            }
        })
        .sort({ start_at: 1 }) // optional: sort by start date
        .lean()
        .exec();

        if (!event) 
            return res.status(404).json({error: "Events not found"});

        // Apply default image to event
        const normalizedEvent = normalizeEventImage(event);

        if (!normalizedEvent.waitlist || normalizedEvent.waitlist.length === 0)
            return res.status(404).json({ error: "No waitlisted users/registration found for this event" });
    
        const waitlisted = normalizedEvent.waitlist.map(reg => ({
            registrationId: reg.registrationId,
            status: reg.status,
            quantity: reg.quantity,
            registeredAt: reg.createdAt,
            user: reg.user
                ? {
                    _id: reg.user._id,
                    name: reg.user.name,
                    email: reg.user.email
                }
                : null
        }));
        return res.status(200).json({
            message: `Confirmed waitlisted users for event '${normalizedEvent.title}' fetched successfully`,
            event: {
                _id: normalizedEvent._id,
                title: normalizedEvent.title,
                start_at: normalizedEvent.start_at,
                end_at: normalizedEvent.end_at,
                capacity: normalizedEvent.capacity,
                organization: normalizedEvent.organization,
                image: normalizedEvent.image
            },
            total_waitlisted: waitlisted.length,
            waitlisted
        });

    } catch(e){
        console.error(e);
        return res.status(500).json({error: "Failed to fetch attendees"});
    }
}

// API endpoint to promote waitlisted user
exports.promoteWaitlistedUser = async (req, res) => {
    const { event_id } = req.params;
    try {
        const result = await promoteWaitlistForEvent(event_id);
        if (!result.promoted || result.promoted.length === 0) {
            return res.status(404).json({ message: 'No waitlisted users promoted' });
        }

        return res.status(200).json({
            message: 'Waitlisted users promoted successfully',
            promoted: result.promoted,
            remainingCapacity: result.remainingCapacity,
        });
    } catch (e) {
        console.error('Failed to promote waitlist', e);
        return res.status(500).json({ error: 'Failed to promote waitlist' });
    }
};

// Helper: promote as many waitlisted registrations as capacity allows (transactional)
async function promoteWaitlistForEvent(eventId) {
    if (!mongoose.Types.ObjectId.isValid(eventId)) throw new Error('Invalid event id');

    const session = await mongoose.startSession();
    session.startTransaction();
    const promoted = [];
    const newlyCreatedTickets = [];
    try {
        // Reload event inside the session and populate waitlist
        const event = await Event.findById(eventId).session(session).populate({ path: 'waitlist' });
        if (!event) throw new Error('Event not found');

        // Ensure waitlist is an array of registration ids
        event.waitlist = event.waitlist || [];

        // Process FIFO
        while (event.capacity > 0 && event.waitlist.length > 0) {
            const nextRef = event.waitlist[0];
            // nextRef can be an ObjectId or a populated registration doc; handle both
            let reg = null;
            if (nextRef && typeof nextRef === 'object' && nextRef._id) {
                reg = nextRef;
            } else {
                reg = await Registration.findById(nextRef).session(session);
            }
            if (!reg) {
                // remove broken ref
                event.waitlist.shift();
                continue;
            }

            // If this registration requires more seats than available, stop
            if (reg.quantity > event.capacity) {
            // skip this registration but continue for next
                event.waitlist.push(event.waitlist.shift()); // optional: move to end
                continue;
            }

            // Promote
            reg.status = REGISTRATION_STATUS.CONFIRMED;
            await reg.save({ session });

            // Decrement capacity
            event.capacity = Math.max(0, event.capacity - reg.quantity);

            // Remove from waitlist
            event.waitlist.shift();

            // Ensure user is in registered_users
            event.registered_users = event.registered_users || [];
            if (!event.registered_users.find(id => id.toString() === reg.user.toString())) {
                event.registered_users.push(reg.user);
            }

            // Create tickets for the promoted registration inside the same transaction
            const ticketsToCreate = [];
            for (let i = 0; i < reg.quantity; i++) {
                ticketsToCreate.push({ user: reg.user, event: event._id, registration: reg._id });
            }
            if (ticketsToCreate.length > 0) {
                const created = await Ticket.create(ticketsToCreate, { session });
                const newIds = created.map(t => t._id);
                // update registration document in-session
                reg.ticketIds = Array.isArray(reg.ticketIds) ? reg.ticketIds.concat(newIds) : newIds;
                reg.ticketsIssued = (reg.ticketsIssued || 0) + newIds.length;
                await reg.save({ session });
                newlyCreatedTickets.push(...created);
            }
            promoted.push({ registration: reg._id, user: reg.user, quantity: reg.quantity });
        }

        await event.save({ session });
        await session.commitTransaction();
        session.endSession();

        // Generate QR codes for any tickets created during promotion (outside the transaction)
        if (newlyCreatedTickets.length > 0) {
            try {
                for (const t of newlyCreatedTickets) {
                    const payload = JSON.stringify({ ticketId: t.ticketId || t._id, registration: t.registration });
                    const qr = await qrcode.toDataURL(payload);
                    await Ticket.findByIdAndUpdate(t._id, { qrDataUrl: qr, qr_expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24) });
                }
            } catch (qrErr) {
                console.error('QR generation failed for promoted tickets:', qrErr);
            }
        }

        return { promoted };
    } catch (e) {
        if (session.inTransaction()) {
            await session.abortTransaction();
        }
        session.endSession();
        throw e;
    }
}


exports.exportAttendeesCSV = async (req, res) => {
    try {
        const { event_id } = req.params;

        // Validate event ID format
        if (!event_id) {
            return res.status(400).json({ 
                error: 'Event ID is required',
                code: 'INVALID_INPUT'
            });
        }

        if (!mongoose.Types.ObjectId.isValid(event_id)) {
            return res.status(400).json({ 
                error: 'Invalid event ID format',
                code: 'INVALID_FORMAT'
            });
        }

        // Check authentication - must be admin or organizer
        if (!req.user || !req.user._id) {
            return res.status(401).json({ code: 'UNAUTHORIZED', message: 'Authentication required' });
        }

        const { isAdmin } = require('../utils/authHelpers');
        const userIsAdmin = await isAdmin(req);
        
        // If not admin, must be an organizer
        if (!userIsAdmin) {
            const userRole = req.user.role || '';
            const userIsOrganizer = userRole === USER_ROLE.ORGANIZER || 
                                 userRole.toLowerCase() === USER_ROLE.ORGANIZER.toLowerCase();
            
            if (!userIsOrganizer) {
                return res.status(403).json({ 
                    code: 'FORBIDDEN',
                    error: 'Only administrators and organizers can export attendee lists'
                });
            }
            
            // Verify organizer is associated with an organization
            const user = await User.findById(req.user._id).select('organization').lean();
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }
            
            if (!user.organization) {
                return res.status(403).json({ 
                    code: 'FORBIDDEN',
                    error: 'Organizers must be associated with an organization to export attendees'
                });
            }
        }

        // Check if event exists and verify organizer ownership if needed
        const event = await Event.findById(event_id)
            .populate({
                path: 'organization',
                select: '_id'
            })
            .lean();

        if (!event) {
            return res.status(404).json({ 
                error: 'Event not found',
                code: 'EVENT_NOT_FOUND'
            });
        }

        // If organizer, verify they own this event's organization
        if (!userIsAdmin) {
            const user = await User.findById(req.user._id).select('organization').lean();
            const userOrgId = user.organization ? user.organization.toString() : null;
            const eventOrgId = event.organization ? (event.organization._id ? event.organization._id.toString() : String(event.organization)) : null;
            
            if (!userOrgId || userOrgId !== eventOrgId) {
                return res.status(403).json({ 
                    code: 'FORBIDDEN',
                    error: 'Organizers can only export attendees for their own organization\'s events'
                });
            }
        }

        // Get all registrations for this event
        const registrations = await Registration.find({ event: event_id })
            .populate({
                path: 'user',
                select: 'name email username'
            })
            .populate({
                path: 'ticketIds',
                select: 'ticketId status scannedAt'
            })
            .lean();

        // Handle empty list
        if (!registrations || registrations.length === 0) {
            return res.status(404).json({ 
                error: 'No attendees found for this event',
                code: 'EMPTY_LIST',
                message: 'The attendee list is empty'
            });
        }

        // Build CSV content with UTF-8 BOM for Excel compatibility
        const csvRows = [];
        
        // CSV Header
        csvRows.push([
            'Registration ID',
            'Name',
            'Email',
            'Username',
            'Quantity',
            'Status',
            'Registered At',
            'Tickets Issued',
            'Ticket IDs',
            'Check-in Status'
        ].join(','));

        // CSV Data rows
        for (const reg of registrations) {
            // Handle invalid data gracefully
            const name = reg.user?.name || 'Unknown';
            const email = reg.user?.email || 'N/A';
            const username = reg.user?.username || 'N/A';
            const quantity = reg.quantity || 0;
            const status = reg.status || 'unknown';
            const registeredAt = reg.createdAt ? new Date(reg.createdAt).toISOString() : 'N/A';
            const ticketsIssued = reg.ticketsIssued || 0;
            
            // Get ticket IDs
            const ticketIds = Array.isArray(reg.ticketIds) 
                ? reg.ticketIds.map(t => t.ticketId || t._id).join('; ')
                : 'None';

            // Check-in status (how many tickets were scanned)
            const scannedTickets = Array.isArray(reg.ticketIds)
                ? reg.ticketIds.filter(t => t.status === 'used').length
                : 0;
            const checkinStatus = `${scannedTickets}/${ticketsIssued}`;

            // Escape CSV values properly
            const escapeCSV = (value) => {
                const str = String(value);
                if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                    return `"${str.replace(/"/g, '""')}"`;
                }
                return str;
            };

            csvRows.push([
                reg.registrationId || reg._id,
                escapeCSV(name),
                email,
                username,
                quantity,
                status,
                registeredAt,
                ticketsIssued,
                escapeCSV(ticketIds),
                checkinStatus
            ].join(','));
        }

        const csvContent = csvRows.join('\n');
        const BOM = '\uFEFF'; // UTF-8 BOM for Excel compatibility

        // Set response headers for CSV download
        const sanitizedTitle = event.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const dateStr = event.start_at ? new Date(event.start_at).toISOString().split('T')[0] : '';
        const filename = `attendees_${sanitizedTitle}${dateStr ? '_' + dateStr : ''}.csv`;
        
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        
        // Log export action
        const userType = userIsAdmin ? 'Admin' : 'Organizer';
        console.log(`CSV export: ${userType} ${req.user.email} exported ${registrations.length} attendees for event ${event.title}`);

        return res.status(200).send(BOM + csvContent);

    } catch (e) {
        console.error('Error exporting attendees CSV:', e);
        return res.status(500).json({ 
            error: 'Failed to export attendee list',
            code: 'EXPORT_FAILED'
        });
    }
};

// Task #114: Admin functionality to moderate event listings

const { addComment } = require('../utility/comment_analysis');

exports.postComment = async (req, res) => {
    const { eventId } = req.params; 
    const { commentText } = req.body;

    try {
        await addComment(eventId, commentText);
        res.status(200).json({ message: "Comment added successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to add comment" });
    }
};

// Get events by moderation status (for admin dashboard)
exports.getEventsByModerationStatus = async (req, res) => {
    try {
        // Admin only
        if (!req.user) return res.status(401).json({ code: 'UNAUTHORIZED', message: 'Authentication required' });
        const admin = await Administrator.findOne({ email: req.user.email }).lean();
        if (!admin) return res.status(403).json({ code: 'FORBIDDEN', message: 'Admin access required' });

        const { status } = req.params;

        if (!status || !Object.values(MODERATION_STATUS).includes(status)) {
            return res.status(400).json({ 
                error: `Invalid moderation status. Must be one of: ${Object.values(MODERATION_STATUS).join(', ')}` 
            });
        }

        const events = await Event.find({ moderationStatus: status })
            .populate('organization', 'name status organizer contact')
            .select('title description start_at category moderationStatus moderationNotes moderatedBy moderatedAt')
            .sort({ createdAt: -1 })
            .lean();

        return res.status(200).json({
            message: `Events with moderation status '${status}' fetched successfully`,
            total: events.length,
            events
        });

    } catch (e) {
        console.error('Error fetching events by moderation status:', e);
        return res.status(500).json({ error: 'Failed to fetch events' });
    }
};

// Get pending moderation events
exports.getPendingModerationEvents = async (req, res) => {
    try {
        // Admin only
        if (!req.user) return res.status(401).json({ code: 'UNAUTHORIZED', message: 'Authentication required' });
        const admin = await Administrator.findOne({ email: req.user.email }).lean();
        if (!admin) return res.status(403).json({ code: 'FORBIDDEN', message: 'Admin access required' });

        const events = await Event.find({ moderationStatus: MODERATION_STATUS.PENDING_APPROVAL })
            .populate('organization', 'name status organizer contact')
            .select('title description start_at category')
            .sort({ createdAt: 1 })
            .lean();

        return res.status(200).json({
            message: 'Pending moderation events fetched successfully',
            total: events.length,
            events
        });

    } catch (e) {
        console.error('Error fetching pending moderation events:', e);
        return res.status(500).json({ error: 'Failed to fetch pending events' });
    }
};