const path = require('path');
// Express setup
const express = require('express');
const app = express();
const PORT = 3000;

// Dotenv setup
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

// QR Code setup (npm install qrcode)
const qrcode = require('qrcode');

// MongoDB setup
const mongoose = require('mongoose');

// Models of DB
const Administrator = require('./models/Administrators');
const User = require('./models/User');
const { Event } = require('./models/Event');
const Organization = require('./models/Organization');
const Registration = require('./models/Registrations');
const Ticket = require('./models/Ticket');

// DB connection
const connectToDB = require('./config/database')

app.use(express.json())

// connect to MongoDB before starting the server
(async () => {
    try {
        await connectToDB({ retries: 3, backoffMs: 500 });
        console.log('✅ MongoDB connected');

        // only start server *after* DB is ready
        app.listen(PORT, () => {
        console.log(`🚀 Server running at http://localhost:${PORT}`);
        });
    } catch (err) {
        console.error('❌ Failed to connect to MongoDB:', err.message);
        process.exit(1); // stop the server if DB connection fails
    }

    // graceful shutdown
    process.on('SIGINT', async () => {
        await mongoose.connection.close();
        console.log('🛑 MongoDB connection closed');
        process.exit(0);
    });
})();



app.listen(PORT, () => console.log(`Server started on http://localhost:${PORT}/`));
