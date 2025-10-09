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

router.post('/create', ticketController.createTicket);

router.get('/', ticketController.getAllTickets);

router.get('/ticket/by-id/:ticket_id', ticketController.getTicketsById);
router.get('/ticket/by-ticketid/:ticketID', ticketController.getTicketsByTicketId);

router.get('/ticket/count/', ticketController.countTickets);
router.get('/ticket/count/event/:event_id', ticketController.countTicketsPerEvents);

router.put('/ticket/regenqr/:ticket_id', ticketController.regenerateQrCode);
router.put('/ticket/update/:ticket_id/:field', ticketController.updateTicket);
router.put('/ticket/used/:ticket_id', ticketController.markTicketAsUsed);

router.get('/user/:user_id', ticketController.getTicketsByUser);
router.get('/event/:event_id', ticketController.getTicketsByEvent);

module.exports = router;