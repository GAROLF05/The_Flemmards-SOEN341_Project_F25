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
const upload = require('../middlewares/upload');
const handleUploadError = require('../middlewares/uploadErrorHandler');

// ToDO: Add a verifyUser jwt token

// Public routes for students to browse events
router.get('/browse', eventController.browseEvents);

// Create (with optional image upload - accepts multipart/form-data or JSON)
// Organizers can create events for their own organization, admins can create for any
router.post('/create', requireAuth, upload.single('image'), handleUploadError, eventController.createEvent);

// Read
router.get('/get/all', requireAdmin, eventController.getAllEvents);
router.get('/get/:event_id', requireAdmin, eventController.getEventById);
router.get('/get/by-organization/:org_id', eventController.getEventByOrganization);
router.get('/get/status/:status', eventController.getEventsByStatus);
router.get('/get/category/:category', eventController.getEventsByCategory);
router.get('/get/daterange', eventController.getEventsByDateRange);
router.get('/get/by-user/:user_id', eventController.getEventsByUserRegistrations);

// Update (with optional image upload - accepts multipart/form-data or JSON)
router.put('/update/:event_id', requireAdmin, upload.single('image'), handleUploadError, eventController.updateEvent);
router.patch('/cancel/:event_id', requireAdmin, eventController.cancelEvent);

// Delete
router.delete('/delete/:event_id', requireAdmin, eventController.deleteEvent);

// Attendee management (Admin or Event Organizer)
router.get('/get/attendees/:event_id', requireAuth, eventController.getAttendees);
router.get('/export-csv/:event_id', requireAuth, eventController.exportAttendeesCSV);
router.get('/get/waitlist/:event_id', requireAdmin, eventController.getWaitlistedUsers);
router.patch('/promote/:event_id', requireAdmin, eventController.promoteWaitlistedUser);

// Get events by moderation status (Task #116)
router.get('/moderation/status/:status', requireAdmin, eventController.getEventsByModerationStatus);
router.get('/moderation/pending', requireAdmin, eventController.getPendingModerationEvents);

module.exports = router;
