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
const { Organization, ORGANIZATION_STATUS } = require('../models/Organization');
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

// API Endpoint to create organization
exports.createOrganization = async (req,res)=>{
    try {
        const { name, description, website, contact } = req.body;

        // Validate required fields
        if (!name || !description || !website || !contact) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Validate contact object structure
        if (!contact.email || !contact.phone) {
            return res.status(400).json({ error: 'Contact object must include email and phone' });
        }

        // Check if user is authenticated and is an organizer
        if (!req.user || !req.user._id) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Check if user already has an organization (one organizer = one organization)
        if (user.organization) {
            return res.status(409).json({ 
                error: 'You already have an organization. One organizer can only have one organization.' 
            });
        }

        // Check if user is an organizer
        if (user.role !== 'Organizer') {
            return res.status(403).json({ error: 'Only organizers can create organizations' });
        }

        // Note: Unapproved organizers can create organizations during signup
        // but cannot create events until approved

        // Create organization with pending status and link to organizer
        const organization = await Organization.create({
            name,
            description,
            website,
            contact,
            status: ORGANIZATION_STATUS.PENDING,
            organizer: user._id
        });

        // Link organization to user (bidirectional relationship)
        user.organization = organization._id;
        await user.save();

        // Populate organizer information in response
        const populatedOrg = await Organization.findById(organization._id)
            .populate('organizer', 'name email username')
            .lean();

        return res.status(201).json({
            message: 'Organization created successfully. Awaiting admin approval.',
            organization: populatedOrg
        });
    } catch (e) {
        console.error('Error creating organization:', e);
        if (e.code === 11000) {
            return res.status(409).json({ error: 'Organization with this name, email, website, or phone already exists' });
        }
        return res.status(500).json({ error: 'Failed to create organization' });
    }
}

// API Endpoint for admins to create organization
exports.adminCreateOrganization = async (req, res) => {
    try {
        // Admin only
        const { ensureAdmin } = require('../utils/authHelpers');
        try { await ensureAdmin(req); } catch (e) { return res.status(e.status || 401).json({ code: e.code || 'UNAUTHORIZED', message: e.message }); }

        const { name, description, website, contact, organizerEmail } = req.body;

        // Validate required fields
        if (!name || !description || !website || !contact) {
            return res.status(400).json({ error: 'Missing required fields: name, description, website, and contact are required' });
        }

        // Validate contact object structure
        if (!contact.email || !contact.phone) {
            return res.status(400).json({ error: 'Contact object must include email and phone' });
        }

        // If organizerEmail is provided, link to that organizer user
        let organizerId = null;
        if (organizerEmail) {
            const organizer = await User.findOne({ email: organizerEmail, role: 'Organizer' });
            if (!organizer) {
                return res.status(404).json({ error: `Organizer with email ${organizerEmail} not found. Please ensure the user exists and has Organizer role.` });
            }
            if (organizer.organization) {
                return res.status(409).json({ error: `Organizer ${organizerEmail} already has an organization` });
            }
            organizerId = organizer._id;
        }

        // Create organization - admins can create with approved status
        const organization = await Organization.create({
            name,
            description,
            website,
            contact,
            status: ORGANIZATION_STATUS.APPROVED, // Admins can approve immediately
            organizer: organizerId // Optional - can be null if no organizer specified
        });

        // If organizer was specified, link organization to user
        if (organizerId) {
            const organizer = await User.findById(organizerId);
            organizer.organization = organization._id;
            await organizer.save();
        }

        // Populate organizer information in response
        const populatedOrg = await Organization.findById(organization._id)
            .populate('organizer', 'name email username')
            .lean();

        return res.status(201).json({
            message: 'Organization created successfully',
            organization: populatedOrg
        });
    } catch (e) {
        console.error('Error creating organization (admin):', e);
        if (e.code === 11000) {
            return res.status(409).json({ error: 'Organization with this name, email, website, or phone already exists' });
        }
        return res.status(500).json({ error: 'Failed to create organization' });
    }
}

// API Endpoint to get all approved organizations with approved organizer users
exports.getAllOrganizations = async (req,res)=>{
    try {
        // Admin only
        const { ensureAdmin } = require('../utils/authHelpers');
        try { await ensureAdmin(req); } catch (e) { return res.status(e.status || 401).json({ code: e.code || 'UNAUTHORIZED', message: e.message }); }

        // Get approved and suspended organizations that have an organizer user
        const organizations = await Organization.find({
            status: { $in: [ORGANIZATION_STATUS.APPROVED, ORGANIZATION_STATUS.SUSPENDED] },
            organizer: { $exists: true, $ne: null }
        })
            .populate({
                path: 'organizer',
                select: 'name email username role',
                match: { role: 'Organizer' } // Only include if user is an Organizer
            })
            .sort({ createdAt: -1 })
            .lean();

        // Filter out organizations where organizer population failed (null organizer or not Organizer role)
        const filteredOrganizations = organizations.filter(org => org.organizer !== null && org.organizer !== undefined);

        return res.status(200).json({
            message: 'Organizations fetched successfully',
            total: filteredOrganizations.length,
            organizations: filteredOrganizations
        });
    } catch (e) {
        console.error('Error fetching organizations:', e);
        return res.status(500).json({ error: 'Failed to fetch organizations' });
    }
}

// API Endpoint to get an organization by _id
exports.getOrganizationById = async (req,res)=>{
    try {
        const { org_id } = req.params;

        if (!org_id) {
            return res.status(400).json({ error: 'Organization ID is required' });
        }

        if (!mongoose.Types.ObjectId.isValid(org_id)) {
            return res.status(400).json({ error: 'Invalid organization ID format' });
        }

        const organization = await Organization.findById(org_id)
            .populate('organizer', 'name email username')
            .lean();

        if (!organization) {
            return res.status(404).json({ error: 'Organization not found' });
        }

        return res.status(200).json({
            message: 'Organization fetched successfully',
            organization
        });
    } catch (e) {
        console.error('Error fetching organization:', e);
        return res.status(500).json({ error: 'Failed to fetch organization' });
    }
}

// API Endpoint to get organization by status
exports.getOrganizationByStatus = async (req,res)=>{
    try {
        // Admin only
        const { ensureAdmin } = require('../utils/authHelpers');
        try { await ensureAdmin(req); } catch (e) { return res.status(e.status || 401).json({ code: e.code || 'UNAUTHORIZED', message: e.message }); }

        const { status } = req.params;

        if (!status) {
            return res.status(400).json({ error: 'Status is required' });
        }

        if (!Object.values(ORGANIZATION_STATUS).includes(status)) {
            return res.status(400).json({ 
                error: `Invalid status. Must be one of: ${Object.values(ORGANIZATION_STATUS).join(', ')}` 
            });
        }

        const organizations = await Organization.find({ status })
            .populate('organizer', 'name email username')
            .sort({ createdAt: -1 })
            .lean();

        return res.status(200).json({
            message: `Organizations with status '${status}' fetched successfully`,
            total: organizations.length,
            organizations
        });
    } catch (e) {
        console.error('Error fetching organizations by status:', e);
        return res.status(500).json({ error: 'Failed to fetch organizations' });
    }
}

// API Endpoint to get pending organizations
exports.getPendingOrganizations = async (req,res)=>{
    try {
        // Admin only
        const { ensureAdmin } = require('../utils/authHelpers');
        try { await ensureAdmin(req); } catch (e) { return res.status(e.status || 401).json({ code: e.code || 'UNAUTHORIZED', message: e.message }); }

        const organizations = await Organization.find({ status: ORGANIZATION_STATUS.PENDING })
            .populate('organizer', 'name email username')
            .sort({ createdAt: -1 })
            .lean();

        return res.status(200).json({
            message: 'Pending organizations fetched successfully',
            total: organizations.length,
            organizations
        });
    } catch (e) {
        console.error('Error fetching pending organizations:', e);
        return res.status(500).json({ error: 'Failed to fetch pending organizations' });
    }
}

// API Endpoint to update organization info
exports.updateOrganization = async (req,res)=>{
    try {
        // Admin only
        const { ensureAdmin } = require('../utils/authHelpers');
        try { await ensureAdmin(req); } catch (e) { return res.status(e.status || 401).json({ code: e.code || 'UNAUTHORIZED', message: e.message }); }

        const { org_id } = req.params;
        const updates = req.body;

        if (!org_id) {
            return res.status(400).json({ error: 'Organization ID is required' });
        }

        if (!mongoose.Types.ObjectId.isValid(org_id)) {
            return res.status(400).json({ error: 'Invalid organization ID format' });
        }

        // Prevent updating _id and organizer (one-to-one relationship must be maintained)
        delete updates._id;
        delete updates.organizer;

        const organization = await Organization.findByIdAndUpdate(
            org_id,
            updates,
            { new: true, runValidators: true }
        )
        .populate('organizer', 'name email username');

        if (!organization) {
            return res.status(404).json({ error: 'Organization not found' });
        }

        return res.status(200).json({
            message: 'Organization updated successfully',
            organization
        });
    } catch (e) {
        console.error('Error updating organization:', e);
        if (e.code === 11000) {
            return res.status(409).json({ error: 'Duplicate value for unique field' });
        }
        return res.status(500).json({ error: 'Failed to update organization' });
    }
}

// API Endpoint to delete an organization
exports.deleteOrganization = async (req,res)=>{
    try {
        // Admin only
        const { ensureAdmin } = require('../utils/authHelpers');
        try { await ensureAdmin(req); } catch (e) { return res.status(e.status || 401).json({ code: e.code || 'UNAUTHORIZED', message: e.message }); }

        const { org_id } = req.params;

        if (!org_id) {
            return res.status(400).json({ error: 'Organization ID is required' });
        }

        if (!mongoose.Types.ObjectId.isValid(org_id)) {
            return res.status(400).json({ error: 'Invalid organization ID format' });
        }

        // Check if organization has events
        const eventsCount = await Event.countDocuments({ organization: org_id });
        if (eventsCount > 0) {
            return res.status(409).json({ 
                error: 'Cannot delete organization with existing events',
                eventsCount 
            });
        }

        // Find organization to get organizer reference before deletion
        const organization = await Organization.findById(org_id);
        if (!organization) {
            return res.status(404).json({ error: 'Organization not found' });
        }

        // Remove organization reference from user if organizer exists
        if (organization.organizer) {
            const organizer = await User.findById(organization.organizer);
            if (organizer && organizer.organization && organizer.organization.toString() === org_id) {
                organizer.organization = null;
                await organizer.save();
            }
        }

        await Organization.findByIdAndDelete(org_id);

        return res.status(200).json({
            message: 'Organization deleted successfully',
            organization
        });
    } catch (e) {
        console.error('Error deleting organization:', e);
        return res.status(500).json({ error: 'Failed to delete organization' });
    }
}

// API Endpoint to get organization's stats
exports.getOrganizationStats = async (req,res)=>{
    try {
        const { org_id } = req.params;

        if (!org_id) {
            return res.status(400).json({ error: 'Organization ID is required' });
        }

        if (!mongoose.Types.ObjectId.isValid(org_id)) {
            return res.status(400).json({ error: 'Invalid organization ID format' });
        }

        const organization = await Organization.findById(org_id)
            .populate('organizer', 'name email username')
            .lean();
        if (!organization) {
            return res.status(404).json({ error: 'Organization not found' });
        }

        // Get total events
        const totalEvents = await Event.countDocuments({ organization: org_id });

        // Get events by status
        const upcomingEvents = await Event.countDocuments({ 
            organization: org_id, 
            status: EVENT_STATUS.UPCOMING 
        });

        const completedEvents = await Event.countDocuments({ 
            organization: org_id, 
            status: EVENT_STATUS.COMPLETED 
        });

        // Get total registrations across all events
        const events = await Event.find({ organization: org_id }).select('_id').lean();
        const eventIds = events.map(e => e._id);
        
        const totalRegistrations = await Registration.countDocuments({ 
            event: { $in: eventIds } 
        });

        return res.status(200).json({
            message: 'Organization stats fetched successfully',
            organizationId: org_id,
            organizationName: organization.name,
            stats: {
                totalEvents,
                upcomingEvents,
                completedEvents,
                totalRegistrations
            }
        });
    } catch (e) {
        console.error('Error fetching organization stats:', e);
        return res.status(500).json({ error: 'Failed to fetch organization stats' });
    }
}

