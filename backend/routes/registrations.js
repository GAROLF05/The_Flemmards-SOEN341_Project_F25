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
const registrationController = require("../controllers/registrationController");


router.post('/register', registrationController.registerToEvent)

// Export
module.exports = router;