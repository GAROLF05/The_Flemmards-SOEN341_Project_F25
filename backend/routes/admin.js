const express = require('express');
const router = express.Router();
const Administrator = require('../models/Administrators');
const { Organization, ORGANIZATION_STATUS } = require('../models/Organization');
const { requireAdmin } = require('../middlewares/auth');
const { notifyOrganizationStatus, getAllNotifications, getNotificationById } = require('../controllers/notificationController');

// API Endpoint to approve or reject organizer (Task #121)
router.patch('/approve-organizer/:org_id', requireAdmin, async (req, res) => {
    try {
        const { org_id } = req.params;
        const { status, rejectionReason } = req.body;

        // Validate org_id
        if (!org_id || !require('mongoose').Types.ObjectId.isValid(org_id)) {
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

        // Find and update organization
        const organization = await Organization.findById(org_id);

        if (!organization) {
            return res.status(404).json({ error: 'Organization not found' });
        }

        // Update status
        organization.status = status;
        if (status === 'approved') {
            organization.verified = true;
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

    } catch (error) {
        console.error('Error approving/rejecting organization:', error);
        return res.status(500).json({ error: 'Failed to update organization status' });
    }
});

// Task #123 & #117: Notification management routes
router.get('/notifications', requireAdmin, getAllNotifications);
router.get('/notifications/:notification_id', requireAdmin, getNotificationById);

// Basic routes
router.get('/', async (req, res) => {
    try {
        const admins = await Administrator.find();
        res.json(admins);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
