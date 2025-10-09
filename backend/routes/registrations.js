const express = require('express');
const router = express.Router();
const Registration = require('../models/Registrations');

// Basic routes
router.get('/', async (req, res) => {
    try {
        const registrations = await Registration.find();
        res.json(registrations);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
