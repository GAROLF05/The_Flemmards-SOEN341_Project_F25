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
const ticketController = require("../controllers/ticketController");

// ToDO: Add a verifyUser jwt token


// Filter tickets by all, _id, or ticketId
router.get('/ticket/all', ticketController.getAllTickets);
router.get('/ticket/by-id/:ticket_id', ticketController.getTicketsById);
router.get('/ticket/by-ticketid/:ticketID', ticketController.getTicketsByTicketId);

// Count tickets
router.get('/ticket/count/', ticketController.countTickets);

// Validate tickets
router.get('/ticket/validate', ticketController.validateTicket);

// Ticket CRUD management
router.post('/ticket/create', ticketController.createTicket);
router.put('/ticket/regenqr/:ticket_id', ticketController.regenerateQrCode);
router.put('/ticket/update/:ticket_id', ticketController.updateTicket); // admin purposes
router.put('/ticket/used/:ticket_id', ticketController.markTicketAsUsed); // quick endpoint
router.put('/ticket/cancel/:ticket_id', ticketController.cancelTicket); // status = "cancelled"
router.delete('/ticket/delete/:ticket_id', ticketController.deleteTicket); // for admin

// Filter tickets by user or event
router.get('/user/:user_id', ticketController.getTicketsByUser);
router.get('/event/:event_id', ticketController.getTicketsByEvent);

module.exports = router;