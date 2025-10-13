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

module.exports = {
    assertAuthenticated,
    isAdmin,
    ensureAdmin,
    ensureAdminOrOwner,
};
