/* NOTE: This file should only contain the following:
- Express Router object
- Reference to controller
- get(subpath, controller.method) and post(subpath, controller.method) methods 
- module.exports = router at the end
*/

// Express
const express = require('express');
const router = express.Router();

// Controller
const eventController = require("../controllers/eventController");

// Middlewares
const { requireAuth, requireAdmin } = require('../middlewares/auth');

// ToDO: Add a verifyUser jwt token

// Public routes for students to browse events
//router.get('/browse', eventController.browseEvents);

// Create
router.post('/create', requireAdmin, eventController.createEvent);

// Read
router.get('/get/all', requireAdmin, eventController.getAllEvents);
router.get('/get/:event_id', requireAdmin, eventController.getEventById);
router.get('/get/by-organization/:org_id', eventController.getEventByOrganization);
router.get('/get/status/:status', eventController.getEventsByStatus);
router.get('/get/category/:category', eventController.getEventsByCategory);
router.get('/get/daterange', eventController.getEventsByDateRange);
router.get('/get/by-user/:user_id', eventController.getEventsByUserRegistrations);

// Update
router.put('/update/:event_id', requireAdmin, eventController.updateEvent);
router.patch('/cancel/:event_id', requireAdmin, eventController.cancelEvent);

// Delete
router.delete('/delete/:event_id', requireAdmin, eventController.deleteEvent);

// Attendee management
router.get('/get/attendees/:event_id', requireAdmin, eventController.getAttendees);
router.get('/get/waitlist/:event_id', requireAdmin, eventController.getWaitlistedUsers);
router.patch('/promote/:event_id', requireAdmin, eventController.promoteWaitlistedUser);

// Admin moderation (Task #114)
router.patch('/approve/:event_id', requireAdmin, eventController.approveEvent);
router.patch('/reject/:event_id', requireAdmin, eventController.rejectEvent);
router.patch('/flag/:event_id', requireAdmin, eventController.flagEvent);

module.exports = router;
