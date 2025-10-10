/* NOTE: This file should only contain the following:
- Calls to Models (Ticket, User, etc..)
- Functions that handle requests async (req,res)
- Logic for data validation, creation, modification
- Responses sent back to the frontend with res.json({....})
*/

// Models of DB
const Administrator = require('../models/Administrators');
const User = require('../models/User');
const { Event, EVENT_STATUS } = require('../models/Event');
const Organization = require('../models/Organization');
const {Registration, REGISTRATION_STATUS} = require('../models/Registrations');
const Ticket = require('../models/Ticket');

// QR Code setup (npm install qrcode)
const qrcode = require('qrcode');

// Dotenv setup
const path = require('path')
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

// MongoDB setup
const mongoose = require('mongoose');
const { error } = require('console');



exports.getAllEvents = async (req,res) => {

}

exports.getEventById = async (req,res) => {

}

exports.getEventByOrganization = async (req,res) =>{

}

exports.getUpcomingEvents = async (req,res) => {

}

exports.getOngoingEvents = async (req,res) =>{

}

exports.getCompletedEvents = async (req,res) => {

}

exports.getCancelledEvents = async (req,res) =>{

}

exports.createEvent = async (req,res)=>{

}

exports.updateEvent = async (req,res) => {

}

exports.cancelEvent = async (req,res) => {

}

exports.deleteEvent = async (req,res) => {

}

// Optional: getEventsByDate, getEventsByStartTime, getEventsByEndTime


exports.getAttendees = async (req,res) => {

}

exports.getWaitlistedUsers = async (req,res) =>{

}

exports.getAvailabilityOfEvent = async (req,res) => {
    
}







// API endpoint to promote waitlisted user
exports.promoteWaitlistedUser = async (req, res) => {
    const { event_id } = req.params;
    const event = await Event.findById(event_id).populate('waitlist');
    if (!event || event.waitlist.length === 0)
        return res.status(404).json({ message: "No waitlisted users" });

    // Get next registration on the list
    const next = event.waitlist.shift(); // FIFO

    const reg = await Registration.findById(next._id);
    if (!reg)
        return res.status(400).json({error: "Waitlisted Registration not found"});

    if(reg.capacity > (event.capacity || 0)){
        event.waitlist.unshift(next); // Not enough room, put it back in the first position of waitlist
        await event.save();
        return res.status(400).json({
            error: "Not enough capacity to promote to next waitlisted user yet",
            remainingCapacity: event.capacity,
            required: reg.quantity,
        });
    }

    reg.status = REGISTRATION_STATUS.CONFIRMED; // Change the next person's registration status to confirmed
    await reg.save();

    event.capacity = Math.max(0, event.capacity - next.quantity);
    await event.save();

    return res.status(200).json({
        message: "Next user promoted from waitlist",
        promotedUser: reg,
        remainingCapacity: event.capacity,
    });
};