const path = require('path');
// Express setup
const express = require('express');
const app = express();

// Dotenv setup
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const PORT = process.env.PORT || 3000;

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

app.use(express.json());

// Routes
const userRoutes = require('./routes/users');
const eventRoutes = require('./routes/events');
const organizationRoutes = require('./routes/organizations');
const ticketRoutes = require('./routes/tickets');
const registrationRoutes = require('./routes/registrations');
const adminRoutes = require('./routes/admin');

app.use('/api/users', userRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/admin', adminRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

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
