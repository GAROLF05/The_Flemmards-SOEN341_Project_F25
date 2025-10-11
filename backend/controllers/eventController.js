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
const User = require('../models/User');
const { Event, EVENT_STATUS, CATEGORY } = require('../models/Event');
const Organization = require('../models/Organization');
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

// API Endpoint to get all Events
exports.getAllEvents = async (req,res) => {
    try{
        // Only administrators can fetch all registrations
        if (!req.user) return res.status(401).json({ code: 'UNAUTHORIZED', message: 'Authentication required' });
        const admin = await Administrator.findOne({ email: req.user.email }).lean();
        if (!admin) return res.status(403).json({ code: 'FORBIDDEN', message: 'Admin access required' });

        const events = await Event.find()
            .select('organization title description start_at end_at capacity status registered_users waitlist')
            .populate({
                path: 'organization',
                select: 'name description website contact.email contact.phone contact.socials'
            })
            .populate({
                path: 'registered_users',
                select: 'name email student_id'
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

        return res.status(200).json({
            message: 'All events fetched successfully',
            total: events.length,
            events,
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
        if (!req.user) return res.status(401).json({ code: 'UNAUTHORIZED', message: 'Authentication required' });
        const admin = await Administrator.findOne({ email: req.user.email }).lean();
        if (!admin) return res.status(403).json({ code: 'FORBIDDEN', message: 'Admin access required' });

        const {event_id} =  req.params;
        if (!event_id)
            return res.status(400).json({error: "event_id is required"});
        if (!mongoose.Types.ObjectId.isValid(event_id))
            return res.status(400).json({error: "Invalid event id format"});

        const event = await Event.findById(event_id)
            .select('organization title description start_at end_at capacity status registered_users waitlist')
            .populate({
                path: 'organization',
                select: 'name description website contact.email contact.phone contact.socials'
            })
            .populate({
                path: 'registered_users',
                select: 'name email student_id'
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
    

        return res.status(200).json({
            message: 'Event fetched successfully',
            event
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
        .select('organization title description start_at end_at capacity status registered_users waitlist')
        .populate({
            path: 'organization',
            select: 'name description website contact.email contact.phone contact.socials'
        })
        .populate({
            path: 'registered_users',
            select: 'name email student_id'
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
    

        return res.status(200).json({
            message: 'Events fetched successfully',
            events
        });

    } catch(e){
        console.error(e);
        return res.status(500).json({error: "Failed to fetch events by organization"});
    }
}

// API Endpoint to get events by status
exports.getEventsByStatus = async (req,res) =>{
    try{

        const {status} = req.params;
        if (!status)
            return res.status(400).json({error: "status is required"});

        const events = await Event.find({status: status})
        .select('organization title description start_at end_at capacity status registered_users waitlist')
        .populate({
            path: 'organization',
            select: 'name description website contact.email contact.phone contact.socials'
        })
        .populate({
            path: 'registered_users',
            select: 'name email student_id'
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
    

        return res.status(200).json({
            message: 'Events fetched successfully',
            events
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
        .select('organization title description start_at end_at capacity status registered_users waitlist')
        .populate({
            path: 'organization',
            select: 'name description website contact.email contact.phone contact.socials'
        })
        .populate({
            path: 'registered_users',
            select: 'name email student_id'
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
    

        return res.status(200).json({
            message: 'Events fetched successfully',
            events
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
        .select('organization title description category start_at end_at capacity status location registered_users waitlist')
        .populate({
            path: 'organization',
            select: 'name description website contact.email contact.phone contact.socials'
        })
        .populate({
            path: 'registered_users',
            select: 'name email student_id'
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

        return res.status(200).json({
            message: `Events between ${start} and ${end} fetched successfully.`,
            total: events.length,
            events
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
            select: 'name student_id email'})
        .populate({
            path: 'event', 
            select: 'organization title start_at end_at',
            populate:{
            path: 'organization',
            select: 'name website',
        }})
        .populate({
            path: 'ticketIds',
            model: 'Ticket', 
            select: 'code qrDataUrl qr_expires_at status scannedAt scannedBy',
        })
        .sort({createdAt: -1})
        .lean()
        .exec();
        
        if (regs.length === 0)
            return res.status(404).json({error: "No registration found for this user"});

        const events = regs.map(r => ({
            event: r.event,
            status: r.status,
            quantity: r.quantity,
            ticketsIssued: r.ticketsIssued,
            registeredAt: r.createdAt,
        }));

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
        
        // Handle both JSON and text/plain content types
        let requestBody = req.body;
        if (typeof req.body === 'string' && req.get('Content-Type') === 'text/plain') {
            try {
                requestBody = JSON.parse(req.body);
            } catch (e) {
                return res.status(400).json({error: 'Invalid JSON in request body'});
            }
        }        

        const { organization, title, description, start_at, end_at, capacity = 0, category, location } = requestBody || {};

        if (!organization || !title || !start_at || !end_at) {
            return res.status(400).json({ error: 'organization, title, start_at and end_at are required' });
        }

        if (!mongoose.Types.ObjectId.isValid(organization)) {
            return res.status(400).json({ error: 'Invalid organization id format' });
        }

        const org = await Organization.findById(organization).lean();
        if (!org) return res.status(404).json({ error: 'Organization not found' });

        const eventDoc = await Event.create({
            organization,
            title,
            description,
            start_at: new Date(start_at),
            end_at: new Date(end_at),
            capacity: Number(capacity) || 0,
            category,
            location,
            status: EVENT_STATUS.UPCOMING,
        });

        return res.status(201).json({ message: 'Event created successfully', event: eventDoc });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ error: 'Failed to create event' });
    }

}

// API Endpoint to update an event
exports.updateEvent = async (req,res) => {

    try {
        const { event_id } = req.params;
        if (!event_id) return res.status(400).json({ error: 'event_id is required' });
        if (!mongoose.Types.ObjectId.isValid(event_id)) return res.status(400).json({ error: 'Invalid event_id format' });

        // Admin only
        if (!req.user) return res.status(401).json({ code: 'UNAUTHORIZED', message: 'Authentication required' });
        const admin = await Administrator.findOne({ email: req.user.email }).lean();
        if (!admin) return res.status(403).json({ code: 'FORBIDDEN', message: 'Admin access required' });

        const updates = {};
        const allowed = ['title','description','start_at','end_at','capacity','status','location','category'];
        for (const k of allowed) if (req.body[k] !== undefined) updates[k] = req.body[k];

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

            return res.status(200).json({ message: 'Event updated', event: updated });
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
        if (!req.user) return res.status(401).json({ code: 'UNAUTHORIZED', message: 'Authentication required' });
        const admin = await Administrator.findOne({ email: req.user.email }).lean();
        if (!admin) return res.status(403).json({ code: 'FORBIDDEN', message: 'Admin access required' });

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
        if (!req.user) return res.status(401).json({ code: 'UNAUTHORIZED', message: 'Authentication required' });
        const admin = await Administrator.findOne({ email: req.user.email }).lean();
        if (!admin) return res.status(403).json({ code: 'FORBIDDEN', message: 'Admin access required' });

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

        const event = await Event.findById(event_id)
        .select('organization title description start_at end_at capacity status registered_users waitlist')
        .populate({
            path: 'organization',
            select: 'name description website contact.email contact.phone contact.socials'
        })
        .populate({
            path: 'registered_users',
            select: 'name email student_id'
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

        if (!event.registered_users || event.registered_users.length === 0)
            return res.status(404).json({ error: "No confirmed attendees found for this event" });
    
        const attendees = event.registered_users.map(user => ({
            _id: user._id,
            name: user.name,
            username: user.username,
            email: user.email,
            student_id: user.student_id
        }));

        return res.status(200).json({
            message: `Confirmed attendees for event '${event.title}' fetched successfully`,
            event: {
                _id: event._id,
                title: event.title,
                start_at: event.start_at,
                end_at: event.end_at,
                capacity: event.capacity,
                organization: event.organization
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
        .select('organization title description start_at end_at capacity status registered_users waitlist')
        .populate({
            path: 'organization',
            select: 'name description website contact.email contact.phone contact.socials'
        })
        .populate({
            path: 'registered_users',
            select: 'name email student_id'
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

        if (!event.waitlist || event.waitlist.length === 0)
            return res.status(404).json({ error: "No waitlisted users/registration found for this event" });
    
        const waitlisted = event.waitlist.map(reg => ({
            registrationId: reg.registrationId,
            status: reg.status,
            quantity: reg.quantity,
            registeredAt: reg.createdAt,
            user: reg.user
                ? {
                    _id: reg.user._id,
                    first_name: reg.user.first_name,
                    last_name: reg.user.last_name,
                    email: reg.user.email,
                    student_id: reg.user.student_id
                }
                : null
        }));
        return res.status(200).json({
            message: `Confirmed waitlisted users for event '${event.title}' fetched successfully`,
            event: {
                _id: event._id,
                title: event.title,
                start_at: event.start_at,
                end_at: event.end_at,
                capacity: event.capacity,
                organization: event.organization
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

        return { promoted, remainingCapacity: event.capacity };
    } catch (e) {
        await session.abortTransaction();
        session.endSession();
        throw e;
    }
}