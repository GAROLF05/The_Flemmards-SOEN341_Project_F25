/* NOTE: This file should only contain the following:
- Express App setup
- Dotenv Setup
- DB setup and connection
- Middlewares
- Route mounting (i.e. app.use(/api/route, routeName))
- Server startup (app.listen(PORT, ...))
*/

const path = require('path');
// Express setup
const express = require('express');

// Dotenv setup
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

// MongoDB setup
const mongoose = require('mongoose');
const connectToDB = require('./config/database')

// App setup
const app = express();
const PORT = 3000;

// Middlewares
app.use(express.json())
app.use(express.text({ type: 'text/plain' }))

// CORS middleware to handle cross-origin requests
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

// Import routes
const ticketRoutes = require('./routes/tickets');
const registrationRoutes = require('./routes/registrations')

// Mount routes
app.use('/api/tickets', ticketRoutes);
app.use('api/registrations', registrationRoutes);

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


