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
const calendarController = require("../controllers/calendarController");

router.post('/generate/:event_id', calendarController.generateICS);

module.exports = router;