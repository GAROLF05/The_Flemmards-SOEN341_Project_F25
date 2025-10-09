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


// CRUD MANAGEMENT
router.get('/get/all', registrationController.getAllRegistrations);

// Create / promote
router.post('/register', registrationController.registerToEvent);
router.put('/waitlist/promote/:event_id', registrationController.promoteWaitlistedUser);

// Read
router.get('/get/:reg_id', registrationController.getRegistrationById);
router.get('/get/by-regid/:registrationId', registrationController.getRegistrationByRegId);
router.get('/get/by-user/:user_id', registrationController.getRegistrationByUser);
router.get('/get/by-event/:event_id', registrationController.getRegistrationByEvent);

// Update / Cancel / Delete
router.put('/update/:reg_id', registrationController.updateRegistration);
router.put('/cancel/:reg_id', registrationController.cancelRegistration);
router.delete('/delete/:reg_id', registrationController.deleteRegistration);
router.get('/get/by-event/:event_id', registrationController.getRegistrationByEvent);


router.post('/register', registrationController.registerToEvent);
router.put('/waitlist/promote/:event_id', registrationController.promoteWaitlistedUser);

// Export
module.exports = router;