# API Testing Guide for Backend Tasks

## Quick Start

Make sure your backend server is running:
```bash
cd backend
node server.js
```

---

## 1. Event Browsing API (US.01)

### Test basic event browsing
```bash
# Get all upcoming events
curl http://localhost:3000/api/events/browse

# Search by text
curl "http://localhost:3000/api/events/browse?q=music"

# Filter by category
curl "http://localhost:3000/api/events/browse?category=technology"

# Filter by date range
curl "http://localhost:3000/api/events/browse?startDate=2025-10-01&endDate=2025-12-31"

# Filter by capacity
curl "http://localhost:3000/api/events/browse?minCapacity=50&maxCapacity=200"

# Filter by duration (in hours)
curl "http://localhost:3000/api/events/browse?minDuration=1&maxDuration=4"

# Pagination
curl "http://localhost:3000/api/events/browse?page=1&limit=10"

# Sorting
curl "http://localhost:3000/api/events/browse?sortBy=start_at&sortOrder=desc"

# Combined filters
curl "http://localhost:3000/api/events/browse?q=workshop&category=education&minCapacity=20&page=1&limit=5"
```

---

## 2. Organization CRUD APIs (Task #106)

### Create Organization
```bash
curl -X POST http://localhost:3000/api/org/create \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Tech Club",
    "description": "University Technology Club",
    "website": "https://techclub.example.com",
    "contact": {
      "email": "info@techclub.com",
      "phone": "+15145551234",
      "socials": {
        "instagram": "@techclub",
        "twitter": "@techclub"
      }
    }
  }'
```

### Get All Organizations (Admin only)
```bash
curl http://localhost:3000/api/org/all \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Get Organization by ID
```bash
curl http://localhost:3000/api/org/{org_id}
```

### Get Pending Organizations (Admin only)
```bash
curl http://localhost:3000/api/org/pending/list \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Get Organizations by Status (Admin only)
```bash
curl http://localhost:3000/api/org/status/approved \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Update Organization (Admin only)
```bash
curl -X PUT http://localhost:3000/api/org/update/{org_id} \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "description": "Updated description"
  }'
```

### Delete Organization (Admin only)
```bash
curl -X DELETE http://localhost:3000/api/org/delete/{org_id} \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Get Organization Stats
```bash
curl http://localhost:3000/api/org/stats/{org_id}
```

---

## 3. Organization Approval API (Task #121)

### Approve Organization
```bash
curl -X PATCH http://localhost:3000/api/admin/approve-organizer/{org_id} \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "status": "approved"
  }'
```

### Reject Organization
```bash
curl -X PATCH http://localhost:3000/api/admin/approve-organizer/{org_id} \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "status": "rejected",
    "rejectionReason": "Incomplete information provided"
  }'
```

---

## 4. Event Moderation APIs (Task #114)

### Approve Event
```bash
curl -X PATCH http://localhost:3000/api/events/approve/{event_id} \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Reject Event
```bash
curl -X PATCH http://localhost:3000/api/events/reject/{event_id} \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "reason": "Event violates campus policy"
  }'
```

### Flag Event
```bash
curl -X PATCH http://localhost:3000/api/events/flag/{event_id} \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "flagReason": "Inappropriate content in description"
  }'
```

---

## 5. QR Code Scanning API (Task #64)

### Scan Ticket (Normal Flow)
```bash
curl -X POST http://localhost:3000/api/tickets/ticket/scan \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "code": "TK-XXXXXXXXXXXX"
  }'
```

### Expected Success Response:
```json
{
  "message": "Ticket validated and marked as used",
  "code": "TICKET_VALID",
  "ticket": {
    "ticketId": "TIC-...",
    "status": "used",
    "scannedAt": "2025-10-23T12:34:56.789Z",
    "scannedBy": "scanner@example.com",
    "user": {...},
    "event": {...}
  }
}
```

### Test QR Re-use Detection:
```bash
# Scan the same ticket twice
curl -X POST http://localhost:3000/api/tickets/ticket/scan \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "code": "TK-XXXXXXXXXXXX"
  }'
```

### Expected Re-use Response:
```json
{
  "error": "Ticket already used - QR code re-use detected",
  "code": "TICKET_ALREADY_USED",
  "alert": "Administrators have been notified of this re-use attempt",
  "ticketDetails": {
    "ticketId": "TIC-...",
    "scannedAt": "2025-10-23T12:34:56.789Z",
    "scannedBy": "scanner1@example.com",
    "currentAttemptBy": "scanner2@example.com"
  }
}
```

Check server logs for security alerts:
```
[SECURITY ALERT] QR code re-use attempt detected!
[SECURITY ALERT] Ticket ID: TIC-...
[SECURITY ALERT] Previously scanned at: ...
[SECURITY ALERT] Previously scanned by: scanner1@example.com
[SECURITY ALERT] New scan attempt by: scanner2@example.com
```

---

## 6. CSV Export API (Task #58 & #60)

### Export Attendee List
```bash
curl http://localhost:3000/api/tickets/export-csv/{event_id} \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -o attendees.csv
```

### Test Error Handling:

#### Invalid Event ID
```bash
curl http://localhost:3000/api/tickets/export-csv/invalid_id \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

Expected Response:
```json
{
  "error": "Invalid event ID format",
  "code": "INVALID_FORMAT"
}
```

#### Empty Attendee List
```bash
curl http://localhost:3000/api/tickets/export-csv/{event_with_no_attendees} \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

Expected Response:
```json
{
  "error": "No attendees found for this event",
  "code": "EMPTY_LIST",
  "message": "The attendee list is empty"
}
```

#### Event Not Found
```bash
curl http://localhost:3000/api/tickets/export-csv/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

Expected Response:
```json
{
  "error": "Event not found",
  "code": "EVENT_NOT_FOUND"
}
```

---

## 7. Event Creation Restriction Test (Task #122)

### Try to create event with non-approved organization
```bash
# First, create an organization (it will be pending by default)
ORG_ID=$(curl -X POST http://localhost:3000/api/org/create \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Org",
    "description": "Test",
    "website": "https://test.com",
    "contact": {"email": "test@test.com", "phone": "+15145551111"}
  }' | jq -r '.organization._id')

# Try to create event (should fail)
curl -X POST http://localhost:3000/api/events/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d "{
    \"organization\": \"$ORG_ID\",
    \"title\": \"Test Event\",
    \"description\": \"Test\",
    \"start_at\": \"2025-11-01T10:00:00Z\",
    \"end_at\": \"2025-11-01T12:00:00Z\",
    \"capacity\": 100,
    \"category\": \"workshop\",
    \"location\": {
      \"name\": \"Room 101\",
      \"address\": \"123 Main St\"
    }
  }"
```

Expected Response:
```json
{
  "error": "Only approved organizations can create events",
  "organizationStatus": "pending",
  "message": "Your organization is pending approval"
}
```

### After approving the organization, event creation should work:
```bash
# Approve organization
curl -X PATCH http://localhost:3000/api/admin/approve-organizer/$ORG_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{"status": "approved"}'

# Now try creating event again (should succeed)
curl -X POST http://localhost:3000/api/events/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d "{
    \"organization\": \"$ORG_ID\",
    \"title\": \"Test Event\",
    \"description\": \"Test\",
    \"start_at\": \"2025-11-01T10:00:00Z\",
    \"end_at\": \"2025-11-01T12:00:00Z\",
    \"capacity\": 100,
    \"category\": \"workshop\",
    \"location\": {
      \"name\": \"Room 101\",
      \"address\": \"123 Main St\"
    }
  }"
```

---

## Authentication Notes

Most endpoints require authentication. You'll need to:

1. **Login as Admin:**
```bash
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "your_password"
  }'
```

2. **Use the token in subsequent requests:**
```bash
curl http://localhost:3000/api/endpoint \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Postman Collection

Import these as Postman requests for easier testing:

### Environment Variables:
- `base_url`: `http://localhost:3000`
- `admin_token`: Your admin JWT token
- `org_id`: Test organization ID
- `event_id`: Test event ID

---

## Expected Audit Logs

Check your server console for audit logs after admin actions:

```
[AUDIT] Admin admin@example.com approved organization Tech Club (ID: 6543...)
[AUDIT] Admin admin@example.com rejected event Workshop (ID: 7654...)
[AUDIT] Rejection reason: Violates campus policy
[AUDIT] Admin admin@example.com exported attendee list for event Concert (ID: 8765...)
```

---

## Database Verification

After testing, verify in MongoDB:

```javascript
// Check organization status
db.organizations.find({}, {name: 1, status: 1})

// Check events by approved orgs
db.events.find({}).populate('organization')

// Check ticket scans
db.tickets.find({status: 'used'}, {ticketId: 1, scannedAt: 1, scannedBy: 1})

// Check registrations for CSV export
db.registrations.find({event: ObjectId('...')})
```

---

## Troubleshooting

### Issue: "Authentication required"
**Solution:** Make sure you're logged in and sending the JWT token in the Authorization header.

### Issue: "Admin access required"
**Solution:** Make sure the user you're logged in as is an Administrator, not a regular User.

### Issue: "Organization not found"
**Solution:** Make sure the organization ID exists and is valid.

### Issue: CSV file is empty
**Solution:** Make sure the event has registrations and tickets issued.

---

**All backend tasks have been implemented and are ready for testing!**
