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




// Waitlist
router.put('/waitlist/promote/:event_id', eventController.promoteWaitlistedUser);

module.exports = router;
