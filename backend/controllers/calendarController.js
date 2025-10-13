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

// ICS setup
const { createEvent } = require('ics');

exports.generateICS = async (req, res) => {
    try {
        // Accept event id in params or body
        const eventId = req.params.event_id || req.body.eventId;
        if (!eventId) 
            return res.status(400).json({ error: 'event_id is required' });
        if (!mongoose.Types.ObjectId.isValid(eventId)) 
            return res.status(400).json({ error: 'Invalid event id format' });

        // Optionally allow public ICS generation; if you want only authenticated users or admins,
        // uncomment the lines below or use `ensureAdmin` from authHelpers.
        // const { assertAuthenticated, ensureAdmin } = require('../utils/authHelpers');
        // try { assertAuthenticated(req); } catch (e) { return res.status(e.status || 401).json({ code: e.code || 'UNAUTHORIZED', message: e.message }); }

        // Load event and populate organization name and contact.email
        const ev = await Event.findById(eventId).populate({ path: 'organization', select: 'name contact.email' }).lean();
        if (!ev)
            return res.status(404).json({ error: 'Event not found' });

        // Prepare start array [YYYY, M, D, H, M]
        const startDate = new Date(ev.start_at);
        const endDate = new Date(ev.end_at);
        const start = [
            startDate.getUTCFullYear(),
            startDate.getUTCMonth() + 1, // months are 1-based in ics
            startDate.getUTCDate(),
            startDate.getUTCHours(),
            startDate.getUTCMinutes(),
        ];

        // Compute duration in hours/minutes
        let diffMs = endDate.getTime() - startDate.getTime();
        if (diffMs < 0) 
            diffMs = 0;
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const minutes = Math.round((diffMs % (1000 * 60 * 60)) / (1000 * 60));

        // Location text
        let locationText = '';
        if (ev.location) {
            const name = ev.location.name || '';
            const addr = ev.location.address || '';
            locationText = name && addr ? `${name} — ${addr}` : name || addr || '';
        }

        // Use organization name/email as organizer when available (safe fallback)
        const organizerName = ev.organization && ev.organization.name ? ev.organization.name : 'The Flemmards';
        const organizerEmail = ev.organization && ev.organization.contact && ev.organization.contact.email ? ev.organization.contact.email : 'noreply@flemmards.ca';

        const icsEvent = {
            title: ev.title || 'Event',
            description: ev.description || '',
            location: locationText,
            start,
            duration: { hours, minutes },
            status: 'CONFIRMED',
            busyStatus: 'BUSY',
            organizer: { name: organizerName, email: organizerEmail },
        };

        createEvent(icsEvent, (error, value) => {
            if (error) {
                console.error('ICS generation error:', error);
                return res.status(500).json({ error: 'Failed to create .ics' });
            }
            res.setHeader('Content-Disposition', `attachment; filename=event-${ev._id}.ics`);
            res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
            return res.send(value);
        });
    } catch (err) {
        console.error('generateICS error:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};



