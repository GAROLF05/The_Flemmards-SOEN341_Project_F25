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
router.post('/register', ticketController.registerToEvent)
router.post('/create', ticketController.createTicket);

router.get('/', ticketController.getAllTickets);
router.get('/tickets/:ticketID', ticketController.getTicketsById);
router.get('/user/:userId', ticketController.getTicketsByUser);
router.get('/event/:eventId', ticketController.getTicketsByEvent);


router.put('/tickets/update/:field', ticketController.updateTicket);

module.exports = router;