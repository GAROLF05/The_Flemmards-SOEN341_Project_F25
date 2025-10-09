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

// API Endpoint to register to an event
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
                status: Registration.REGISTRATION_STATUS ? Registration.REGISTRATION_STATUS.CONFIRMED : 'confirmed'
            });

        
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
