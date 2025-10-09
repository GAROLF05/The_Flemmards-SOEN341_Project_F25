const express = require('express');
const router = express.Router();
const Organization = require('../models/Organization');

// Basic routes
router.get('/', async (req, res) => {
    try {
        const organizations = await Organization.find();
        res.json(organizations);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
