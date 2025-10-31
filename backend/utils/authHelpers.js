const Administrator = require('../models/Administrators');

/**
 * Throws an Error-like object with status and message when unauthenticated.
 */
function assertAuthenticated(req) {
    if (!req || !req.user) {
        const err = new Error('Authentication required');
        err.status = 401;
        err.code = 'UNAUTHORIZED';
        throw err;
    }
    return req.user;
}

async function isAdmin(req) {
    if (!req || !req.user) return false;
    const admin = await Administrator.findOne({ email: req.user.email }).lean();
    return !!admin;
}

async function ensureAdmin(req) {
    if (!req || !req.user) {
        const err = new Error('Authentication required');
        err.status = 401;
        err.code = 'UNAUTHORIZED';
        throw err;
    }
    const admin = await Administrator.findOne({ email: req.user.email }).lean();
    if (!admin) {
        const err = new Error('Admin access required');
        err.status = 403;
        err.code = 'FORBIDDEN';
        throw err;
    }
    req.isAdmin = true;
    return true;
}

/**
 * Ensure the current user is either the owner (ownerId) or an administrator.
 * ownerId may be an ObjectId, string or undefined. Throws on failure.
 */
async function ensureAdminOrOwner(req, ownerId) {
    if (!req || !req.user) {
        const err = new Error('Authentication required');
        err.status = 401;
        err.code = 'UNAUTHORIZED';
        throw err;
    }

    try {
        if (ownerId) {
        const ownerStr = ownerId._id ? ownerId._id.toString() : ownerId.toString();
        if (ownerStr === req.user._id.toString()) return true;
        }
    } catch (e) {
        // ignore; will check admin below
    }

    const admin = await Administrator.findOne({ email: req.user.email }).lean();
    if (admin) {
        req.isAdmin = true;
        return true;
    }

    const err = new Error('Access denied');
    err.status = 403;
    err.code = 'FORBIDDEN';
    throw err;
}

/**
 * Ensure the current user is either an administrator or an organizer of the event's organization.
 * Requires event_id to be provided and fetches the event to check organization ownership.
 * Throws on failure.
 */
async function ensureAdminOrEventOrganizer(req, event_id) {
    const mongoose = require('mongoose');
    const { Event } = require('../models/Event');
    const { USER_ROLE } = require('../models/User');

    if (!req || !req.user) {
        const err = new Error('Authentication required');
        err.status = 401;
        err.code = 'UNAUTHORIZED';
        throw err;
    }

    // Check if admin first
    const admin = await Administrator.findOne({ email: req.user.email }).lean();
    if (admin) {
        req.isAdmin = true;
        return true;
    }

    // Check if user is organizer and owns the event's organization
    if (req.user.role === USER_ROLE.ORGANIZER && event_id) {
        if (!mongoose.Types.ObjectId.isValid(event_id)) {
            const err = new Error('Invalid event ID');
            err.status = 400;
            err.code = 'INVALID_INPUT';
            throw err;
        }

        const event = await Event.findById(event_id)
            .populate('organization', 'contact.email')
            .lean();

        if (!event) {
            const err = new Error('Event not found');
            err.status = 404;
            err.code = 'NOT_FOUND';
            throw err;
        }

        // Check if organizer's email matches organization's contact email
        if (event.organization && event.organization.contact && 
            event.organization.contact.email === req.user.email) {
            return true;
        }
    }

    const err = new Error('Access denied. Admin or event organizer access required.');
    err.status = 403;
    err.code = 'FORBIDDEN';
    throw err;
}

module.exports = {
    assertAuthenticated,
    isAdmin,
    ensureAdmin,
    ensureAdminOrOwner,
    ensureAdminOrEventOrganizer,
};
