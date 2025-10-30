# 🚀 Quick Start Guide

**Get the Event Management System Backend running in 5 minutes!**

---

## Prerequisites

- Node.js (v14 or higher)
- MySQL database
- Terminal/Command line access

---

## Step 1: Clone and Navigate

```bash
cd /Users/heshamrabie/Documents/GitHub/The_Flemmards-SOEN341_Project_F25/backend
```

---

## Step 2: Install Dependencies

```bash
npm install
```

---

## Step 3: Configure Database

Create a `.env` file in the `backend/` directory:

```bash
nano .env
```

Add the following (replace with your database credentials):

```env
DB_HOST=localhost
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=event_management
DB_PORT=3306
PORT=3000
NODE_ENV=development
```

Save and exit (Ctrl+X, then Y, then Enter).

---

## Step 4: Set Up Database Schema

Run these SQL commands to create the required tables (if not already done):

```sql
-- Organizations table
CREATE TABLE IF NOT EXISTS organizations (
    org_id VARCHAR(255) PRIMARY KEY,
    org_name VARCHAR(255) NOT NULL,
    contact_email VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_org_status (status)
);

-- Events table
CREATE TABLE IF NOT EXISTS events (
    event_id VARCHAR(255) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    start_at DATETIME,
    end_at DATETIME,
    capacity INT,
    org_id VARCHAR(255),
    moderationStatus VARCHAR(20) DEFAULT 'pending_approval',
    moderationNotes TEXT,
    moderatedBy VARCHAR(255),
    moderatedAt DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_moderation_status (moderationStatus),
    INDEX idx_event_date (start_at),
    INDEX idx_event_category (category),
    FOREIGN KEY (org_id) REFERENCES organizations(org_id)
);

-- Tickets table
CREATE TABLE IF NOT EXISTS tickets (
    ticket_id VARCHAR(255) PRIMARY KEY,
    event_id VARCHAR(255),
    user_id VARCHAR(255),
    scannedAt DATETIME,
    scannedCount INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_ticket_scanned (scannedAt),
    FOREIGN KEY (event_id) REFERENCES events(event_id)
);
```

---

## Step 5: Start the Server

```bash
node server.js
```

You should see:
```
Server running on port 3000
Connected to MySQL database
```

---

## Step 6: Test Your Setup

Open a new terminal and run:

```bash
# Test health check
curl http://localhost:3000/health

# Test event browsing
curl http://localhost:3000/api/events/browse

# Test organization endpoints
curl http://localhost:3000/api/org/all
```

---

## ✅ You're Ready!

Your backend is now running! Here are some next steps:

### Test All Features:
See [API_TESTING_GUIDE.md](./API_TESTING_GUIDE.md) for complete testing instructions.

### View Documentation:
- **Quick Overview:** [BACKEND_IMPLEMENTATION_SUMMARY.md](./BACKEND_IMPLEMENTATION_SUMMARY.md)
- **Complete Details:** [COMPLETE_BACKEND_IMPLEMENTATION_SUMMARY.md](./COMPLETE_BACKEND_IMPLEMENTATION_SUMMARY.md)
- **Project Handoff:** [PROJECT_HANDOFF.md](./PROJECT_HANDOFF.md)

### Deploy to Production:
See [PRODUCTION_DEPLOYMENT_CHECKLIST.md](./PRODUCTION_DEPLOYMENT_CHECKLIST.md)

---

## 🔑 Key Endpoints

Once running, you can access:

### Event Management:
- **Browse Events:** `GET http://localhost:3000/api/events/browse`
- **Create Event:** `POST http://localhost:3000/api/events/create`
- **Approve Event:** `PATCH http://localhost:3000/api/events/approve/:event_id`
- **Reject Event:** `PATCH http://localhost:3000/api/events/reject/:event_id`
- **Flag Event:** `PATCH http://localhost:3000/api/events/flag/:event_id`

### Organization Management:
- **Get All Organizations:** `GET http://localhost:3000/api/org/all`
- **Create Organization:** `POST http://localhost:3000/api/org/create`
- **Approve Organizer:** `PATCH http://localhost:3000/api/admin/approve-organizer/:org_id`

### Ticket Management:
- **Scan QR Code:** `POST http://localhost:3000/api/tickets/ticket/scan`
- **Export CSV:** `GET http://localhost:3000/api/tickets/export-csv/:event_id`

### Admin:
- **View Notifications:** `GET http://localhost:3000/api/admin/notifications`

---

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Find and kill the process using port 3000
lsof -ti:3000 | xargs kill -9

# Or change the port in .env file
PORT=3001
```

### Database Connection Error
```bash
# Check MySQL is running
brew services list | grep mysql

# Start MySQL if needed
brew services start mysql

# Verify credentials in .env file
```

### Module Not Found
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Cannot Connect to Database
```bash
# Test MySQL connection
mysql -u your_username -p

# Create database if it doesn't exist
CREATE DATABASE event_management;

# Grant permissions
GRANT ALL PRIVILEGES ON event_management.* TO 'your_username'@'localhost';
FLUSH PRIVILEGES;
```

---

## 📱 Quick Test Commands

### Test Event Browsing with Filters:
```bash
# Search by keyword
curl "http://localhost:3000/api/events/browse?q=music"

# Filter by category
curl "http://localhost:3000/api/events/browse?category=technology"

# Filter by date
curl "http://localhost:3000/api/events/browse?startDate=2025-10-01&endDate=2025-12-31"

# Combined filters
curl "http://localhost:3000/api/events/browse?q=workshop&category=education&minCapacity=20"
```

### Test Organization Management:
```bash
# Create organization
curl -X POST http://localhost:3000/api/org/create \
  -H "Content-Type: application/json" \
  -d '{
    "org_name": "Test Organization",
    "contact_email": "test@example.com"
  }'

# Approve organization (replace ORG_ID)
curl -X PATCH http://localhost:3000/api/admin/approve-organizer/ORG_ID \
  -H "Content-Type: application/json" \
  -d '{"action": "approve"}'
```

### Test Event Moderation:
```bash
# Approve event (replace EVENT_ID)
curl -X PATCH http://localhost:3000/api/events/approve/EVENT_ID

# Reject event with reason
curl -X PATCH http://localhost:3000/api/events/reject/EVENT_ID \
  -H "Content-Type: application/json" \
  -d '{"reason": "Event does not meet community guidelines"}'

# Flag event
curl -X PATCH http://localhost:3000/api/events/flag/EVENT_ID \
  -H "Content-Type: application/json" \
  -d '{"reason": "Inappropriate content detected"}'
```

### Test QR Code Scanning:
```bash
# Scan ticket (replace TICKET_ID)
curl -X POST http://localhost:3000/api/tickets/ticket/scan \
  -H "Content-Type: application/json" \
  -d '{"ticketId": "TICKET_ID"}'
```

### Export Attendee List:
```bash
# Export to CSV (replace EVENT_ID)
curl http://localhost:3000/api/tickets/export-csv/EVENT_ID \
  --output attendees.csv

# View the CSV
cat attendees.csv
```

---

## 🎉 Success!

If you can see responses from the curl commands, your backend is working perfectly!

### Next Steps:
1. ✅ Explore all endpoints in [API_TESTING_GUIDE.md](./API_TESTING_GUIDE.md)
2. ✅ Read implementation details in [PROJECT_HANDOFF.md](./PROJECT_HANDOFF.md)
3. ✅ Connect your frontend to these endpoints
4. ✅ Deploy to production using [PRODUCTION_DEPLOYMENT_CHECKLIST.md](./PRODUCTION_DEPLOYMENT_CHECKLIST.md)

---

## 📞 Need Help?

- **API Documentation:** [API_TESTING_GUIDE.md](./API_TESTING_GUIDE.md)
- **Implementation Details:** [COMPLETE_BACKEND_IMPLEMENTATION_SUMMARY.md](./COMPLETE_BACKEND_IMPLEMENTATION_SUMMARY.md)
- **Deployment Guide:** [PRODUCTION_DEPLOYMENT_CHECKLIST.md](./PRODUCTION_DEPLOYMENT_CHECKLIST.md)
- **Project Overview:** [PROJECT_HANDOFF.md](./PROJECT_HANDOFF.md)

---

**Total Setup Time:** ~5 minutes  
**Status:** ✅ Ready to use  
**All features:** Fully functional

Happy coding! 🚀
