/* NOTE: This file should only contain the following:
- Express Router object
- Reference to controller
- get(subpath, controller.method) and post(subpath, controller.method) methods 
- module.exports = router at the end
*/

// Express
const express = require('express');
const router = express.Router();
const Administrator = require('../models/Administrators');
const { Organization, ORGANIZATION_STATUS } = require('../models/Organization');
const { notifyOrganizationStatus, getAllNotifications, getNotificationById } = require('../controllers/notificationController');

// Controller
const adminController = require("../controllers/adminController");

// Middlewares
const { requireAuth, requireAdmin } = require('../middlewares/auth');

// Dashboard and stats
router.get('/dashboard/stats', requireAdmin, adminController.getDashboardStats);
router.get('/analytics', requireAdmin, adminController.getSystemAnalytics);

// Organizer user account management
router.get('/pending-organizers', requireAdmin, adminController.getPendingOrganizers);
router.get('/rejected-organizers', requireAdmin, adminController.getRejectedOrganizers);
router.patch('/approve-organizer/:user_id', requireAdmin, adminController.approveOrganizer);
router.patch('/suspend-organization/:org_id', requireAdmin, adminController.suspendOrganization);
router.delete('/organizations/:org_id', requireAdmin, adminController.deleteOrganization);

// User management
router.get('/users/all', requireAdmin, adminController.getAllUsers);
router.get('/users/count', requireAdmin, adminController.countUsers);
router.patch('/update-user-role/:user_id', requireAdmin, adminController.updateUserRole);
router.delete('/users/:user_id', requireAdmin, adminController.deleteUser);

// Administrator management
router.get('/administrators', requireAdmin, adminController.getAllAdministrators);

// Event moderation
router.get('/pending-events', requireAdmin, adminController.getPendingEvents);
router.patch('/events/approve/:event_id', requireAdmin, adminController.approveEvent);
router.patch('/events/reject/:event_id', requireAdmin, adminController.rejectEvent);
router.patch('/events/flag/:event_id', requireAdmin, adminController.flagEvent);

// Ticket management
router.get('/tickets/all', requireAdmin, adminController.getAllTickets);
router.get('/tickets/count', requireAdmin, adminController.countTickets);
router.put('/tickets/update/:ticket_id', requireAdmin, adminController.updateTicket);
router.delete('/tickets/delete/:ticket_id', requireAdmin, adminController.deleteTicket);

// Registration management
router.get('/registrations/all', requireAdmin, adminController.getAllRegistrations);

module.exports = router;
