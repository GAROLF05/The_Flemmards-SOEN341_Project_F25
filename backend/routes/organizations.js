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
const organizationController = require('../controllers/orgController');

// Middlewares
const { requireAuth, requireAdmin } = require('../middlewares/auth');

// Create organization (requires authentication - organizer only)
router.post('/create', requireAuth, organizationController.createOrganization);

// Read
router.get('/all', requireAdmin, organizationController.getAllOrganizations);
router.get('/:org_id', organizationController.getOrganizationById);
router.get('/status/:status', requireAdmin, organizationController.getOrganizationByStatus);
router.get('/pending/list', requireAdmin, organizationController.getPendingOrganizations);
router.get('/stats/:org_id', organizationController.getOrganizationStats);

// Update
router.put('/update/:org_id', requireAdmin, organizationController.updateOrganization);

// Delete
router.delete('/delete/:org_id', requireAdmin, organizationController.deleteOrganization);

module.exports = router;
