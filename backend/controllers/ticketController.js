// Models of DB
const Administrator = require('./models/Administrators');
const User = require('./models/User');
const { Event } = require('./models/Event');
const Organization = require('./models/Organization');
const Registration = require('./models/Registrations');
const Ticket = require('./models/Ticket');

// QR Code setup (npm install qrcode)
const qrcode = require('qrcode');

// Dotenv setup
const path = require('path')
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

// MongoDB setup
const mongoose = require('mongoose');

exports.createTicket = async(req, res) =>{
    try{
        // Fetch the registration ID of the user and verify the quantity sent by client-side server
        const {registrationId, quantity = 1} =  req.body;
        
        if(!registrationId)
            return res.status(400).json({error: 'Registration ID is required'});
        if (quantity < 1)
            return res.status(400).json({error: "Quantity invalid"});

        // Check DB to see if the registration is valid
        const registration = await Registration.findById(registrationId);
        if (!registration)
            return res.status(400).json({error: "Registration could not be found in DB"})

        // Ensure event isn't ongoing, completed or cancelled
        if (event.status !== Event.EVENT_STATUS.UPCOMING)
            return res.status(400).json({error: "Event is either ongoing, complete, or cancelled"});

        // Ensure capacity is good
        const event = await Event.findById(registration.event)
        if (!event)
            return res.status(400).json({error: "Event does not exist"});
        if (event.capacity < quantity)
            return res.status(400).json({error: "Not enough capacity"});

        event.capacity -= quantity;
        await event.save();
    
        // Create tickets based on registration quantity
        const tickets = [];
        for (let i = 0; i < quantity; i++){
            tickets.push(await Ticket.create({registration: registration._id})); // Refer it to the Mongoose model object ID
        }

        const qrTickets = await Promise.all(
            tickets.map(async (ticket)=>{
                const payload = ticket.ticketId ?? ticket.code ?? ticket._id;
                const dataUrl = await qrcode.toDataURL(payload); // Transforms it into a Base64-encoded image URL
                ticket.qrDataUrl = dataUrl;
                await ticket.save(); // Save the updates made to the ticket
                return {id: ticket._id, code: ticket.code, qrDataUrl: dataUrl};
            })
        )

        return res.status(201).json({ created: qrTickets.length, tickets: results });

    } catch(e){
        console.error('Error:', e);
        return res.status(500).json({error: 'Backend server error'})
    }

}