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

// ToDO: Add a verifyUser jwt token

// Create
router.post('/create', eventController.createEvent);

// Read
router.get('/get/all', eventController.getAllEvents);
router.get('/get/:event_id', eventController.getEventById);
router.get('/get/by-organization/:org_id', eventController.getEventByOrganization);
router.get('/get/status/:status', eventController.getEventsByStatus);
router.get('/get/category/:category', eventController.getEventsByCategory);
router.get('/get/daterange', eventController.getEventsByDateRange);
router.get('/get/by-user/:user_id', eventController.getEventsByUserRegistrations);

// Update
router.put('/update/:event_id', eventController.updateEvent);
router.patch('/cancel/:event_id', eventController.cancelEvent);

// Delete
router.delete('/delete/:event_id', eventController.deleteEvent);

// Attendee management
router.get('/get/attendees/:event_id', eventController.getAttendees);
router.get('/get/waitlist/:event_id', eventController.getWaitlistedUsers);
router.patch('/promote/:event_id', eventController.promoteWaitlistedUser);

module.exports = router;
