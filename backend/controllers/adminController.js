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
const { User, USER_ROLE } = require('../models/User');
const { Event, EVENT_STATUS, MODERATION_STATUS, CATEGORY } = require('../models/Event');
const { Organization, ORGANIZATION_STATUS }= require('../models/Organization');
const { Registration, REGISTRATION_STATUS } = require('../models/Registrations');
const Ticket = require('../models/Ticket');

// Notification controller
const { notifyEventModeration, notifyOrganizationStatus } = require('./notificationController');

// QR Code setup (npm install qrcode)
const qrcode = require('qrcode');

// Dotenv setup
const path = require('path')
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

// MongoDB setup
const mongoose = require('mongoose');
const { error } = require('console');

// API Endpoint to get admin dashboard statistics
exports.getDashboardStats = async (req,res) => {
    try {
        // Admin only
        const { ensureAdmin } = require('../utils/authHelpers');
        try { await ensureAdmin(req); } catch (e) { return res.status(e.status || 401).json({ code: e.code || 'UNAUTHORIZED', message: e.message }); }

        // Get counts
        const totalUsers = await User.countDocuments();
        const totalOrganizations = await Organization.countDocuments();
        const totalEvents = await Event.countDocuments();
        const totalTickets = await Ticket.countDocuments();
        const totalRegistrations = await Registration.countDocuments();

        // Get counts by status
        const pendingOrganizations = await Organization.countDocuments({ status: ORGANIZATION_STATUS.PENDING });
        const approvedOrganizations = await Organization.countDocuments({ status: ORGANIZATION_STATUS.APPROVED });
        const rejectedOrganizations = await Organization.countDocuments({ status: ORGANIZATION_STATUS.REJECTED });
        const suspendedOrganizations = await Organization.countDocuments({ status: ORGANIZATION_STATUS.SUSPENDED });

        // Get event counts by status
        const upcomingEvents = await Event.countDocuments({ status: EVENT_STATUS.UPCOMING });
        const completedEvents = await Event.countDocuments({ status: EVENT_STATUS.COMPLETED });
        const cancelledEvents = await Event.countDocuments({ status: EVENT_STATUS.CANCELLED });

        // Get ticket counts by status
        const validTickets = await Ticket.countDocuments({ status: 'valid' });
        const usedTickets = await Ticket.countDocuments({ status: 'used' });
        const cancelledTickets = await Ticket.countDocuments({ status: 'cancelled' });

        // Get recent activity (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const recentUsers = await User.countDocuments({ createdAt: { $gte: sevenDaysAgo } });
        const recentEvents = await Event.countDocuments({ createdAt: { $gte: sevenDaysAgo } });
        const recentRegistrations = await Registration.countDocuments({ createdAt: { $gte: sevenDaysAgo } });

        // Get user breakdown by role
        const studentUsers = await User.countDocuments({ role: USER_ROLE.STUDENT });
        const organizerUsers = await User.countDocuments({ role: USER_ROLE.ORGANIZER });

        // Get event moderation stats
        const pendingEventModeration = await Event.countDocuments({ moderationStatus: MODERATION_STATUS.PENDING_APPROVAL });
        const approvedEvents = await Event.countDocuments({ moderationStatus: MODERATION_STATUS.APPROVED });
        const rejectedEvents = await Event.countDocuments({ moderationStatus: MODERATION_STATUS.REJECTED });
        const flaggedEvents = await Event.countDocuments({ moderationStatus: MODERATION_STATUS.FLAGGED });

        // Get waitlist stats
        const waitlistedRegistrations = await Registration.countDocuments({ status: REGISTRATION_STATUS.WAITLISTED });
        const confirmedRegistrations = await Registration.countDocuments({ status: REGISTRATION_STATUS.CONFIRMED });

        // Calculate engagement metrics
        // Get events with registrations to calculate attendance rate
        const eventsWithRegistrations = await Event.find({
            status: { $in: [EVENT_STATUS.COMPLETED, EVENT_STATUS.ONGOING] }
        })
        .select('capacity registered_users')
        .lean();

        let totalCapacity = 0;
        let totalRegistered = 0;
        let eventsWithData = 0;

        eventsWithRegistrations.forEach(event => {
            const capacity = event.capacity || 0;
            const registered = Array.isArray(event.registered_users) ? event.registered_users.length : 0;
            if (capacity > 0) {
                totalCapacity += capacity;
                totalRegistered += registered;
                eventsWithData++;
            }
        });

        const avgCapacityUtilization = totalCapacity > 0 && eventsWithData > 0 ? (totalRegistered / totalCapacity * 100).toFixed(1) : 0;
        const totalWaitlistCount = waitlistedRegistrations;

        // Get registration rate (recent registrations vs recent events)
        const registrationRate = recentEvents > 0 ? ((recentRegistrations / recentEvents) * 100).toFixed(1) : 0;

        return res.status(200).json({
            message: 'Dashboard statistics fetched successfully',
            stats: {
                users: {
                    total: totalUsers,
                    recent: recentUsers,
                    students: studentUsers,
                    organizers: organizerUsers
                },
                organizations: {
                    total: totalOrganizations,
                    pending: pendingOrganizations,
                    approved: approvedOrganizations,
                    rejected: rejectedOrganizations,
                    suspended: suspendedOrganizations
                },
                events: {
                    total: totalEvents,
                    upcoming: upcomingEvents,
                    completed: completedEvents,
                    cancelled: cancelledEvents,
                    recent: recentEvents,
                    moderation: {
                        pending: pendingEventModeration,
                        approved: approvedEvents,
                        rejected: rejectedEvents,
                        flagged: flaggedEvents
                    }
                },
                tickets: {
                    total: totalTickets,
                    valid: validTickets,
                    used: usedTickets,
                    cancelled: cancelledTickets
                },
                registrations: {
                    total: totalRegistrations,
                    recent: recentRegistrations,
                    confirmed: confirmedRegistrations,
                    waitlisted: waitlistedRegistrations
                },
                engagement: {
                    avgCapacityUtilization: parseFloat(avgCapacityUtilization),
                    registrationRate: parseFloat(registrationRate),
                    totalWaitlistCount: totalWaitlistCount
                },
                moderation: {
                    pendingOrganizations: pendingOrganizations,
                    pendingEvents: pendingEventModeration,
                    flaggedEvents: flaggedEvents,
                    totalPending: pendingOrganizations + pendingEventModeration
                }
            }
        });

    } catch (e) {
        console.error('Error fetching dashboard stats:', e);
        return res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
    }
}

// API Endpoint to approve or reject organizer
exports.approveOrganizer = async (req,res)=>{
    try {
        // Admin only
        const { ensureAdmin } = require('../utils/authHelpers');
        try { await ensureAdmin(req); } catch (e) { return res.status(e.status || 401).json({ code: e.code || 'UNAUTHORIZED', message: e.message }); }

        const { org_id } = req.params;
        const { status, rejectionReason } = req.body;

        // Validate org_id
        if (!org_id || !mongoose.Types.ObjectId.isValid(org_id)) {
            return res.status(400).json({ error: 'Invalid organization ID' });
        }

        // Validate status
        if (!status || !['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ 
                error: 'Status must be either "approved" or "rejected"' 
            });
        }

        // If rejected, rejectionReason should be provided
        if (status === 'rejected' && !rejectionReason) {
            return res.status(400).json({ 
                error: 'Rejection reason is required when rejecting an organization' 
            });
        }

        // Find organization
        const organization = await Organization.findById(org_id);
        if (!organization) {
            return res.status(404).json({ error: 'Organization not found' });
        }

        // Update status
        organization.status = status;
        if (status === 'approved') {
            organization.verified = true;
        } else if (status === 'rejected') {
            organization.verified = false;
        }
        
        await organization.save();

        // Task #123: Send notification to organizer
        await notifyOrganizationStatus(org_id, status, rejectionReason);

        // Log admin action (Task #124 - audit logs)
        console.log(`[AUDIT] Admin ${req.user.email} ${status} organization ${organization.name} (ID: ${org_id})`);
        if (rejectionReason) {
            console.log(`[AUDIT] Rejection reason: ${rejectionReason}`);
        }

        return res.status(200).json({
            message: `Organization ${status} successfully`,
            organization: {
                _id: organization._id,
                name: organization.name,
                status: organization.status,
                verified: organization.verified
            },
            rejectionReason: status === 'rejected' ? rejectionReason : undefined,
            notificationSent: true
        });

    } catch (e) {
        console.error('Error approving/rejecting organization:', e);
        return res.status(500).json({ error: 'Failed to update organization status' });
    }
}

// API Endpoint to suspend organization
exports.suspendOrganization = async (req,res) => {
    try {
        // Admin only
        const { ensureAdmin } = require('../utils/authHelpers');
        try { await ensureAdmin(req); } catch (e) { return res.status(e.status || 401).json({ code: e.code || 'UNAUTHORIZED', message: e.message }); }

        const { org_id } = req.params;
        const suspensionReason = req.body?.suspensionReason;

        // Validate org_id
        if (!org_id) {
            return res.status(400).json({ error: 'Organization ID is required' });
        }

        if (!mongoose.Types.ObjectId.isValid(org_id)) {
            return res.status(400).json({ error: 'Invalid organization ID format' });
        }

        // Find and update organization status to suspended
        // Using findByIdAndUpdate to avoid full document validation issues
        const organization = await Organization.findByIdAndUpdate(
            org_id,
            { status: ORGANIZATION_STATUS.SUSPENDED },
            { new: true, runValidators: false } // Only update status, skip full validation
        );
        
        if (!organization) {
            return res.status(404).json({ error: 'Organization not found' });
        }

        // Audit log
        console.log(`[AUDIT] Admin ${req.user.email} suspended organization ${organization.name} (ID: ${org_id})`);
        if (suspensionReason) {
            console.log(`[AUDIT] Suspension reason: ${suspensionReason}`);
        }

        const response = {
            message: 'Organization suspended successfully',
            organization: {
                _id: organization._id,
                name: organization.name,
                status: organization.status
            }
        };

        if (suspensionReason) {
            response.suspensionReason = suspensionReason;
        }

        return res.status(200).json(response);

    } catch (e) {
        console.error('Error suspending organization:', e);
        console.error('Error stack:', e.stack);
        console.error('Error details:', {
            name: e.name,
            message: e.message,
            errors: e.errors
        });
        return res.status(500).json({ 
            error: 'Failed to suspend organization',
            details: e.message || 'Internal server error'
        });
    }
}

// API Endpoint to update user role (admin management)
exports.updateUserRole = async (req,res) => {
    try {
        // Admin only
        const { ensureAdmin } = require('../utils/authHelpers');
        try { await ensureAdmin(req); } catch (e) { return res.status(e.status || 401).json({ code: e.code || 'UNAUTHORIZED', message: e.message }); }

        const { user_id } = req.params;
        const { role } = req.body;

        // Validate user_id
        if (!user_id) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        if (!mongoose.Types.ObjectId.isValid(user_id)) {
            return res.status(400).json({ error: 'Invalid user ID format' });
        }

        // Validate role
        if (!role) {
            return res.status(400).json({ error: 'Role is required' });
        }

        if (!Object.values(USER_ROLE).includes(role)) {
            return res.status(400).json({ 
                error: `Invalid role. Must be one of: ${Object.values(USER_ROLE).join(', ')}` 
            });
        }

        // Find user
        const user = await User.findById(user_id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Prevent self-role change
        if (user._id.toString() === req.user._id.toString()) {
            return res.status(400).json({ error: 'Cannot change your own role' });
        }

        // Update user role
        user.role = role;
        await user.save();

        // Audit log
        console.log(`[AUDIT] Admin ${req.user.email} updated user ${user.email || user.username} role to ${role} (ID: ${user_id})`);

        return res.status(200).json({
            message: 'User role updated successfully',
            user: {
                _id: user._id,
                email: user.email,
                username: user.username,
                role: user.role
            }
        });

    } catch (e) {
        console.error('Error updating user role:', e);
        return res.status(500).json({ error: 'Failed to update user role' });
    }
}

// API Endpoint to get all administrators
exports.getAllAdministrators = async (req,res) => {
    try {
        // Admin only
        const { ensureAdmin } = require('../utils/authHelpers');
        try { await ensureAdmin(req); } catch (e) { return res.status(e.status || 401).json({ code: e.code || 'UNAUTHORIZED', message: e.message }); }

        const administrators = await Administrator.find()
            .select('-password')
            .sort({ createdAt: -1 })
            .lean();

        return res.status(200).json({
            message: 'Administrators fetched successfully',
            total: administrators.length,
            administrators
        });

    } catch (e) {
        console.error('Error fetching administrators:', e);
        return res.status(500).json({ error: 'Failed to fetch administrators' });
    }
}

// API Endpoint to get system analytics
exports.getSystemAnalytics = async (req,res) => {
    try {
        // Admin only
        const { ensureAdmin } = require('../utils/authHelpers');
        try { await ensureAdmin(req); } catch (e) { return res.status(e.status || 401).json({ code: e.code || 'UNAUTHORIZED', message: e.message }); }

        // Get date range from query params or default to last 30 days
        const { startDate, endDate } = req.query;
        const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const end = endDate ? new Date(endDate) : new Date();

        // Events over time
        const eventsOverTime = await Event.aggregate([
            {
                $match: {
                    createdAt: { $gte: start, $lte: end }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Registrations over time
        const registrationsOverTime = await Registration.aggregate([
            {
                $match: {
                    createdAt: { $gte: start, $lte: end }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Top organizations by events
        const topOrganizations = await Event.aggregate([
            {
                $group: {
                    _id: '$organization',
                    eventCount: { $sum: 1 }
                }
            },
            { $sort: { eventCount: -1 } },
            { $limit: 10 },
            {
                $lookup: {
                    from: 'organizations',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'organization'
                }
            },
            { $unwind: '$organization' },
            {
                $project: {
                    organizationName: '$organization.name',
                    eventCount: 1
                }
            }
        ]);

        // Events by category
        const eventsByCategory = await Event.aggregate([
            {
                $group: {
                    _id: '$category',
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } }
        ]);

        return res.status(200).json({
            message: 'System analytics fetched successfully',
            period: {
                start: start,
                end: end
            },
            analytics: {
                eventsOverTime,
                registrationsOverTime,
                topOrganizations,
                eventsByCategory
            }
        });

    } catch (e) {
        console.error('Error fetching system analytics:', e);
        return res.status(500).json({ error: 'Failed to fetch system analytics' });
    }
}

// API Endpoint to get pending events for moderation
exports.getPendingEvents = async (req,res) => {
    try {
        // Admin only
        const { ensureAdmin } = require('../utils/authHelpers');
        try { await ensureAdmin(req); } catch (e) { return res.status(e.status || 401).json({ code: e.code || 'UNAUTHORIZED', message: e.message }); }

        // Get recent events that may need moderation (created in last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const events = await Event.find({ 
            createdAt: { $gte: sevenDaysAgo },
            status: { $in: [EVENT_STATUS.UPCOMING, EVENT_STATUS.ONGOING] }
        })
            .select('organization title description start_at end_at capacity status registered_users waitlist')
            .populate({
                path: 'organization',
                select: 'name description website contact.email contact.phone contact.socials status'
            })
            .populate({
                path: 'registered_users',
                select: 'name email'
            })
            .sort({ createdAt: -1 })
            .lean()
            .exec();

        return res.status(200).json({
            message: 'Pending events fetched successfully',
            total: events.length,
            events
        });

    } catch (e) {
        console.error('Error fetching pending events:', e);
        return res.status(500).json({ error: 'Failed to fetch pending events' });
    }
}

// API Endpoint to get all users (admin only)
exports.getAllUsers = async (req,res) => {
    try {
        // Admin only
        const { ensureAdmin } = require('../utils/authHelpers');
        try { await ensureAdmin(req); } catch (e) { return res.status(e.status || 401).json({ code: e.code || 'UNAUTHORIZED', message: e.message }); }

        const users = await User.find()
            .select('-password')
            .sort({ createdAt: -1 })
            .lean()
            .exec();

        return res.status(200).json({
            message: 'All users fetched successfully',
            total: users.length,
            users
        });

    } catch (e) {
        console.error('Error fetching all users:', e);
        return res.status(500).json({ error: 'Failed to fetch users' });
    }
}

// API Endpoint to count users (admin only)
exports.countUsers = async (req,res) => {
    try {
        // Admin only
        const { ensureAdmin } = require('../utils/authHelpers');
        try { await ensureAdmin(req); } catch (e) { return res.status(e.status || 401).json({ code: e.code || 'UNAUTHORIZED', message: e.message }); }

        const count = await User.countDocuments();

        return res.status(200).json({
            message: 'Total number of users in the system',
            totalUsers: count
        });

    } catch (e) {
        console.error('Error counting users:', e);
        return res.status(500).json({ error: 'Failed to count users' });
    }
}

// API Endpoint to approve event
exports.approveEvent = async (req,res) => {
    try {
        // Admin only
        const { ensureAdmin } = require('../utils/authHelpers');
        try { await ensureAdmin(req); } catch (e) { return res.status(e.status || 401).json({ code: e.code || 'UNAUTHORIZED', message: e.message }); }

        const { event_id } = req.params;
        if (!event_id || !mongoose.Types.ObjectId.isValid(event_id)) {
            return res.status(400).json({ error: 'Invalid event ID' });
        }

        const event = await Event.findByIdAndUpdate(
            event_id,
            { 
                moderationStatus: MODERATION_STATUS.APPROVED,
                moderatedBy: req.user.email,
                moderatedAt: new Date()
            },
            { new: true }
        );

        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }

        // Task #117: Send notification to organizer
        await notifyEventModeration(event_id, MODERATION_STATUS.APPROVED);

        // Audit log
        console.log(`[AUDIT] Admin ${req.user.email} approved event ${event.title} (ID: ${event_id})`);

        return res.status(200).json({
            message: 'Event approved successfully',
            event,
            notificationSent: true
        });

    } catch (e) {
        console.error('Error approving event:', e);
        return res.status(500).json({ error: 'Failed to approve event' });
    }
}

// API Endpoint to reject event
exports.rejectEvent = async (req,res) => {
    try {
        // Admin only
        const { ensureAdmin } = require('../utils/authHelpers');
        try { await ensureAdmin(req); } catch (e) { return res.status(e.status || 401).json({ code: e.code || 'UNAUTHORIZED', message: e.message }); }

        const { event_id } = req.params;
        const { reason } = req.body;

        if (!event_id || !mongoose.Types.ObjectId.isValid(event_id)) {
            return res.status(400).json({ error: 'Invalid event ID' });
        }

        const event = await Event.findByIdAndUpdate(
            event_id,
            { 
                moderationStatus: MODERATION_STATUS.REJECTED,
                moderationNotes: reason,
                moderatedBy: req.user.email,
                moderatedAt: new Date()
            },
            { new: true }
        );

        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }

        // Task #117: Send notification to organizer
        await notifyEventModeration(event_id, MODERATION_STATUS.REJECTED, reason);

        // Audit log
        console.log(`[AUDIT] Admin ${req.user.email} rejected event ${event.title} (ID: ${event_id})`);
        if (reason) {
            console.log(`[AUDIT] Rejection reason: ${reason}`);
        }

        return res.status(200).json({
            message: 'Event rejected successfully',
            event,
            reason,
            notificationSent: true
        });

    } catch (e) {
        console.error('Error rejecting event:', e);
        return res.status(500).json({ error: 'Failed to reject event' });
    }
}

// API Endpoint to flag event
exports.flagEvent = async (req,res) => {
    try {
        // Admin only
        const { ensureAdmin } = require('../utils/authHelpers');
        try { await ensureAdmin(req); } catch (e) { return res.status(e.status || 401).json({ code: e.code || 'UNAUTHORIZED', message: e.message }); }

        const { event_id } = req.params;
        const { flagReason } = req.body;

        if (!event_id || !mongoose.Types.ObjectId.isValid(event_id)) {
            return res.status(400).json({ error: 'Invalid event ID' });
        }

        if (!flagReason) {
            return res.status(400).json({ error: 'Flag reason is required' });
        }

        const event = await Event.findByIdAndUpdate(
            event_id,
            {
                moderationStatus: MODERATION_STATUS.FLAGGED,
                moderationNotes: flagReason,
                moderatedBy: req.user.email,
                moderatedAt: new Date()
            },
            { new: true }
        );

        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }

        // Task #117: Send notification to organizer
        await notifyEventModeration(event_id, MODERATION_STATUS.FLAGGED, flagReason);

        // Audit log (Task #115 - flagging system)
        console.log(`[AUDIT] Admin ${req.user.email} flagged event ${event.title} (ID: ${event_id})`);
        console.log(`[AUDIT] Flag reason: ${flagReason}`);

        return res.status(200).json({
            message: 'Event flagged successfully',
            event: {
                _id: event._id,
                title: event.title,
                moderationStatus: event.moderationStatus,
                moderationNotes: event.moderationNotes,
                flagReason
            },
            notificationSent: true
        });

    } catch (e) {
        console.error('Error flagging event:', e);
        return res.status(500).json({ error: 'Failed to flag event' });
    }
}

// API Endpoint to get all tickets (admin only)
exports.getAllTickets = async (req,res) => {
    try {
        // Admin only
        const { ensureAdmin } = require('../utils/authHelpers');
        try { await ensureAdmin(req); } catch (e) { return res.status(e.status || 401).json({ code: e.code || 'UNAUTHORIZED', message: e.message }); }

        const tickets = await Ticket.find()
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
                path: 'registration',
                select: 'registrationId quantity'
            })
            .sort({ createdAt: -1 })
            .lean()
            .exec();

        return res.status(200).json({
            message: 'All tickets fetched successfully',
            total: tickets.length,
            tickets
        });

    } catch (e) {
        console.error('Error fetching all tickets:', e);
        return res.status(500).json({ error: 'Failed to fetch tickets' });
    }
}

// API Endpoint to count tickets (admin only)
exports.countTickets = async (req,res) => {
    try {
        // Admin only
        const { ensureAdmin } = require('../utils/authHelpers');
        try { await ensureAdmin(req); } catch (e) { return res.status(e.status || 401).json({ code: e.code || 'UNAUTHORIZED', message: e.message }); }

        const { event_id } = req.query;
        const filter = event_id ? { event: event_id } : {};
        const count = await Ticket.countDocuments(filter);

        return res.status(200).json({
            message: event_id
                ? `Total number of tickets for event ${event_id}`
                : 'Total number of tickets in the system',
            totalTickets: count
        });

    } catch (e) {
        console.error('Error counting tickets:', e);
        return res.status(500).json({ error: 'Failed to count tickets' });
    }
}

// API Endpoint to update ticket status (admin only)
exports.updateTicket = async (req,res) => {
    try {
        // Admin only
        const { ensureAdmin } = require('../utils/authHelpers');
        try { await ensureAdmin(req); } catch (e) { return res.status(e.status || 401).json({ code: e.code || 'UNAUTHORIZED', message: e.message }); }

        const { ticket_id } = req.params;
        const { status } = req.body;
        const valid_status = ['valid', 'used', 'cancelled'];

        // Validate ticket_id
        if (!ticket_id) {
            return res.status(400).json({ error: 'ticket_id required' });
        }

        if (!mongoose.Types.ObjectId.isValid(ticket_id)) {
            return res.status(400).json({ error: 'Invalid ticket id format' });
        }

        // Validate status
        if (!status) {
            return res.status(400).json({ error: 'status required' });
        }

        if (!valid_status.includes(status)) {
            return res.status(400).json({ error: 'Invalid status value. Must be one of: valid, used, cancelled' });
        }

        const ticket = await Ticket.findById(ticket_id);
        if (!ticket) {
            return res.status(404).json({ error: 'Ticket not found' });
        }

        const updatedTicket = await Ticket.findByIdAndUpdate(ticket_id, { status: status }, { new: true });

        return res.status(200).json({
            message: 'Ticket updated successfully',
            ticket: updatedTicket
        });

    } catch (e) {
        console.error('Error updating ticket:', e);
        return res.status(500).json({ error: 'Failed to update ticket' });
    }
}

// API Endpoint to delete ticket (admin only)
exports.deleteTicket = async (req,res) => {
    try {
        // Admin only
        const { ensureAdmin } = require('../utils/authHelpers');
        try { await ensureAdmin(req); } catch (e) { return res.status(e.status || 401).json({ code: e.code || 'UNAUTHORIZED', message: e.message }); }

        const { ticket_id } = req.params;

        if (!ticket_id) {
            return res.status(400).json({ error: 'ticket_id required' });
        }

        // Find ticket
        const ticket = await Ticket.findById(ticket_id)
            .populate('event')
            .populate('registration');

        if (!ticket) {
            return res.status(404).json({ error: 'Ticket not found' });
        }

        // Perform deletion and related updates in a session
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            await Ticket.findByIdAndDelete(ticket_id).session(session);

            // Find the event (ticket.event may be ObjectId or populated doc)
            const event_id = ticket.event && (ticket.event._id ? ticket.event._id : ticket.event);
            const event = await Event.findById(event_id).session(session);
            if (!event) {
                await session.abortTransaction();
                session.endSession();
                return res.status(400).json({ error: 'Event could not be found with ticket' });
            }

            // Find the registration (ticket.registration may be ObjectId or populated doc)
            const regId = ticket.registration && (ticket.registration._id ? ticket.registration._id : ticket.registration);
            const reg = await Registration.findById(regId).session(session);
            if (!reg) {
                await session.abortTransaction();
                session.endSession();
                return res.status(400).json({ error: 'Registration info could not be found with ticket' });
            }

            // Remove ticket from registration and update counters
            await Registration.updateOne(
                { _id: reg._id },
                { 
                    $pull: { ticketIds: ticket_id },
                    $inc: { ticketsIssued: -1 }
                },
                { session }
            );

            // Ensure ticketsIssued does not become negative (defensive): clamp to 0 if below
            await Registration.updateOne(
                { _id: reg._id, ticketsIssued: { $lt: 0 } },
                { $set: { ticketsIssued: 0 } },
                { session }
            );

            // Change event capacity (increment by 1 per ticket)
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

            return res.status(200).json({ message: 'Ticket deleted successfully' });

        } catch (e) {
            await session.abortTransaction();
            session.endSession();
            console.error('Error deleting ticket:', e);
            return res.status(500).json({ error: 'Failed to delete ticket' });
        }

    } catch (e) {
        console.error('Error deleting ticket:', e);
        return res.status(500).json({ error: 'Failed to delete ticket' });
    }
}

// API Endpoint to get all registrations (admin only)
exports.getAllRegistrations = async (req,res) => {
    try {
        // Admin only
        const { ensureAdmin } = require('../utils/authHelpers');
        try { await ensureAdmin(req); } catch (e) { return res.status(e.status || 401).json({ code: e.code || 'UNAUTHORIZED', message: e.message }); }

        const registrations = await Registration.find()
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
            })
            .sort({ createdAt: -1 })
            .lean()
            .exec();

        return res.status(200).json({
            message: 'All registrations fetched successfully',
            total: registrations.length,
            registrations
        });

    } catch (e) {
        console.error('Error fetching all registrations:', e);
        return res.status(500).json({ error: 'Failed to fetch all registrations' });
    }
}

// API Endpoint to delete a user (admin-forced) - For spam/banned users
exports.deleteUser = async (req,res) => {
    try {
        // Admin only
        const { ensureAdmin } = require('../utils/authHelpers');
        try { await ensureAdmin(req); } catch (e) { return res.status(e.status || 401).json({ code: e.code || 'UNAUTHORIZED', message: e.message }); }

        const { user_id } = req.params;

        // Validate user_id
        if (!user_id) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        if (!mongoose.Types.ObjectId.isValid(user_id)) {
            return res.status(400).json({ error: 'Invalid user ID format' });
        }

        // Find user
        const user = await User.findById(user_id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Prevent admin from deleting themselves
        if (user._id.toString() === req.user._id.toString()) {
            return res.status(400).json({ error: 'Cannot delete your own account' });
        }

        // Prevent deleting administrators (optional safety check)
        const adminCheck = await Administrator.findOne({ email: user.email }).lean();
        if (adminCheck) {
            return res.status(403).json({ error: 'Cannot delete an administrator account. Use a different method for administrator management.' });
        }

        // Perform deletion and related cleanup in a session
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            // Delete all tickets for this user
            const tickets = await Ticket.find({ user: user_id }).session(session);
            const ticketIds = tickets.map(t => t._id);
            if (ticketIds.length > 0) {
                await Ticket.deleteMany({ _id: { $in: ticketIds } }).session(session);
            }

            // Delete all registrations for this user
            const registrations = await Registration.find({ user: user_id }).session(session);
            const registrationIds = registrations.map(r => r._id);
            if (registrationIds.length > 0) {
                // Remove user from event's registered_users arrays
                for (const reg of registrations) {
                    await Event.updateOne(
                        { _id: reg.event },
                        { $pull: { registered_users: user_id } },
                        { session }
                    );
                    // Remove from waitlist if present
                    await Event.updateOne(
                        { _id: reg.event },
                        { $pull: { waitlist: reg._id } },
                        { session }
                    );
                }
                await Registration.deleteMany({ _id: { $in: registrationIds } }).session(session);
            }

            // Delete the user
            await User.findByIdAndDelete(user_id, { session });

            await session.commitTransaction();
            session.endSession();

            // Audit log
            console.log(`[AUDIT] Admin ${req.user.email} deleted user ${user.email || user.username} (ID: ${user_id}) - Reason: spam/banned user`);

            return res.status(200).json({
                message: 'User and associated data deleted successfully',
                deletedUser: {
                    _id: user._id,
                    email: user.email,
                    username: user.username
                }
            });

        } catch (e) {
            await session.abortTransaction();
            session.endSession();
            console.error('Error during user deletion transaction:', e);
            return res.status(500).json({ error: 'Failed to delete user and associated data' });
        }

    } catch (e) {
        console.error('Error deleting user:', e);
        return res.status(500).json({ error: 'Failed to delete user' });
    }
}

// ========== ORGANIZATION DELETION ==========

// API Endpoint to delete an organization (admin only) - For fraudulent org cleanup
exports.deleteOrganization = async (req,res) => {
    try {
        // Admin only
        const { ensureAdmin } = require('../utils/authHelpers');
        try { await ensureAdmin(req); } catch (e) { return res.status(e.status || 401).json({ code: e.code || 'UNAUTHORIZED', message: e.message }); }

        const { org_id } = req.params;

        // Validate org_id
        if (!org_id) {
            return res.status(400).json({ error: 'Organization ID is required' });
        }

        if (!mongoose.Types.ObjectId.isValid(org_id)) {
            return res.status(400).json({ error: 'Invalid organization ID format' });
        }

        // Find organization
        const organization = await Organization.findById(org_id);
        if (!organization) {
            return res.status(404).json({ error: 'Organization not found' });
        }

        // Perform deletion and related cleanup in a session
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            // Find all events for this organization
            const events = await Event.find({ organization: org_id }).session(session);
            const eventIds = events.map(e => e._id);

            // Delete all tickets and registrations for each event
            if (eventIds.length > 0) {
                // Get all registrations for these events
                const registrations = await Registration.find({ event: { $in: eventIds } }).session(session);
                const registrationIds = registrations.map(r => r._id);

                // Delete all tickets linked to these registrations
                if (registrationIds.length > 0) {
                    await Ticket.deleteMany({ registration: { $in: registrationIds } }).session(session);
                }

                // Delete all registrations
                if (registrationIds.length > 0) {
                    await Registration.deleteMany({ _id: { $in: registrationIds } }).session(session);
                }

                // Delete all events
                await Event.deleteMany({ _id: { $in: eventIds } }).session(session);
            }

            // Delete the organization
            await Organization.findByIdAndDelete(org_id, { session });

            await session.commitTransaction();
            session.endSession();

            // Audit log
            console.log(`[AUDIT] Admin ${req.user.email} deleted organization ${organization.name} (ID: ${org_id}) - Reason: fraudulent org cleanup`);
            if (events.length > 0) {
                console.log(`[AUDIT] Deleted ${events.length} associated events`);
            }

            return res.status(200).json({
                message: 'Organization and associated data deleted successfully',
                deletedOrganization: {
                    _id: organization._id,
                    name: organization.name,
                    contactEmail: organization.contact.email
                },
                deletedEvents: events.length
            });

        } catch (e) {
            await session.abortTransaction();
            session.endSession();
            console.error('Error during organization deletion transaction:', e);
            return res.status(500).json({ error: 'Failed to delete organization and associated data' });
        }

    } catch (e) {
        console.error('Error deleting organization:', e);
        return res.status(500).json({ error: 'Failed to delete organization' });
    }
}

