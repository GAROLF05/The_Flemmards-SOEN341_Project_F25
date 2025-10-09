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

        // Create registration
        const registration = await Registration.create({
            user: req.user._id,
            event: eventId,
            quantity: qty,
            status: registrationStatus
        });

        // Update event depending on registration type
        if (registrationStatus === 'confirmed') {
            event.capacity -= qty; // reduce available spots
            await event.save();
            
        } else {
            // Add registration to event's waitlist array
            event.waitlist = event.waitlist || [];
            event.waitlist.push(registration._id);
            await event.save();
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

exports.promoteWaitlistedUser = async (req, res) => {
    const { event_id } = req.params;
    const event = await Event.findById(event_id).populate('waitlist');
    if (!event || event.waitlist.length === 0)
        return res.status(404).json({ message: "No waitlisted users" });

    // Get next registration on the list
    const next = event.waitlist.shift(); // FIFO

    const reg = await Registration.findById(next._id);
    if (!reg)
        return res.status(400).json({error: "Waitlisted Registration not found"});

    if(reg.capacity > (event.capacity || 0)){
        event.waitlist.unshift(next); // Not enough room, put it back in the first position of waitlist
        await event.save();
        return res.status(400).json({
            error: "Not enough capacity to promote to next waitlisted user yet",
            remainingCapacity: event.capacity,
            required: reg.quantity,
        });
    }

    reg.status = REGISTRATION_STATUS.CONFIRMED; // Change the next person's registration status to confirmed
    await reg.save();

    event.capacity = Math.max(0, event.capacity - next.quantity);
    await event.save();

    return res.status(200).json({
        message: "Next user promoted from waitlist",
        promotedUser: reg,
        remainingCapacity: event.capacity,
    });
};