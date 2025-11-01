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
const { Registration, REGISTRATION_STATUS } = require('../models/Registrations');
const Ticket = require('../models/Ticket');

// QR Code setup (npm install qrcode)
const qrcode = require('qrcode');

// Nodemailer setup (For emails)
const nodemailer = require("nodemailer");

// Dotenv setup
const path = require('path')
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

// MongoDB setup
const mongoose = require('mongoose');
const { error } = require('console');

const { assertAuthenticated, ensureAdmin, ensureAdminOrOwner } = require('../utils/authHelpers');

// API Endpoint to register to an event
exports.registerToEvent = async (req, res) => {
    try {
        
        // Ensure user is authenticated
        try { assertAuthenticated(req); } catch (e) { return res.status(e.status || 401).json({ code: e.code || 'UNAUTHORIZED', message: e.message }); }

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

        const session = await mongoose.startSession();
        session.startTransaction();

        let registration;
        let event;
        try {
            // Fetch event to check its capacity and status
            event = await Event.findById(eventId);
            if (!event)
                return res.status(404).json({ code: 'EVENT_NOT_FOUND', message: 'Event not found' });

            // Check event status
            if (event.status !== EVENT_STATUS.UPCOMING)
                return res.status(403).json({ code: 'CLOSED', message: `Event is ${event.status}` });

            // Check if registering when event has ended
            if (new Date(event.end_at) < Date.now())
                return res.status(403).json({ code: 'CLOSED', message: 'Event has already ended' });

            // Is the registration going to be confirmed or a waitlist based on the number of tickets he's trying to get
            let registrationStatus = qty > event.capacity ? REGISTRATION_STATUS.WAITLISTED : REGISTRATION_STATUS.CONFIRMED;

            // Create registration with session (using new Model() + save() for session support)
            registration = new Registration({
                user: req.user._id,
                event: eventId,
                quantity: qty,
                status: registrationStatus
            });
            await registration.save({ session });

            if (registrationStatus === REGISTRATION_STATUS.CONFIRMED) {
                // atomic decrement and addToSet to prevent duplicates
                event.capacity = Math.max(0, event.capacity - qty);
                event.registered_users.addToSet(req.user._id);

            } else {
                // push registration to waitlist
                event.waitlist.push(registration._id);
            }

            await event.save({ session });
            await session.commitTransaction();

            console.log('Registration created:', registration._id, registrationStatus, eventId);
        } catch (e) {
            await session.abortTransaction();
            throw e;
        } finally {
            session.endSession();
        }

        try {
            const name = req.user.username || req.user.name || "there";
            const email = req.user.email;
            const eventTitle = event.title || "your event";
            const registrationId = registration._id;

            // Create a ticket download link
            const ticketLink = `${process.env.FRONTEND_URL || "http://localhost:3000"
                }/tickets/${registrationId}`;

            // Set up email transporter
            const transporter = nodemailer.createTransport({
                service: "Gmail",
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS,
                },
            });

            // Determine email subject based on registration status
            const subject =
                registration.status === REGISTRATION_STATUS.CONFIRMED
                    ? "Event Registration - Confirmation"
                    : "Event Registration - Waitlisted";

            // Determine email message based on registration status
            const message =
                registration.status === REGISTRATION_STATUS.CONFIRMED
                    ? `<p>Your registration has been confirmed! Download your ticket(s) below.</p>`
                    : `<p>The event is currently full. You've been added to the waitlist and will be notified if a spot opens up.</p>`;

            // Prepare attachments for confirmed registrations
            const attachments = [];
            if (
                registration.status === REGISTRATION_STATUS.CONFIRMED &&
                registration.qrDataUrl
            ) {
                // Attach QR code as base64 data URL
                const base64Data = registration.qrDataUrl.replace(
                    /^data:image\/png;base64,/,
                    ""
                );
                attachments.push({
                    filename: `ticket_${registrationId}.png`,
                    content: Buffer.from(base64Data, "base64"),
                    contentType: "image/png",
                });
            }

            // Send email
            await transporter.sendMail({
                from: `"The Flemmards Team" <${process.env.EMAIL_USER}>`,
                to: email,
                subject: subject,
                html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px;">
                <h2>Hey ${name}!</h2>
                <p>Thanks for registering for <strong>${eventTitle}</strong>!</p>
                ${message}
                ${registration.status === REGISTRATION_STATUS.CONFIRMED
                        ? `<p><strong>📥 Download your ticket:</strong> <a href="${ticketLink}" style="color: #007bff; text-decoration: none;">Click here</a></p>
                       <p><strong>Your QR Code:</strong></p>
                       <img src="cid:qrcode" alt="Ticket QR Code" style="max-width: 200px; border: 1px solid #ddd; padding: 10px;" />`
                        : ``
                    }
                <p style="margin-top: 30px; color: #666; font-size: 12px;">
                    Registration ID: ${registration._id}
                </p>
                <p style="color: #666;">– The Flemmards Team</p>
            </div>
        `,
                attachments: attachments.length > 0 ? attachments : undefined,
            });

            console.log(`Confirmation email sent to ${email}`);
        } catch (emailError) {
            console.error("Failed to send confirmation email:", emailError);
            // Don't fail the registration if email fails - it's non-critical
        }


        // Final response
        return res.status(201).json({
            code: registration.status,
            message: registration.status === REGISTRATION_STATUS.CONFIRMED
                ? 'Registration confirmed successfully!'
                : 'Event full — you have been added to the waitlist.',
            registration: registration,
        });

    } catch (e) {
        console.error(e);
        return res.status(500).json({
            code: 'INTERNAL_ERROR',
            message: 'Failed to register to event'
        });
    }
};


exports.getRegistrationById = async (req, res) => {
    try {
        const { reg_id } = req.params;

        // Registration id validity
        if (!reg_id)
            return res.status(400).json({ error: "reg_id is required" });
        if (!mongoose.Types.ObjectId.isValid(reg_id))
            return res.status(400).json({ error: "Invalid registration id format" });

        const reg = await Registration.findById(reg_id)
            .populate({
                path: 'user',
                select: 'name email'
            })
            .populate({
                path: 'event',
                select: 'organization title start_at end_at',
                populate: {
                    path: 'organization',
                    select: 'name website',
                }
            })
            .populate({
                path: 'ticketIds',
                model: 'Ticket',
                select: 'code qrDataUrl qr_expires_at status scannedAt scannedBy',
            }).lean().exec();

        if (!reg || reg.length === 0) return res.status(404).json({ error: "Registration not found" });

    // Owner or admin can access
    try { await ensureAdminOrOwner(req, reg.user); } catch (e) { return res.status(e.status || 401).json({ code: e.code || 'UNAUTHORIZED', message: e.message }); }

        return res.status(200).json({ registration: reg });

    } catch (e) {
        console.error(e);
        return res.status(500).json({ error: "Failed to fetch all registrations" });
    }
}

exports.getRegistrationByRegId = async (req, res) => {
    try {
        const { registrationId } = req.params;

        // registrationId validity
        if (!registrationId)
            return res.status(400).json({ error: "registrationId is required" });

        const reg = await Registration.findOne({ registrationId: registrationId })
            .populate({
                path: 'user',
                select: 'name email'
            })
            .populate({
                path: 'event',
                select: 'organization title start_at end_at',
                populate: {
                    path: 'organization',
                    select: 'name website',
                }
            })
            .populate({
                path: 'ticketIds',
                model: 'Ticket',
                select: 'code qrDataUrl qr_expires_at status scannedAt scannedBy',
            }).lean().exec();

        if (!reg || reg.length === 0) return res.status(404).json({ error: "Registration not found" });

    try { await ensureAdminOrOwner(req, reg.user); } catch (e) { return res.status(e.status || 401).json({ code: e.code || 'UNAUTHORIZED', message: e.message }); }

        return res.status(200).json({ registration: reg });

    } catch (e) {
        console.error(e);
        return res.status(400).json({ error: "Failed to fetch registration" });
    }
}

exports.getRegistrationByUser = async (req, res) => {
    try {
        const { user_id } = req.params;

        // registrationId validity
        if (!user_id)
            return res.status(400).json({ error: "user_id is required" });
        if (!mongoose.Types.ObjectId.isValid(user_id))
            return res.status(400).json({error: "Invalid user_id format"});
        
    // Only owner (same user) or admin can fetch registrations for a user
    try { await ensureAdminOrOwner(req, { _id: user_id }); } catch (e) { return res.status(e.status || 401).json({ code: e.code || 'UNAUTHORIZED', message: e.message }); }

    const reg = await Registration.find({user: user_id})
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
            path: 'ticketIds',
            model: 'Ticket', 
            select: 'code qrDataUrl qr_expires_at status scannedAt scannedBy',
        }).lean().exec();

        if (!reg || reg.length === 0) return res.status(404).json({error: "Registration not found"});

        return res.status(200).json({ count: reg.length, reg });

    } catch (e) {
        console.error(e);
        return res.status(400).json({ error: "Failed to fetch registration" });
    }
}

// API endpoint to get registrations by event (organizer or admin)
exports.getRegistrationByEvent = async (req, res) => {
    try {
        const { event_id } = req.params;

        // Validate event_id
        if (!event_id) {
            return res.status(400).json({ error: "event_id is required" });
        }

        if (!mongoose.Types.ObjectId.isValid(event_id)) {
            return res.status(400).json({ error: "Invalid event_id format" });
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

        const registrations = await Registration.find({ event: event_id })
            .populate({
                path: 'user', 
                select: 'name email'
            })
            .populate({
                path: 'event', 
                select: 'organization title start_at end_at',
                populate:{
                    path: 'organization',
                    select: 'name website',
                }
            })
            .populate({
                path: 'ticketIds',
                model: 'Ticket', 
                select: 'code qrDataUrl qr_expires_at status scannedAt scannedBy',
            })
            .sort({ createdAt: -1 })
            .lean()
            .exec();

        if (!registrations || registrations.length === 0) {
            return res.status(404).json({ error: "No registrations found for this event" });
        }

        return res.status(200).json({
            message: 'Registrations for event fetched successfully',
            total: registrations.length,
            registrations
        });

    } catch (e) {
        console.error(e);
        return res.status(500).json({ error: "Failed to fetch registrations" });
    }
}

exports.updateRegistration = async (req, res) => {
    try {
        const { reg_id } = req.params;
        const { quantity } = req.body || {};

        // Basic validation
        try { assertAuthenticated(req); } catch (e) { return res.status(e.status || 401).json({ code: e.code || 'UNAUTHORIZED', message: e.message }); }
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

        // Only the owner (or admins) can update
        try { await ensureAdminOrOwner(req, reg.user); } catch (e) { return res.status(e.status || 401).json({ code: e.code || 'UNAUTHORIZED', message: e.message }); }

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
        // collect tickets created inside the session so we can generate QR after commit
        let newlyCreatedTickets = [];
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

                // Create the missing tickets inside the same transaction
                const ticketsToCreate = [];
                for (let i = 0; i < delta; i++) {
                    ticketsToCreate.push({ user: reg.user, event: reg.event, registration: reg._id });
                }
                if (ticketsToCreate.length > 0) {
                    const created = await Ticket.create(ticketsToCreate, { session });
                    const newIds = created.map(t => t._id);
                    reg.ticketIds = Array.isArray(reg.ticketIds) ? reg.ticketIds.concat(newIds) : newIds;
                    reg.ticketsIssued = (reg.ticketsIssued || 0) + newIds.length;
                    newlyCreatedTickets = created;
                }
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

        // Generate QR codes for any tickets created during the transaction.
        if (newlyCreatedTickets && newlyCreatedTickets.length > 0) {
            try {
                for (const t of newlyCreatedTickets) {
                    const payload = JSON.stringify({ ticketId: t.ticketId || t._id, registration: reg._id });
                    const qr = await qrcode.toDataURL(payload);
                    await Ticket.findByIdAndUpdate(t._id, { qrDataUrl: qr, qr_expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24) });
                }
            } catch (qrErr) {
                console.error('QR generation failed for created tickets:', qrErr);
            }
        }

        return res.status(200).json({ message: 'Registration updated', registration: reg, deletedTicketsCount, eventCapacity: event.capacity });

    } catch (e) {
        console.error(e);
        return res.status(500).json({ error: 'Failed to update registration' });
    }
}

exports.cancelRegistration = async (req, res) => {
    try {
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
        if ((reg.user._id ? reg.user._id.toString() : reg.user.toString()) !== req.user._id.toString())
            return res.status(403).json({ code: 'FORBIDDEN', message: 'Registration does not belong to current user' });

        // Fetch event
        const event = await Event.findById(reg.event);
        if (!event) return res.status(400).json({ error: 'Event could not be found with registration' });

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

        // Try to promote waitlisted users after capacity increase
        try {
            const { promoteWaitlistForEvent } = require('./eventController');
            await promoteWaitlistForEvent(event._id);
        } catch (promoteError) {
            console.log('Waitlist promotion failed (non-critical):', promoteError.message);
        }

        return res.status(200).json({ message: 'Registration cancelled', registration: reg, deletedTicketsCount, eventCapacity: event.capacity });

    } catch (e) {
        console.error(e);
        return res.status(500).json({ error: 'Failed to cancel registration' });
    }
}

exports.deleteRegistration = async (req, res) => {
    try {
        const { reg_id } = req.params;

        // Check registration id validity
        if (!reg_id)
            return res.status(400).json({ error: "reg_id is required" });
        if (!mongoose.Types.ObjectId.isValid(reg_id))
            return res.status(400).json({ error: "Invalid reg_id format" })

        // Find the registration
        const reg = await Registration.findById(reg_id);
        if (!reg)
            return res.status(404).json({ error: "Registration not found" });

        // Find the evennt
        const event = await Event.findById(reg.event);
        if (!event)
            return res.status(400).json({ error: "Event could not be found with registration" })

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


        // Try to promote waitlisted users after capacity increase
        try {
            const { promoteWaitlistForEvent } = require('./eventController');
            await promoteWaitlistForEvent(event._id);
        } catch (promoteError) {
            console.log('Waitlist promotion failed (non-critical):', promoteError.message);
        }

        return res.status(200).json({
            message: "Registration and associated tickets deleted successfully",
            deletedRegistration: reg._id,
            deletedTicketsCount,
            eventCapacity: event.capacity
        });


    } catch (e) {
        console.error(e);
        return res.status(500).json({ error: "Failed to delete registration" });
    }

}