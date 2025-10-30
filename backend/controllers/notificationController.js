/* 
 * Notification Controller - Task #123 & Task #117
 * Basic notification system for organizer approval/rejection and event moderation
 * Note: This is a mock system that logs notifications instead of sending actual emails
 * In production, integrate with email service like SendGrid, Nodemailer, etc.
 */

const { Organization, ORGANIZATION_STATUS } = require('../models/Organization');
const { Event, MODERATION_STATUS } = require('../models/Event');
const Administrator = require('../models/Administrators');

// Mock notification system - logs to console and stores in memory
// In production, replace with actual email service
class NotificationService {
    constructor() {
        this.notifications = []; // In-memory storage for demo
    }

    // Task #123: Notify organizer of approval/rejection
    async notifyOrganizationStatus(organizationId, status, rejectionReason = null) {
        try {
            const org = await Organization.findById(organizationId).lean();
            if (!org) {
                console.error(`[NOTIFICATION ERROR] Organization ${organizationId} not found`);
                return;
            }

            const notification = {
                id: Date.now().toString(),
                type: 'organization_status',
                recipient: org.contact.email,
                organizationName: org.name,
                status,
                rejectionReason,
                createdAt: new Date(),
                sent: false
            };

            // Mock email content
            let subject, message;
            if (status === ORGANIZATION_STATUS.APPROVED) {
                subject = `✅ Your organization "${org.name}" has been approved!`;
                message = `
Dear ${org.name} Team,

Congratulations! Your organization has been approved and you can now start creating events on our platform.

You can now:
- Create and manage events
- Access your organization dashboard
- Manage event registrations

Thank you for joining our platform!

Best regards,
Event Management Team
                `;
            } else if (status === ORGANIZATION_STATUS.REJECTED) {
                subject = `❌ Your organization "${org.name}" application has been reviewed`;
                message = `
Dear ${org.name} Team,

We regret to inform you that your organization application has been declined.

Reason: ${rejectionReason || 'No specific reason provided'}

You can resubmit your application after addressing the concerns mentioned above.

If you have any questions, please contact our support team.

Best regards,
Event Management Team
                `;
            }

            notification.subject = subject;
            notification.message = message;

            // Store notification (in production, send actual email here)
            this.notifications.push(notification);

            // Log the notification
            console.log(`[NOTIFICATION] ${status.toUpperCase()} - Organization: ${org.name}`);
            console.log(`[NOTIFICATION] To: ${org.contact.email}`);
            console.log(`[NOTIFICATION] Subject: ${subject}`);
            if (rejectionReason) {
                console.log(`[NOTIFICATION] Reason: ${rejectionReason}`);
            }

            // Simulate email sending success
            notification.sent = true;
            notification.sentAt = new Date();

            return notification;

        } catch (error) {
            console.error('[NOTIFICATION ERROR] Failed to send organization status notification:', error);
            return null;
        }
    }

    // Task #117: Notify organizer of event moderation decision
    async notifyEventModeration(eventId, moderationStatus, moderationNotes = null) {
        try {
            const event = await Event.findById(eventId)
                .populate('organization', 'name contact')
                .lean();

            if (!event) {
                console.error(`[NOTIFICATION ERROR] Event ${eventId} not found`);
                return;
            }

            const notification = {
                id: Date.now().toString(),
                type: 'event_moderation',
                recipient: event.organization.contact.email,
                organizationName: event.organization.name,
                eventTitle: event.title,
                moderationStatus,
                moderationNotes,
                createdAt: new Date(),
                sent: false
            };

            // Mock email content
            let subject, message;
            if (moderationStatus === MODERATION_STATUS.APPROVED) {
                subject = `✅ Your event "${event.title}" has been approved!`;
                message = `
Dear ${event.organization.name} Team,

Great news! Your event "${event.title}" has been approved and is now live on our platform.

Event Details:
- Title: ${event.title}
- Date: ${new Date(event.start_at).toLocaleDateString()}
- Status: Approved

Students can now register for your event!

Best regards,
Event Management Team
                `;
            } else if (moderationStatus === MODERATION_STATUS.REJECTED) {
                subject = `❌ Your event "${event.title}" requires attention`;
                message = `
Dear ${event.organization.name} Team,

Your event "${event.title}" has been reviewed and requires modifications before approval.

Reason: ${moderationNotes || 'No specific reason provided'}

Please edit your event to address the concerns and resubmit for review.

Best regards,
Event Management Team
                `;
            } else if (moderationStatus === MODERATION_STATUS.FLAGGED) {
                subject = `⚠️ Your event "${event.title}" has been flagged for review`;
                message = `
Dear ${event.organization.name} Team,

Your event "${event.title}" has been flagged for review due to potential policy violations.

Issue: ${moderationNotes || 'No specific issue provided'}

Please review our community guidelines and make necessary adjustments to your event.

Best regards,
Event Management Team
                `;
            }

            notification.subject = subject;
            notification.message = message;

            // Store notification (in production, send actual email here)
            this.notifications.push(notification);

            // Log the notification
            console.log(`[NOTIFICATION] EVENT ${moderationStatus.toUpperCase()} - Event: ${event.title}`);
            console.log(`[NOTIFICATION] To: ${event.organization.contact.email}`);
            console.log(`[NOTIFICATION] Subject: ${subject}`);
            if (moderationNotes) {
                console.log(`[NOTIFICATION] Notes: ${moderationNotes}`);
            }

            // Simulate email sending success
            notification.sent = true;
            notification.sentAt = new Date();

            return notification;

        } catch (error) {
            console.error('[NOTIFICATION ERROR] Failed to send event moderation notification:', error);
            return null;
        }
    }

    // Get all notifications (for admin dashboard)
    async getAllNotifications(req, res) {
        try {
            // Admin only
            if (!req.user) return res.status(401).json({ code: 'UNAUTHORIZED', message: 'Authentication required' });
            const admin = await Administrator.findOne({ email: req.user.email }).lean();
            if (!admin) return res.status(403).json({ code: 'FORBIDDEN', message: 'Admin access required' });

            return res.status(200).json({
                message: 'Notifications fetched successfully',
                total: this.notifications.length,
                notifications: this.notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            });
        } catch (error) {
            return res.status(500).json({ error: 'Failed to fetch notifications' });
        }
    }

    // Get notification by ID
    async getNotificationById(req, res) {
        try {
            // Admin only
            if (!req.user) return res.status(401).json({ code: 'UNAUTHORIZED', message: 'Authentication required' });
            const admin = await Administrator.findOne({ email: req.user.email }).lean();
            if (!admin) return res.status(403).json({ code: 'FORBIDDEN', message: 'Admin access required' });

            const { notification_id } = req.params;
            const notification = this.notifications.find(n => n.id === notification_id);

            if (!notification) {
                return res.status(404).json({ error: 'Notification not found' });
            }

            return res.status(200).json({
                message: 'Notification fetched successfully',
                notification
            });
        } catch (error) {
            return res.status(500).json({ error: 'Failed to fetch notification' });
        }
    }
}

// Create singleton instance
const notificationService = new NotificationService();

module.exports = {
    notificationService,
    // Export methods for use in controllers
    notifyOrganizationStatus: (orgId, status, reason) => notificationService.notifyOrganizationStatus(orgId, status, reason),
    notifyEventModeration: (eventId, status, notes) => notificationService.notifyEventModeration(eventId, status, notes),
    // Export HTTP handlers
    getAllNotifications: (req, res) => notificationService.getAllNotifications(req, res),
    getNotificationById: (req, res) => notificationService.getNotificationById(req, res)
};
