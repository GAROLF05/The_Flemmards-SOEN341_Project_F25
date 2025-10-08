/* NOTE: This file should only contain the following:
- Calls to Models (Ticket, User, etc..)
- Functions that handle requests async (req,res)
- Logic for data validation, creation, modification
- Responses sent back to the frontend with res.json({....})
*/

// Models of DB
const Administrator = require('../models/Administrators');
const User = require('../models/User');
const { Event, EVENT_STATUS } = require('../models/Event');
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

        // Authenticate User
        if (!req.user) {
            return res.status(401).json({ code: 'UNAUTHORIZED', message: 'Authentication required' });
        }
        try {
            // If user in session doesn't match user in registration then...
            if (registration.user.toString() !== req.user._id.toString()) {
                return res.status(403).json({ code: 'FORBIDDEN', message: 'Registration does not belong to current user' });
            }
        } catch (e) {
            return res.status(400).json({ code: 'BAD_REQUEST', message: 'Invalid registration user' });
        }

        // Prevents creating duplicate tickets for one registration by comparing how many tickets have the same registration ID
        // and how many tickets were registered in Registration DB
        const existingCount = await Ticket.countDocuments({ registration: registration._id });
        if (existingCount >= registration.quantity) {
            return res.status(409).json({ code: 'ALREADY_REGISTERED', message: 'Tickets already issued for this registration' });
        }
        
        
        if (existingCount + qty > registration.quantity) {
            return res.status(409).json({ code: 'QUANTITY_EXCEEDS', message: 'Requested quantity exceeds registration allocation' });
        }

        /* Light event validation (reservation should be done earlier via registerToEvent) */
        const ev = await Event.findById(registration.event).select('status').lean();
        if (!ev) return res.status(400).json({ code: 'EVENT_NOT_FOUND', message: 'Event not found' });
        if (ev.status !== EVENT_STATUS.UPCOMING) return res.status(403).json({ code: 'CLOSED', message: 'Event is not open for ticketing' });

        // Create tickets based on registration quantity (create, generate QR, save)
        const createdTicketIds = [];
        const qrTickets = [];

        for (let i = 0; i < qty; i++){
            const t = await Ticket.create({ registration: registration._id }); // create initial ticket
            createdTicketIds.push(t._id);
            // generate QR from a stable payload (ticket.code preferred)
            const payload = t.ticketId || t.code || String(t._id);
            const dataUrl = await qrcode.toDataURL(payload);
            t.qrDataUrl = dataUrl;
            await t.save();
            qrTickets.push({ id: t._id, ticketId: t.ticketId, code: t.code, qrDataUrl: dataUrl });
        }

    
        // Update registration to record that tickets were created 
        try {
            await Registration.updateOne(
                { _id: registration._id },
                {
                    $push: { ticketIds: { $each: createdTicketIds } },
                    $inc: { ticketsIssued: createdTicketIds.length }
                }
            );
        } catch (e) {
            console.error('Failed to update registration with ticket IDs', e);
        }

        // Also update the User document to include this registration in events_registered (avoid duplicates)
        try {
            await User.updateOne(
                { _id: registration.user },
                { $addToSet: { events_registered: registration._id } }
            );
        } catch (e) {
            console.error('Failed to update user.events_registered', e);
        }

        return res.status(201).json({ created: qrTickets.length, tickets: qrTickets });

    } catch(e){
        console.error('Error:', e);
        return res.status(500).json({error: 'Internal server error'})
    }

}

/* CORE CRUDS */

// Get a ticket by ID
exports.getTicketsById = async (req,res)=>{
    try{
        const {ticketID} = req.params;
        if (!ticketID)
            return res.status(400).json({error: "Ticket id could not be processed"})
        
        const ticket = await Ticket.findById(ticketID)
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
            path: 'registration',
            select: 'registrationId quantity'
        }).lean().exec();
        

        if (!ticket) return res.status(404).json({ 
            error: 'Ticket not found' 
        });

        return res.status(200).json({ ticket });

    } catch(e){
        console.error(e);
        res.status(500).json({error: "Failed to fetch ticket"})
    }
}

// Get all tickets
exports.getAllTickets = async (req,res)=>{
    try{
        const tickets = await Ticket.find()
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
            path: 'registration',
            select: 'registrationId quantity'
        }).lean().exec();

        res.status(200).json({
            count: tickets.length,
            tickets
        });
    } catch(e){
        console.error(e);
        res.status(500).json({error: "Failed to fetch tickets"})
    }
};

exports.updateTicket = async (req,res)=>{

}

exports.deleteTicket = async (req,res)=>{

}



/* VALIDATION */
exports.validateTicket = async (req,res)=>{ 

}

exports.markTicketAsUsed = async (req,res)=>{

}

exports.regenerateQrCode = async (req,res)=>{
    try{

    } catch(e){
        console.error(e);
        return res.status(500).json({error:"Qr code could not be regenerated"});
    }
}

/* ANALYTICS + ADMIN */
exports.getTicketsByEvent = async (req,res)=>{
    try{
        const {eventId} = req.params;
        if (!eventId)
            return res.status(400).json({error: "TicketId required"});

        if (!mongoose.Types.ObjectId.isValid(eventId))
            return res.status(400).json({ error: "Invalid event ID format" });

        const eventTickets = await Ticket.find({event: eventId})
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

// Get all tickets to events user registered to
exports.getTicketsByUser = async (req,res)=>{
    try{
        const {userId} = req.params;
        if (!userId)
            return res.status(400).json({error: "UserId required"});
        

        if (!mongoose.Types.ObjectId.isValid(userId))
            return res.status(400).json({ error: "Invalid user ID format" });

        const userTickets = await Ticket.find({user: userId})
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

exports.countTickets = async (req,res)=>{

}

// Reserve capacity and create a registration for an event
exports.registerToEvent = async (req, res) => {
    try {
        // Check if there's user
        if (!req.user) 
            return res.status(401).json({ 
                code: 'UNAUTHORIZED', 
                message: 'Authentication required' 
            });

        const { eventId, quantity = 1 } = req.body || {};
        const qty = Number(quantity);

        // Check if event id is valid
        if (!mongoose.Types.ObjectId.isValid(eventId)) 
            return res.status(400).json({ 
                code: 'BAD_REQUEST', 
                message: 'Invalid eventId' 
            });

        // Check if qty is valid
        if (!Number.isInteger(qty) || qty < 1) 
            return res.status(400).json({ 
                code: 'BAD_REQUEST', 
                message: 'Quantity invalid' 
            });

        // Pre-check: avoid duplicate registration before touching event capacity
        const existingRegistration = await Registration.findOne({ user: req.user._id, event: eventId }).lean();
        if (existingRegistration) {
            return res.status(409).json({ code: 'ALREADY_REGISTERED', message: 'User already registered for this event', registration: existingRegistration });
        }

        // Update event capacity iif it is upcoming and matches eventId
        const updatedEvent = await Event.findOneAndUpdate(
            { _id: eventId, capacity: { $gte: qty }, status: EVENT_STATUS.UPCOMING },
            { $inc: { capacity: -qty } },
            { new: true }
        );

        // Upcoming event not found
        if (!updatedEvent) {
            const ev = await Event.findById(eventId).select('capacity status').lean();

            // Event not found
            if (!ev) 
                return res.status(404).json({ 
                    code: 'EVENT_NOT_FOUND', 
                    message: 'Event not found' 
                });

            // Event not upcoming (closed, ongoing, completed, or cancelled)
            if (ev.status !== EVENT_STATUS.UPCOMING)
                return res.status(403).json({ 
                    code: 'CLOSED', 
                    message: `Event is ${ev.status}` 
                });

            // Event full (no capacity left)
            return res.status(409).json({ 
                code: 'FULL', 
                message: 'Not enough capacity' 
            });
        }


        // Try to create a unique registration for this (user,event)
        try {
            const registration = await Registration.create({
                user: req.user._id,
                event: eventId,
                quantity: qty,
                status: Registration.REGISTRATION_STATUS ? Registration.REGISTRATION_STATUS.PAID : 'paid'
            });

            // Add registration to user.events_registered
            await User.updateOne(
                { _id: req.user._id }, 
                { $addToSet: { 
                    events_registered: registration._id 
                }}
            );

            return res.status(201).json({ 
                registrationId: registration.registrationId, 
                registration 
            });

        } catch (e) {
            // If registration exists due to unique index on (user,event), rollback event capacity and return conflict
            try { 
                // Change capacity back to original if registration creation fails
                await Event.findByIdAndUpdate(
                    eventId, 
                    { $inc: { capacity: qty } }
                ); 
            } catch (er) { 
                console.error('Rollback failed', er); 
            }

            return res.status(409).json({ 
                code: 'ALREADY_REGISTERED', 
                message: 'User already registered for this event' 
            });
        }

    } catch (e) {
        console.error(e);
        return res.status(500).json({ 
            code: 'INTERNAL_ERROR', 
            message: 'Failed to register to event' 
        });
    }
}