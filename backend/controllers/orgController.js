/* NOTE: This file should only contain the following:
- Calls to Models (Ticket, User, etc..)
- Functions that handle requests async (req,res)
- Logic for data validation, creation, modification
- Responses sent back to the frontend with res.json({....})
*/

/* For MongoDB session transactions, use it when doing multiple CRUD operations in
multiple collections/DB, it ensures to abort at anytime if any operation fails for 
any reason. Lil cheat sheet to help:
===============================================
const session = await mongoose.startSession();
session.startTransaction();
try {
    await Model1.updateOne(..., { session });
    await Model2.create(..., { session });
    // other atomic ops
    await session.commitTransaction();
} catch (e) {
    await session.abortTransaction();
} finally {
    session.endSession();
}
=============================================

*/
// Models of DB
const Administrator = require('../models/Administrators');
const User = require('../models/User');
const { Event, EVENT_STATUS, CATEGORY } = require('../models/Event');
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

// API Endpoint to create organization
exports.createOrganization = async (req,res)=>{

}

// API Endpoint to get all organization
exports.getAllOrganizations = async (req,res)=>{

}

// API Endpoint to get an organization by _id
exports.getOrganizationById = async (req,res)=>{

}

// API Endpoint to get organization by status
exports.getOrganizationByStatus = async (req,res)=>{

}

// API Endpoint to get pending organizations
exports.getPendingOrganizations = async (req,res)=>{

}

// API Endpoint to update organization info
exports.updateOrganization = async (req,res)=>{

}

// API Endpoint to delete an organization
exports.deleteOrganization = async (req,res)=>{

}

// API Endpoint to get organization's stats
exports.getOrganizationStats = async (req,res)=>{
    
}

