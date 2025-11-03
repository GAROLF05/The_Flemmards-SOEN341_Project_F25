/* NOTE: This file exports the Express app without starting the server.
 * Used for testing purposes.
 */

const path = require("path");
// Express setup
const express = require("express");
const cors = require("cors");

// Cookies
const cookieParser = require("cookie-parser");

// Dotenv setup (optional for tests)
if (process.env.NODE_ENV !== 'test') {
  const dotenv = require("dotenv");
  dotenv.config({ path: path.resolve(__dirname, "..", ".env") });
}

const { checkAuth } = require("./middlewares/auth");

// App setup
const app = express();

// Middlewares
app.use(express.json());
app.use(express.text({ type: "text/plain" }));
app.use(cookieParser());
app.use(cors()); // Use the cors middleware package

// Check authentication
app.use(checkAuth);

// Import routes
const ticketRoutes = require("./routes/tickets");
const registrationRoutes = require("./routes/registrations");
const eventRoutes = require('./routes/events');
const userRoutes = require("./routes/users");
const calendarRoutes = require('./routes/calendar');
const orgRoutes = require('./routes/organizations');
const adminRoutes = require('./routes/admin');

// Mount routes
app.use('/api/tickets', ticketRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/events', eventRoutes);
app.use("/api/users", userRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/org', orgRoutes);
app.use('/api/admin', adminRoutes);

// Serve uploaded images statically
app.use('/uploads/events', express.static(path.join(__dirname, 'uploads', 'events')));

module.exports = app;

