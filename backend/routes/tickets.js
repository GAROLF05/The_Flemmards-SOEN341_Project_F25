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
const { requireAuth, requireAdmin } = require('../middlewares/auth');

// Filter tickets by all, _id, or ticketId
router.get('/ticket/all', requireAdmin, ticketController.getAllTickets);
router.get('/ticket/by-id/:ticket_id', requireAuth, ticketController.getTicketsById);
router.get('/ticket/by-ticketid/:ticketID', requireAuth, ticketController.getTicketsByTicketId);

// Count tickets
router.get('/ticket/count/', requireAdmin, ticketController.countTickets);

// Validate tickets (public endpoint used by scanners may be allowed; keep auth optional)
router.get('/ticket/validate', ticketController.validateTicket);

// Ticket CRUD management
router.post('/ticket/create', requireAuth, ticketController.createTicket);
router.put('/ticket/regenqr/:ticket_id', requireAuth, ticketController.regenerateQrCode);
router.put('/ticket/update/:ticket_id', requireAdmin, ticketController.updateTicket); // admin purposes
router.put('/ticket/used/:ticket_id', requireAuth, ticketController.markTicketAsUsed); // quick endpoint for gate staff
router.put('/ticket/cancel/:ticket_id', requireAuth, ticketController.cancelTicket); // status = "cancelled" (owner or admin checks inside controller)
router.delete('/ticket/delete/:ticket_id', requireAdmin, ticketController.deleteTicket); // for admin

// Filter tickets by user or event
router.get('/user/:user_id', requireAuth, ticketController.getTicketsByUser);
router.get('/event/:event_id', requireAuth, ticketController.getTicketsByEvent);

module.exports = router;