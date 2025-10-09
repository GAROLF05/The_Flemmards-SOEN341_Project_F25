const express = require('express');
const router = express.Router();
const Ticket = require('../models/Ticket');

// Basic routes
router.get('/', async (req, res) => {
    try {
        const tickets = await Ticket.find();
        res.json(tickets);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;