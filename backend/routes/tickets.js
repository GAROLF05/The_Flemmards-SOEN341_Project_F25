// Models of DB
const Administrator = require('./models/Administrators');
const User = require('./models/User');
const { Event } = require('./models/Event');
const Organization = require('./models/Organization');
const Registration = require('./models/Registrations');
const Ticket = require('./models/Ticket');

// Dotenv setup
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });