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


// Middlewares
const { requireAuth, requireAdmin } = require('../middlewares/auth');

// Create
router.post('/register', requireAuth, registrationController.registerToEvent);


// Read
router.get('/get/:reg_id', requireAuth, registrationController.getRegistrationById);
router.get('/get/by-regid/:registrationId', requireAuth, registrationController.getRegistrationByRegId);
router.get('/get/by-user/:user_id', requireAuth, registrationController.getRegistrationByUser);
router.get('/get/by-event/:event_id', requireAuth, registrationController.getRegistrationByEvent);

// Update / Cancel / Delete
router.put('/update/:reg_id', requireAuth, registrationController.updateRegistration);
router.put('/cancel/:reg_id', requireAuth, registrationController.cancelRegistration);
router.delete('/delete/:reg_id', requireAuth, registrationController.deleteRegistration);


// Export
module.exports = router;
