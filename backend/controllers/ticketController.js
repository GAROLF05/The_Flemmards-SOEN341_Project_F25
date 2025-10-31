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
const { User } = require('../models/User');
const { Event, EVENT_STATUS, CATEGORY } = require('../models/Event');
const Organization = require('../models/Organization');
const Registration = require('../models/Registrations');
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


// API endpoint to Create a Ticket
exports.createTicket = async(req, res) =>{
    try{
                
        // Handle both JSON and text/plain content types
        let requestBody = req.body;
        if (typeof req.body === 'string' && req.get('Content-Type') === 'text/plain') {
            try {
                requestBody = JSON.parse(req.body);
            } catch (e) {
                return res.status(400).json({error: 'Invalid JSON in request body'});
            }
        }
        
        // Fetch the registration ID of the user and verify the quantity sent by client-side server
        const {registrationId, quantity = 1} = requestBody || {};

        if(!registrationId)
            return res.status(400).json({ code: 'BAD_REQUEST', message: 'Registration ID is required' });
        
        const qty = Number(quantity);
        if (!Number.isInteger(qty) || qty < 1)
            return res.status(400).json({ code: 'BAD_REQUEST', message: 'Quantity invalid' });



        // registration = ObjectId || human registrationId (REG-...)
        let registration = null;
        if (mongoose.Types.ObjectId.isValid(registrationId)) { // Default _id
            registration = await Registration.findById(registrationId);
        }
        if (!registration) { // REG-XXXX... ID
            registration = await Registration.findOne({ registrationId: registrationId });
        }
        if (!registration) { // No registration info found
            return res.status(404).json({ code: 'NOT_FOUND', message: 'Registration not found' });
        }
        // If there's a waitlist...
        if (registration.status && registration.status.toLowerCase() === 'waitlisted') {
            return res.status(403).json({
                code: 'WAITLISTED',
                message: 'Tickets cannot be issued while registration is waitlisted. Please wait until you are confirmed.'
            });
        }

        // Authenticate user and ensure owner
        try { const { assertAuthenticated, ensureAdminOrOwner } = require('../utils/authHelpers'); assertAuthenticated(req); await ensureAdminOrOwner(req, registration.user); } catch (e) {
            return res.status(e.status || 401).json({ code: e.code || 'UNAUTHORIZED', message: e.message });
        }

        /* Light event validation (reservation should be done earlier via registerToEvent) */
        const ev = await Event.findById(registration.event).select('status').lean();
        if (!ev) 
            return res.status(400).json({code: 'EVENT_NOT_FOUND', message: 'Event not found'});

        if (ev.status !== EVENT_STATUS.UPCOMING) 
            return res.status(403).json({code: 'CLOSED', message: 'Event is not open for ticketing'});
        
        if (new Date(ev.end_at) < Date.now())
            return res.status(403).json({ code: 'CLOSED', message: 'Event has already ended' });

        // Create tickets based on registration quantity (create, generate QR, save)
        const createdTicketIds = [];
        const qrTickets = [];

        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            // Reload the registration inside the session to avoid races
            const regInSession = await Registration.findById(registration._id).session(session);
            if (!regInSession) {
                await session.abortTransaction();
                session.endSession();
                return res.status(404).json({ code: 'NOT_FOUND', message: 'Registration not found' });
            }

            // Count existing tickets within the session and validate
            const existingCount = await Ticket.countDocuments({ registration: regInSession._id }).session(session);
            if (existingCount >= (regInSession.quantity || 0)) {
                await session.abortTransaction();
                session.endSession();
                return res.status(409).json({ code: 'ALREADY_REGISTERED', message: 'Tickets already issued for this registration' });
            }

            if (existingCount + qty > (regInSession.quantity || 0)) {
                await session.abortTransaction();
                session.endSession();
                return res.status(409).json({ code: 'QUANTITY_EXCEEDS', message: 'Requested quantity exceeds registration allocation' });
            }
            // create tickets in the session (no QR generation here to keep transaction short)
            for (let i = 0; i < qty; i++){
                const t = await Ticket.create([{ 
                    user: registration.user,
                    event: registration.event,                
                    registration: registration._id, 
                }], { session }); // create initial ticket
                const ticketDoc = t[0];
                createdTicketIds.push(ticketDoc._id);
                // collect a minimal ticket info placeholder; QR will be generated after commit
                qrTickets.push({ id: ticketDoc._id, ticketId: ticketDoc.ticketId, code: ticketDoc.code, qrDataUrl: null });
            }

            // Update registration to record that ticket IDs were created 
            await Registration.updateOne(
                { _id: registration._id },
                {
                    $push: { ticketIds: { $each: createdTicketIds } },
                    $inc: { ticketsIssued: createdTicketIds.length }
                },
                { session }
            );

            await session.commitTransaction();
            session.endSession();
            // After commit, generate QR codes and persist them outside the transaction to avoid long transactions
            for (let i = 0; i < qrTickets.length; i++) {
                try {
                    const tId = qrTickets[i].id;
                    const ticketDoc = await Ticket.findById(tId);
                    if (!ticketDoc) continue;
                    const payload = ticketDoc.code || ticketDoc.ticketId || String(ticketDoc._id);
                    const dataUrl = await qrcode.toDataURL(payload);
                    ticketDoc.qrDataUrl = dataUrl;
                    await ticketDoc.save();
                    qrTickets[i].qrDataUrl = dataUrl;
                } catch (e) {
                    // non-fatal: log and continue; tickets were created successfully
                    console.error('QR generation failed for ticket', qrTickets[i].id, e.message);
                }
            }

            return res.status(201).json({ created: qrTickets.length, tickets: qrTickets });
        } catch (e) {
            await session.abortTransaction();
            session.endSession();
            console.error('Error creating tickets, transaction aborted:', e);
            return res.status(500).json({ error: 'Failed to create tickets' });
        }

    } catch(e){
        console.error('Error:', e);
        return res.status(500).json({error: 'Internal server error'})
    }

}

/* CORE CRUDS */

// API endpoint to Get tickets by _id
exports.getTicketsById = async (req,res)=>{
    try{
    // Require authentication to view a ticket (owner or admin)
    try { const { assertAuthenticated } = require('../utils/authHelpers'); assertAuthenticated(req); } catch (e) { return res.status(e.status || 401).json({ code: e.code || 'UNAUTHORIZED', message: e.message }); }
        const {ticket_id} = req.params;
        if (!ticket_id)
            return res.status(400).json({error: "ticket_id could not be processed"})
        if (!mongoose.Types.ObjectId.isValid(ticket_id))
            return res.status(400).json({error: "Invalid ticket id format"});
        
        const ticket = await Ticket.findById(ticket_id)
        .populate({
            path: 'user', 
            select: 'name email'})
        .populate({
            path: 'event', 
            select: 'organization title start_at end_at',
            populate:{
                path: 'organization',
                select: 'name website',
            }})
        .populate({
            path: 'registration',
            select: 'registrationId quantity'
        }).lean().exec();
        

        if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

        // Owner or admin may view
    try { const { ensureAdminOrOwner } = require('../utils/authHelpers'); await ensureAdminOrOwner(req, ticket.user); } catch (e) { return res.status(e.status || 401).json({ code: e.code || 'UNAUTHORIZED', message: e.message }); }

        return res.status(200).json({ ticket });

    } catch(e){
        console.error(e);
        res.status(500).json({error: "Failed to fetch ticket"})
    }
}

// API endpoint to Get tickets by ticketId
exports.getTicketsByTicketId = async (req,res)=>{
    try{
    // Require authentication to view a ticket (owner or admin)
    try { const { assertAuthenticated } = require('../utils/authHelpers'); assertAuthenticated(req); } catch (e) { return res.status(e.status || 401).json({ code: e.code || 'UNAUTHORIZED', message: e.message }); }
        const {ticketID} = req.params;
        if (!ticketID)
            return res.status(400).json({error: "TicketId could not be processed"})
        
        const ticket = await Ticket.findOne({ticketId: ticketID})
        .populate({
            path: 'user', 
            select: 'name email'})
        .populate({
            path: 'event', 
            select: 'organization title start_at end_at',
            populate:{
                path: 'organization',
                select: 'name website',
            }})
        .populate({
            path: 'registration',
            select: 'registrationId quantity'
        }).lean().exec();
        

        if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

    try { const { ensureAdminOrOwner } = require('../utils/authHelpers'); await ensureAdminOrOwner(req, ticket.user); } catch (e) { return res.status(e.status || 401).json({ code: e.code || 'UNAUTHORIZED', message: e.message }); }

        return res.status(200).json({ ticket });

    } catch(e){
        console.error(e);
        res.status(500).json({error: "Failed to fetch ticket"})
    }
}




// API Endpoint to cancel ticket
exports.cancelTicket = async (req,res)=>{
    try {
        const { ticket_id } = req.params;

        if (!ticket_id)
            return res.status(400).json({ error: "ticket_id required" });

        // Find ticket
        const ticket = await Ticket.findById(ticket_id)
        .populate("event")
        .populate("registration");

        if (!ticket)
            return res.status(404).json({ error: "Ticket not found" });

        // If already cancelled or used, prevent duplicate cancellation
        if (ticket.status === "cancelled")
            return res.status(400).json({ error: "Ticket already cancelled" });
        if (ticket.status === "used")
            return res.status(400).json({ error: "Used tickets cannot be cancelled" });

        
        // Owner or admin may cancel
        const { ensureAdminOrOwner } = require('../utils/authHelpers');
        try { await ensureAdminOrOwner(req, ticket.user); } catch (e) { return res.status(e.status || 401).json({ code: e.code || 'UNAUTHORIZED', message: e.message }); }

        // Perform cancellation and related updates in a transaction
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            ticket.status = "cancelled";
            await ticket.save({ session });

            // Find the event (defensive id extraction)
            const event_id = ticket.event && (ticket.event._id ? ticket.event._id : ticket.event);
            const event = await Event.findById(event_id).session(session);
            if (!event) {
                await session.abortTransaction();
                session.endSession();
                return res.status(400).json({error: "Event could not be found with ticket"});
            }

            // Find the registration (defensive id extraction)
            const reg_id = ticket.registration && (ticket.registration._id ? ticket.registration._id : ticket.registration);
            const reg = await Registration.findById(reg_id).session(session);
            if (!reg) {
                await session.abortTransaction();
                session.endSession();
                return res.status(400).json({error: "Registration info could not be found with ticket"});
            }

            // Remove ticket from registration and decrement ticketsIssued safely
            await Registration.updateOne(
                { _id: reg._id },
                { 
                    $pull: { ticketIds: ticket._id },
                    $inc: { ticketsIssued: -1 }
                },
                { session }
            );

            // Defensive clamp to avoid negative ticketsIssued
            await Registration.updateOne(
                { _id: reg._id, ticketsIssued: { $lt: 0 } },
                { $set: { ticketsIssued: 0 } },
                { session }
            );

            // Change event capacity (increase by 1 per ticket)
            await Event.updateOne({ _id: event._id }, { $inc: { capacity: 1 } }, { session });

            await session.commitTransaction();
            session.endSession();

            // Try to promote waitlisted users after capacity increase
            try {
                const { promoteWaitlistForEvent } = require('./eventController');
                await promoteWaitlistForEvent(event._id);
            } catch (promoteError) {
                console.log('Waitlist promotion failed (non-critical):', promoteError.message);
            }

            return res.status(200).json({ message: "Ticket cancelled successfully", ticket });
        } catch (e) {
            await session.abortTransaction();
            session.endSession();
            console.error(e);
            return res.status(500).json({ error: "Failed to cancel ticket" });
        }

    } catch (e) {
        console.error(e);
        return res.status(500).json({ error: "Failed to cancel ticket" });
    }
}


/* VALIDATION */

// API endpoint to validate ticket
exports.validateTicket = async (req,res)=>{ 
    try{
        const { code } = req.query; // The code from QR

        if (!code)
            return res.status(400).json({ error: "Ticket code required" });

        const ticket = await Ticket.findOne({ code: code })
            .populate("event user registration");

        if (!ticket)
            return res.status(404).json({ error: "Invalid or non-existent ticket" });

        if (ticket.status === "used")
            return res.status(409).json({ error: "Ticket already used" });

        if (ticket.status === "cancelled")
            return res.status(403).json({ error: "Ticket has been cancelled" });

        // Otherwise valid
        return res.status(200).json({
            message: "Ticket is valid",
            ticket,
        });

    } catch(e){
        console.error(e);
        return res.status(500).json({error: "Could not validate ticket"})
    }
}

// API endpoint to mark ticket as used
exports.markTicketAsUsed = async (req,res)=>{
    try{
        const {ticket_id} = req.params;
        if (!ticket_id)
            return res.status(400).json({error: "ticket_id required"});

        if (!mongoose.Types.ObjectId.isValid(ticket_id))
            return res.status(400).json({error: "Invalid ticket_id format"});

        // Only admins (scanner) may mark tickets as used
        const { ensureAdmin } = require('../utils/authHelpers');
        try { await ensureAdmin(req); } catch (e) { return res.status(e.status || 401).json({ code: e.code || 'UNAUTHORIZED', message: e.message }); }

        const ticket = await Ticket.findByIdAndUpdate(ticket_id, {status: "used"}, {new: true});
        if (!ticket) return res.status(404).json({error: "Ticket not found"});

        return res.status(200).json({
            message: "Ticket marked as used",
            ticket,
        });

        
    } catch(e){
        console.error(e);
        return res.status(500).json({error: "Failed to mark ticket as used"})
    }

}

// Task #64: API to scan and use ticket with QR re-use detection
exports.scanTicket = async (req, res) => {
    try {
        const { code } = req.body;
        const scannedBy = req.user?.email || 'Unknown';

        if (!code) {
            return res.status(400).json({ error: "Ticket code required" });
        }

        // Find ticket by code
        const ticket = await Ticket.findOne({ code })
            .populate({
                path: 'event',
                select: 'title start_at end_at location organization'
            })
            .populate({
                path: 'user',
                select: 'name email'
            });

        if (!ticket) {
            return res.status(404).json({ 
                error: "Invalid or non-existent ticket",
                code: 'TICKET_NOT_FOUND'
            });
        }

        // Task #64: Check if ticket was already used (QR re-use detection)
        if (ticket.status === "used") {
            // Alert administrators about QR code re-use attempt
            console.error(`[SECURITY ALERT] QR code re-use attempt detected!`);
            console.error(`[SECURITY ALERT] Ticket ID: ${ticket.ticketId}, Code: ${code}`);
            console.error(`[SECURITY ALERT] Previously scanned at: ${ticket.scannedAt}`);
            console.error(`[SECURITY ALERT] Previously scanned by: ${ticket.scannedBy}`);
            console.error(`[SECURITY ALERT] New scan attempt by: ${scannedBy}`);
            console.error(`[SECURITY ALERT] User: ${ticket.user?.name} (${ticket.user?.email})`);
            console.error(`[SECURITY ALERT] Event: ${ticket.event?.title}`);

            return res.status(409).json({ 
                error: "Ticket already used - QR code re-use detected",
                code: 'TICKET_ALREADY_USED',
                alert: 'Administrators have been notified of this re-use attempt',
                ticketDetails: {
                    ticketId: ticket.ticketId,
                    scannedAt: ticket.scannedAt,
                    scannedBy: ticket.scannedBy,
                    currentAttemptBy: scannedBy
                }
            });
        }

        if (ticket.status === "cancelled") {
            return res.status(403).json({ 
                error: "Ticket has been cancelled",
                code: 'TICKET_CANCELLED'
            });
        }

        // Check if QR code has expired
        if (ticket.qr_expires_at && new Date(ticket.qr_expires_at) < new Date()) {
            return res.status(403).json({ 
                error: "QR code has expired",
                code: 'QR_EXPIRED',
                expiredAt: ticket.qr_expires_at
            });
        }

        // Mark ticket as used
        ticket.status = "used";
        ticket.scannedAt = new Date();
        ticket.scannedBy = scannedBy;
        await ticket.save();

        // Log successful scan
        console.log(`[TICKET SCAN] Ticket ${ticket.ticketId} scanned successfully by ${scannedBy}`);

        return res.status(200).json({
            message: "Ticket validated and marked as used",
            code: 'TICKET_VALID',
            ticket: {
                ticketId: ticket.ticketId,
                status: ticket.status,
                scannedAt: ticket.scannedAt,
                scannedBy: ticket.scannedBy,
                user: {
                    name: ticket.user?.name,
                    email: ticket.user?.email,
                },
                event: {
                    title: ticket.event?.title,
                    start_at: ticket.event?.start_at,
                    location: ticket.event?.location
                }
            }
        });

    } catch (e) {
        console.error('Error scanning ticket:', e);
        return res.status(500).json({ error: "Failed to scan ticket" });
    }
};

// API endpoint to regenerate QR code
exports.regenerateQrCode = async (req,res)=>{
    try{
        const {ticket_id} = req.params;
        if (!ticket_id)
            return res.status(400).json({error: "ticket_id required"});

        if(!mongoose.Types.ObjectId.isValid(ticket_id))
            return res.status(400).json({error: "Invalid ticket_id format"})

        // Owner or admin may regenerate QR
        const ticket = await Ticket.findById(ticket_id);
        if (!ticket) return res.status(404).json({error: "Ticket not found"})

        const { ensureAdminOrOwner } = require('../utils/authHelpers');
        try { await ensureAdminOrOwner(req, ticket.user); } catch (e) { return res.status(e.status || 401).json({ code: e.code || 'UNAUTHORIZED', message: e.message }); }

        const payload = ticket.code || ticket.ticketId || String(ticket._id);
        const dataUrl = await qrcode.toDataURL(payload);
        ticket.qrDataUrl = dataUrl;
        await ticket.save();

        return res.status(200).json({
            message: "QR code regenerated successfully",
            ticket: {
                id: ticket._id,
                ticketId: ticket.ticketId,
                qrDataUrl: dataUrl
            }
        });

    } catch(e){
        console.error(e);
        return res.status(500).json({error:"Qr code could not be regenerated"});
    }
}

/* ANALYTICS + ADMIN */

// API endpoint to get all tickets by events
exports.getTicketsByEvent = async (req,res)=>{
    try{
        // Require authentication
        if (!req.user) return res.status(401).json({ code: 'UNAUTHORIZED', message: 'Authentication required' });
        
        const {event_id} = req.params;
        if (!event_id)
            return res.status(400).json({error: "event_id required"});

        if (!mongoose.Types.ObjectId.isValid(event_id))
            return res.status(400).json({ error: "Invalid event_id format" });

        const eventTickets = await Ticket.find({event: event_id})
        .populate({
            path: 'user', 
            select: 'name email'})
        .populate({
            path: 'event', 
            select: 'organization title start_at end_at',
            populate:{
                path: 'organization',
                select: 'name website',
            }})
        .populate({
            path: 'registration',
            select: 'registrationId quantity'
        }).lean().exec();

        if (!eventTickets || eventTickets.length === 0)
            return res.status(404).json({ error: 'No tickets found for this event' });

        return res.status(200).json({
            count: eventTickets.length,
            tickets: eventTickets
        });


    } catch(e){
        console.error(e);
        return res.status(500).json({error:"Failed to fetch tickets"})
    }
}

// API endpoint to Get all tickets to events user registered to by _id of user
exports.getTicketsByUser = async (req,res)=>{
    try{
        // Require authentication
        if (!req.user) return res.status(401).json({ code: 'UNAUTHORIZED', message: 'Authentication required' });
        
        const {user_id} = req.params;
        if (!user_id)
            return res.status(400).json({error: "user_id required"});
        

        if (!mongoose.Types.ObjectId.isValid(user_id))
            return res.status(400).json({ error: "Invalid user_id format" });

        const userTickets = await Ticket.find({user: user_id})
        .populate({
            path: 'user', 
            select: 'name email'})
        .populate({
            path: 'event', 
            select: 'organization title start_at end_at',
            populate:{
                path: 'organization',
                select: 'name website',
            }})
        .populate({
            path: 'registration',
            select: 'registrationId quantity'
        }).lean().exec();

        if (!userTickets || userTickets.length === 0)
            return res.status(404).json({ error: 'No tickets found for this user' });

        return res.status(200).json({
            count: userTickets.length,
            tickets: userTickets
        });

        
    } catch(e){
        console.error(e);
        res.status(500).json({error: "Failed to fetch tickets"})
    }
}

// Task #58: Export attendee list as CSV (organizer or admin)
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

        // Check if user is admin or organizer of the event
        const { ensureAdminOrEventOrganizer } = require('../utils/authHelpers');
        try { 
            await ensureAdminOrEventOrganizer(req, event_id); 
        } catch (e) { 
            return res.status(e.status || 401).json({ 
                code: e.code || 'UNAUTHORIZED', 
                message: e.message 
            }); 
        }

        // Check if event exists
        const event = await Event.findById(event_id).lean();
        if (!event) {
            return res.status(404).json({ 
                error: 'Event not found',
                code: 'EVENT_NOT_FOUND'
            });
        }

        // Get all registrations for this event
        const registrations = await Registration.find({ event: event_id })
            .populate({
                path: 'user',
                select: 'name email'
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

        // Build CSV content
        const csvRows = [];
        
        // CSV Header
        csvRows.push([
            'Registration ID',
            'Name',
            'Email',
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

            csvRows.push([
                reg.registrationId || reg._id,
                `"${name}"`, // Quote in case name contains commas
                email,
                quantity,
                status,
                registeredAt,
                ticketsIssued,
                `"${ticketIds}"`,
                checkinStatus
            ].join(','));
        }

        const csvContent = csvRows.join('\n');

        // Set response headers for CSV download
        const filename = `attendees_${event.title.replace(/[^a-z0-9]/gi, '_')}_${event_id}_${Date.now()}.csv`;
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        
        // Log export action
        const userType = req.isAdmin ? 'Admin' : 'Organizer';
        console.log(`[AUDIT] ${userType} ${req.user.email} exported attendee list for event ${event.title} (ID: ${event_id})`);

        return res.status(200).send(csvContent);

    } catch (e) {
        console.error('Error exporting attendees CSV:', e);
        return res.status(500).json({ 
            error: 'Failed to export attendee list',
            code: 'EXPORT_FAILED'
        });
    }
};

