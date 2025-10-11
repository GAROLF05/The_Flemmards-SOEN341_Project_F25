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

// API Endpoint to register to an event
exports.registerToEvent = async (req, res) => {
    try {
        
        // Check if user allowed
        if (!req.user)
            return res.status(401).json({
                code: 'UNAUTHORIZED',
                message: 'Authentication required'
            });

        const { eventId, quantity = 1 } = req.body || {};
        const qty = Number(quantity);

        // Validate event_id
        if (!mongoose.Types.ObjectId.isValid(eventId))
            return res.status(400).json({
                code: 'BAD_REQUEST',
                message: 'Invalid eventId'
            });

        // Validate qty 
        if (!Number.isInteger(qty) || qty < 1)
            return res.status(400).json({
                code: 'BAD_REQUEST',
                message: 'Quantity invalid'
            });

        // Avoid duplicate registration
        const existingRegistration = await Registration.findOne({
            user: req.user._id,
            event: eventId
        }).lean();

        if (existingRegistration) {
            return res.status(409).json({
                code: 'ALREADY_REGISTERED',
                message: 'User already registered for this event',
                registration: existingRegistration
            });
        }

        // Fetch event to check its capacity and status
        const event = await Event.findById(eventId);
        if (!event)
            return res.status(404).json({
                code: 'EVENT_NOT_FOUND',
                message: 'Event not found'
            });

        if (event.status !== EVENT_STATUS.UPCOMING)
            return res.status(403).json({
                code: 'CLOSED',
                message: `Event is ${event.status}`
            });

        // Determine registration type (confirmed vs waitlisted)
        let registrationStatus = 'confirmed';
        if (qty> event.capacity) {
            registrationStatus = 'waitlisted';
        }

        // Use a transaction to create registration and update event atomically
        const session = await mongoose.startSession();
        session.startTransaction();
        let registration;
        try {
            registration = await Registration.create([
                {
                    user: req.user._id,
                    event: eventId,
                    quantity: qty,
                    status: registrationStatus
                }
            ], { session });
            registration = registration[0];

            // Update event depending on registration type
            if (registrationStatus === 'confirmed') {
                // atomic decrement and addToSet to prevent duplicates
                await Event.updateOne(
                    { _id: event._id },
                    { $inc: { capacity: -qty }, $addToSet: { registered_users: req.user._id } },
                    { session }
                );
            } else {
                // push registration to waitlist
                await Event.updateOne(
                    { _id: event._id },
                    { $push: { waitlist: registration._id } },
                    { session }
                );
            }

            await session.commitTransaction();
            session.endSession();
        } catch (e) {
            await session.abortTransaction();
            session.endSession();
            throw e;
        }

        // Final response
        return res.status(201).json({
            code: registrationStatus === 'confirmed' ? REGISTRATION_STATUS.CONFIRMED : REGISTRATION_STATUS.WAITLISTED,
            message: registrationStatus === 'confirmed'
                ? 'Registration confirmed successfully!'
                : 'Event is full — you have been added to the waitlist.',
            registration
        });

    } catch (e) {
        console.error(e);
        return res.status(500).json({
            code: 'INTERNAL_ERROR',
            message: 'Failed to register to event'
        });
    }
};

exports.getAllRegistrations = async (req,res)=>{
    try{
        // Only administrators can fetch all registrations
        if (!req.user) return res.status(401).json({ code: 'UNAUTHORIZED', message: 'Authentication required' });
        const admin = await Administrator.findOne({ email: req.user.email }).lean();
        if (!admin) return res.status(403).json({ code: 'FORBIDDEN', message: 'Admin access required' });
        const reg = await Registration.find()
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
        }).lean().exec();

        return res.status(200).json({
            count: reg.length,
            reg,
        });

    } catch(e){
        console.error(e);
        return res.status(500).json({error: "Failed to fetch all registrations"});
    }
};

exports.getRegistrationById = async (req,res)=>{
    try{
        const {reg_id} = req.params;

        // Registration id validity
        if (!reg_id)
            return res.status(400).json({error: "reg_id is required"});
        if (!mongoose.Types.ObjectId.isValid(reg_id))
            return res.status(400).json({error: "Invalid registration id format"});
        
    const reg = await Registration.findById(reg_id)
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
        }).lean().exec();

        if (!reg) return res.status(404).json({error: "Registration not found"});

        // Owner or admin can access
        if (!req.user) return res.status(401).json({ code: 'UNAUTHORIZED', message: 'Authentication required' });
        const isOwner = reg.user && reg.user.toString() === req.user._id.toString();
        const admin = await Administrator.findOne({ email: req.user.email }).lean();
        if (!isOwner && !admin) return res.status(403).json({ code: 'FORBIDDEN', message: 'Access denied' });

        return res.status(200).json({ registration: reg });

    } catch(e){
        console.error(e);
        return res.status(500).json({error: "Failed to fetch all registrations"});
    }
}

exports.getRegistrationByRegId = async (req,res)=>{
    try{
        const {registrationId} = req.params;
        
        // registrationId validity
        if (!registrationId)
            return res.status(400).json({error: "registrationId is required"});
        
    const reg = await Registration.findOne({registrationId: registrationId})
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
        }).lean().exec();

        if (!reg) return res.status(404).json({error: "Registration not found"});

        if (!req.user) return res.status(401).json({ code: 'UNAUTHORIZED', message: 'Authentication required' });
        const isOwner = reg.user && reg.user.toString() === req.user._id.toString();
        const admin = await Administrator.findOne({ email: req.user.email }).lean();
        if (!isOwner && !admin) return res.status(403).json({ code: 'FORBIDDEN', message: 'Access denied' });

        return res.status(200).json({ registration: reg });

    } catch(e){
        console.error(e);
        return res.status(400).json({error: "Failed to fetch registration"});
    }
}

exports.getRegistrationByUser = async (req,res)=>{
    try{
        const {user_id} = req.params;
        
        // registrationId validity
        if (!user_id)
            return res.status(400).json({error: "user_id is required"});
        if (!mongoose.Types.ObjectId.isValid(user_id))
            return res.status(400).json({error: "Invalid user_id format"});
        
    // Only owner (same user) or admin can fetch registrations for a user
    if (!req.user) return res.status(401).json({ code: 'UNAUTHORIZED', message: 'Authentication required' });
    const admin = await Administrator.findOne({ email: req.user.email }).lean();
    if (req.user._id.toString() !== user_id && !admin) return res.status(403).json({ code: 'FORBIDDEN', message: 'Access denied' });

    const reg = await Registration.find({user: user_id})
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
        }).lean().exec();

        if (!reg) return res.status(404).json({error: "Registration not found"});

        return res.status(200).json({ count: reg.length, reg });

    } catch(e){
        console.error(e);
        return res.status(400).json({error: "Failed to fetch registration"});
    }
}

exports.getRegistrationByEvent = async (req,res)=>{
    try{
        const {event_id} = req.params;
        
        // registrationId validity
        if (!event_id)
            return res.status(400).json({error: "event_id is required"});
        if (!mongoose.Types.ObjectId.isValid(event_id))
            return res.status(400).json({error: "Invalid event_id format"});
        
    // Only administrators can fetch registrations by event
    if (!req.user) return res.status(401).json({ code: 'UNAUTHORIZED', message: 'Authentication required' });
    const admin = await Administrator.findOne({ email: req.user.email }).lean();
    if (!admin) return res.status(403).json({ code: 'FORBIDDEN', message: 'Admin access required' });

    const reg = await Registration.find({event: event_id})
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
        }).lean().exec();

        if (!reg) return res.status(404).json({error: "Registration not found"});

        return res.status(200).json({ count: reg.length, reg });

    } catch(e){
        console.error(e);
        return res.status(400).json({error: "Failed to fetch registration"});
    }
}

exports.updateRegistration = async (req,res)=>{
    try{
        const { reg_id } = req.params;
        const { quantity } = req.body || {};

        // Basic validation
        if (!req.user) 
            return res.status(401).json({ code: 'UNAUTHORIZED', message: 'Authentication required' });
        if (!reg_id) 
            return res.status(400).json({ error: 'reg_id is required' });
        if (!mongoose.Types.ObjectId.isValid(reg_id)) 
            return res.status(400).json({ error: 'Invalid registration id format' });

        const newQty = Number(quantity);
        if (!Number.isInteger(newQty) || newQty < 1) 
            return res.status(400).json({ error: 'Quantity invalid' });

        const reg = await Registration.findById(reg_id);
        if (!reg) 
            return res.status(404).json({ error: 'Registration not found' });

        // Only the owner (or admins in future) can update
        if (reg.user.toString() !== req.user._id.toString())
            return res.status(403).json({ code: 'FORBIDDEN', message: 'Registration does not belong to current user' });

        // Fetch event
        const event = await Event.findById(reg.event);
        if (!event) 
            return res.status(400).json({ error: 'Event could not be found with registration' });

        const oldQty = reg.quantity || 0;
        const delta = newQty - oldQty;


        // Use a session to update registration and event atomically when needed
        const session = await mongoose.startSession();
        session.startTransaction();
        let deletedTicketsCount = 0;
        try {
            // If increasing quantity on a confirmed registration, ensure capacity
            if (reg.status === REGISTRATION_STATUS.CONFIRMED && delta > 0) {
                const refreshed = await Event.findById(reg.event).session(session);
                if (refreshed.capacity < delta) {
                    await session.abortTransaction();
                    session.endSession();
                    return res.status(409).json({ code: 'FULL', message: 'Not enough capacity to increase quantity' });
                }
                await Event.updateOne({ _id: refreshed._id }, { $inc: { capacity: -delta } }, { session });
            }

            // If decreasing quantity and tickets were already issued, remove extra tickets
            if (newQty < (reg.ticketsIssued || 0)) {
                const toRemove = (reg.ticketIds || []).slice(newQty);
                if (toRemove.length > 0) {
                    await Ticket.deleteMany({ _id: { $in: toRemove } }).session(session);
                    deletedTicketsCount = toRemove.length;
                    // trim arrays and counters on the registration doc
                    reg.ticketIds = (reg.ticketIds || []).slice(0, newQty);
                    reg.ticketsIssued = Math.max(0, (reg.ticketsIssued || 0) - deletedTicketsCount);
                }
            }

            // Update registration quantity
            reg.quantity = newQty;
            await reg.save({ session });

            await session.commitTransaction();
            session.endSession();
        } catch (e) {
            await session.abortTransaction();
            session.endSession();
            throw e;
        }

        return res.status(200).json({ message: 'Registration updated', registration: reg, deletedTicketsCount, eventCapacity: event.capacity });

    } catch (e) {
        console.error(e);
        return res.status(500).json({ error: 'Failed to update registration' });
    }
}

exports.cancelRegistration = async (req,res)=>{
    try{
        const { reg_id } = req.params;

        if (!req.user) 
            return res.status(401).json({ code: 'UNAUTHORIZED', message: 'Authentication required' });
        if (!reg_id) 
            return res.status(400).json({ error: 'reg_id is required' });
        if (!mongoose.Types.ObjectId.isValid(reg_id)) return res.status(400).json({ error: 'Invalid registration id format' });

        const reg = await Registration.findById(reg_id);
        if (!reg) 
            return res.status(404).json({ error: 'Registration not found' });

        // Only owner can cancel (admins not implemented)
        if (reg.user.toString() !== req.user._id.toString())
            return res.status(403).json({ code: 'FORBIDDEN', message: 'Registration does not belong to current user' });

        // Fetch event
        const event = await Event.findById(reg.event);
        if 
        (!event) return res.status(400).json({ error: 'Event could not be found with registration' });

        // If already cancelled
        if (reg.status === REGISTRATION_STATUS.CANCELLED)
            return res.status(400).json({ error: 'Registration already cancelled' });


        // Wrap cancellation steps in a transaction to keep event and registration consistent
        const session = await mongoose.startSession();
        session.startTransaction();
        let deletedTicketsCount = 0;
        try {
            // Release capacity if it was confirmed
            if (reg.status === REGISTRATION_STATUS.CONFIRMED) {
                await Event.updateOne({ _id: event._id }, { $inc: { capacity: reg.quantity } }, { session });
            }

            // Remove from waitlist if present
            if (Array.isArray(event.waitlist) && event.waitlist.length) {
                await Event.updateOne({ _id: event._id }, { $pull: { waitlist: reg._id } }, { session });
            }

            // Remove user from registered_users if present
            if (Array.isArray(event.registered_users) && event.registered_users.length) {
                await Event.updateOne({ _id: event._id }, { $pull: { registered_users: reg.user } }, { session });
            }

            // Delete issued tickets
            if (Array.isArray(reg.ticketIds) && reg.ticketIds.length > 0) {
                await Ticket.deleteMany({ _id: { $in: reg.ticketIds } }).session(session);
                deletedTicketsCount = reg.ticketIds.length;
                reg.ticketIds = [];
                reg.ticketsIssued = 0;
            }

            reg.status = REGISTRATION_STATUS.CANCELLED;
            await reg.save({ session });

            await session.commitTransaction();
            session.endSession();
        } catch (e) {
            await session.abortTransaction();
            session.endSession();
            throw e;
        }

        return res.status(200).json({ message: 'Registration cancelled', registration: reg, deletedTicketsCount, eventCapacity: event.capacity });

    } catch (e) {
        console.error(e);
        return res.status(500).json({ error: 'Failed to cancel registration' });
    }
}

exports.deleteRegistration = async (req,res)=>{
    try{
        const {reg_id} = req.params;
    
        // Check registration id validity
        if (!reg_id)
            return res.status(400).json({error: "reg_id is required"});
        if (!mongoose.Types.ObjectId.isValid(reg_id))
            return res.status(400).json({error: "Invalid reg_id format"})

        // Find the registration
        const reg = await Registration.findById(reg_id);
        if (!reg)
            return res.status(404).json({error: "Registration not found"});

        // Find the evennt
        const event = await Event.findById(reg.event._id);
        if (!event)
            return res.status(400).json({error: "Event could not be found with registration"})



        // Use a session to delete registration and related updates atomically
        const session = await mongoose.startSession();
        session.startTransaction();
        let deletedTicketsCount = 0;
        try {
            // Update the capacity if confirmed
            if (reg.status === REGISTRATION_STATUS.CONFIRMED) {
                await Event.updateOne({ _id: event._id }, { $inc: { capacity: reg.quantity } }, { session });
            }

            // Remove from waitlist reference
            if (Array.isArray(event.waitlist) && event.waitlist.length) {
                await Event.updateOne({ _id: event._id }, { $pull: { waitlist: reg._id } }, { session });
            }

            // Remove from ticketIds issued
            if (Array.isArray(reg.ticketIds) && reg.ticketIds.length > 0) {
                await Ticket.deleteMany({ _id: { $in: reg.ticketIds } }).session(session);
                deletedTicketsCount = reg.ticketIds.length;
            }

            // Delete the registration
            await Registration.findByIdAndDelete(reg_id).session(session);

            await session.commitTransaction();
            session.endSession();
        } catch (e) {
            await session.abortTransaction();
            session.endSession();
            throw e;
        }


        return res.status(200).json({
            message: "Registration and associated tickets deleted successfully",
            deletedRegistration: reg._id,
            deletedTicketsCount,
            eventCapacity: event.capacity
        });


    } catch(e){
        console.error(e);
        return res.status(500).json({error: "Failed to delete registration"});
    }

}