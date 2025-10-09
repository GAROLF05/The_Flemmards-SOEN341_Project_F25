const express = require('express');
const router = express.Router();
const Administrator = require('../models/Administrators');

// Basic routes
router.get('/', async (req, res) => {
    try {
        const admins = await Administrator.find();
        res.json(admins);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
