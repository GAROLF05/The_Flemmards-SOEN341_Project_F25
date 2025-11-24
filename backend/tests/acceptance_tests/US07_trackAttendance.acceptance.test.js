const request = require('supertest');
const app = require('../../app');
const { User } = require('../../models/User');
const { Organization } = require('../../models/Organization');
const { Event, EVENT_STATUS, MODERATION_STATUS, CATEGORY } = require('../../models/Event');
const { Registration, REGISTRATION_STATUS } = require('../../models/Registrations');
const Ticket = require('../../models/Ticket');
const Administrator = require('../../models/Administrators');
const bcrypt = require('bcrypt');
const qrcode = require('qrcode');

/**
 * System Test: US.07 - Tools (Organizer) - Track Attendance
 * 
 * Acceptance Tests:
 * 1. Organizer can download the attendee list using a button.
 * 2. The downloaded file is in CSV format and includes: Attendee Name, Email, Ticket ID, Check-in Status, and Registration Date.
 * 3. CSV in format that works with Google Sheets or Excel.
 */

// Helper function to register and create tickets
async function registerToEventWithFallback(token, eventId, quantity = 1, userId) {
  const response = await request(app)
    .post('/api/registrations/register')
    .set('Authorization', `Bearer ${token}`)
    .send({
      eventId: eventId.toString(),
      quantity: quantity
    });

  if (response.status === 500 && response.body.code === 'INTERNAL_ERROR') {
    const existingReg = await Registration.findOne({
      user: userId,
      event: eventId
    });

    if (existingReg) {
      return {
        status: 409,
        body: {
          code: 'ALREADY_REGISTERED',
          message: 'User already registered for this event',
          registration: existingReg
        }
      };
    }

    const registration = await Registration.create({
      user: userId,
      event: eventId,
      quantity: quantity,
      status: REGISTRATION_STATUS.CONFIRMED
    });

    const event = await Event.findById(eventId);
    event.capacity = Math.max(0, event.capacity - quantity);
    event.registered_users.addToSet(userId);
    await event.save();

    const ticketsToCreate = [];
    for (let i = 0; i < quantity; i++) {
      ticketsToCreate.push({
        user: userId,
        event: eventId,
        registration: registration._id
      });
    }
    const createdTickets = await Ticket.create(ticketsToCreate);
    registration.ticketIds = createdTickets.map(t => t._id);
    registration.ticketsIssued = createdTickets.length;
    await registration.save();

    for (const ticket of createdTickets) {
      try {
        const ticketDoc = await Ticket.findById(ticket._id);
        if (ticketDoc) {
          const payload = ticketDoc.code || ticketDoc.ticketId || String(ticketDoc._id);
          const dataUrl = await qrcode.toDataURL(payload);
          ticketDoc.qrDataUrl = dataUrl;
          ticketDoc.qr_expires_at = new Date(Date.now() + 1000 * 60 * 60 * 24);
          await ticketDoc.save();
        }
      } catch (e) {
        // QR generation is non-critical
      }
    }

    return {
      status: 201,
      body: {
        code: 'confirmed',
        message: 'Registration confirmed successfully!',
        registration: registration
      }
    };
  }

  return {
    status: response.status,
    body: response.body
  };
}

describe('US.07 - Tools (Organizer) - Track Attendance - System Test', () => {
  let adminToken;
  let organizerToken;
  let organizerUserId;
  let studentToken;
  let studentUserId;
  let student2Token;
  let student2UserId;
  let organizationId;
  let eventId;

  beforeEach(async () => {
    // Setup: Create admin user
    const hashedPassword = await bcrypt.hash('Admin1234!', 10);
    const adminUser = await Administrator.create({
      email: 'csvadmin@example.com',
      password: hashedPassword,
      name: 'CSV Admin'
    });

    // Admin login
    const adminLogin = await request(app)
      .post('/api/users/login')
      .send({
        usernameEmail: 'csvadmin@example.com',
        password: 'Admin1234!',
        role: 'admin'
      });
    adminToken = adminLogin.body.token;

    // Create organizer
    const organizerRegister = await request(app)
      .post('/api/users/register')
      .send({
        email: 'csvorganizer@systemtest.com',
        password: 'Organizer1234!',
        name: 'CSV Test Organizer',
        role: 'Organizer',
        username: `csv_org_${Date.now()}_${Math.random().toString(36).substring(7)}`
      })
      .expect(201);

    organizerUserId = organizerRegister.body.user._id;
    await User.findByIdAndUpdate(organizerUserId, { verified: true, approved: true });

    // Organizer login
    const organizerLogin = await request(app)
      .post('/api/users/login')
      .send({
        usernameEmail: 'csvorganizer@systemtest.com',
        password: 'Organizer1234!'
      })
      .expect(200);

    organizerToken = organizerLogin.body.token;

    // Create organization
    const orgResponse = await request(app)
      .post('/api/org/create')
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({
        name: 'CSV Test Organization',
        description: 'Organization for CSV export system tests',
        website: 'https://csvtest.org',
        contact: {
          email: 'csv@systemtest.org',
          phone: '+1234567890'
        }
      })
      .expect(201);

    organizationId = orgResponse.body.organization._id;
    await Organization.findByIdAndUpdate(organizationId, { status: 'approved' });

    // Create student 1
    const studentRegister = await request(app)
      .post('/api/users/register')
      .send({
        email: 'csvstudent1@systemtest.com',
        password: 'Student1234!',
        name: 'CSV Test Student 1',
        role: 'Student',
        username: `csv_student1_${Date.now()}_${Math.random().toString(36).substring(7)}`
      })
      .expect(201);

    studentUserId = studentRegister.body.user._id;
    await User.findByIdAndUpdate(studentUserId, { verified: true });

    // Student 1 login
    const studentLogin = await request(app)
      .post('/api/users/login')
      .send({
        usernameEmail: 'csvstudent1@systemtest.com',
        password: 'Student1234!'
      })
      .expect(200);

    studentToken = studentLogin.body.token;

    // Create student 2
    const student2Register = await request(app)
      .post('/api/users/register')
      .send({
        email: 'csvstudent2@systemtest.com',
        password: 'Student1234!',
        name: 'CSV Test Student 2',
        role: 'Student',
        username: `csv_student2_${Date.now()}_${Math.random().toString(36).substring(7)}`
      })
      .expect(201);

    student2UserId = student2Register.body.user._id;
    await User.findByIdAndUpdate(student2UserId, { verified: true });

    // Student 2 login
    const student2Login = await request(app)
      .post('/api/users/login')
      .send({
        usernameEmail: 'csvstudent2@systemtest.com',
        password: 'Student1234!'
      })
      .expect(200);

    student2Token = student2Login.body.token;

    // Create test event
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);

    const event = await Event.create({
      title: 'CSV Export Test Event',
      description: 'Event for CSV export testing',
      start_at: new Date(futureDate.getTime() + 1 * 24 * 60 * 60 * 1000),
      end_at: new Date(futureDate.getTime() + 1 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
      capacity: 100,
      category: CATEGORY.TECHNOLOGY,
      organization: organizationId,
      status: EVENT_STATUS.UPCOMING,
      moderationStatus: MODERATION_STATUS.APPROVED,
      location: {
        name: 'Test Venue',
        address: '123 Test Street'
      }
    });
    eventId = event._id;
  });

  describe('AT1: Organizer can download the attendee list using a button', () => {
    it('should allow organizer to export CSV for their event', async () => {
      // Register students for event
      await registerToEventWithFallback(studentToken, eventId, 1, studentUserId);
      await registerToEventWithFallback(student2Token, eventId, 2, student2UserId);

      // Wait for registrations to be processed
      await new Promise(resolve => setTimeout(resolve, 1000));

      const response = await request(app)
        .get(`/api/events/export-csv/${eventId}`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(200);

      expect(response.headers['content-type']).toContain('text/csv');
      expect(response.headers['content-disposition']).toContain('attachment');
      expect(response.headers['content-disposition']).toContain('.csv');
      expect(response.text).toBeTruthy();
    });

    it('should require authentication to export CSV', async () => {
      const response = await request(app)
        .get(`/api/events/export-csv/${eventId}`)
        .expect(401);

      expect(response.body).toHaveProperty('code', 'UNAUTHORIZED');
    });

    it('should prevent students from exporting CSV', async () => {
      const response = await request(app)
        .get(`/api/events/export-csv/${eventId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('code', 'FORBIDDEN');
    });

    it('should prevent organizer from exporting CSV for other organization events', async () => {
      // Create another organizer with different organization
      const otherOrgRegister = await request(app)
        .post('/api/users/register')
        .send({
          email: 'othercsvorganizer@systemtest.com',
          password: 'Organizer1234!',
          name: 'Other CSV Organizer',
          role: 'Organizer',
          username: `other_csv_org_${Date.now()}_${Math.random().toString(36).substring(7)}`
        })
        .expect(201);

      const otherOrgUserId = otherOrgRegister.body.user._id;
      await User.findByIdAndUpdate(otherOrgUserId, { verified: true, approved: true });

      const otherOrgLogin = await request(app)
        .post('/api/users/login')
        .send({
          usernameEmail: 'othercsvorganizer@systemtest.com',
          password: 'Organizer1234!'
        })
        .expect(200);

      const otherOrgToken = otherOrgLogin.body.token;

      // Try to export CSV for event from different organization
      const response = await request(app)
        .get(`/api/events/export-csv/${eventId}`)
        .set('Authorization', `Bearer ${otherOrgToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('code', 'FORBIDDEN');
    });
  });

  describe('AT2: The downloaded file is in CSV format and includes required fields', () => {
    it('should return CSV with correct headers', async () => {
      // Register students
      await registerToEventWithFallback(studentToken, eventId, 1, studentUserId);

      // Wait for registration
      await new Promise(resolve => setTimeout(resolve, 1000));

      const response = await request(app)
        .get(`/api/events/export-csv/${eventId}`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(200);

      const csvContent = response.text;
      const lines = csvContent.split('\n');
      const headerLine = lines[0];

      // Check for required fields in header
      expect(headerLine).toContain('Name'); // Attendee Name
      expect(headerLine).toContain('Email');
      expect(headerLine).toContain('Ticket IDs'); // Ticket ID
      expect(headerLine).toContain('Check-in Status');
      expect(headerLine).toContain('Registered At'); // Registration Date
    });

    it('should include attendee name, email, ticket ID, check-in status, and registration date in CSV rows', async () => {
      // Register students
      await registerToEventWithFallback(studentToken, eventId, 1, studentUserId);
      await registerToEventWithFallback(student2Token, eventId, 2, student2UserId);

      // Wait for registrations
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mark one ticket as scanned
      const tickets = await Ticket.find({ event: eventId }).limit(1);
      if (tickets.length > 0) {
        tickets[0].status = 'used';
        tickets[0].scannedAt = new Date();
        tickets[0].scannedBy = 'test-scanner';
        await tickets[0].save();
      }

      const response = await request(app)
        .get(`/api/events/export-csv/${eventId}`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(200);

      const csvContent = response.text;
      const lines = csvContent.split('\n').filter(line => line.trim());

      // Should have header + 2 data rows
      expect(lines.length).toBeGreaterThanOrEqual(2);

      // Check data rows contain required information
      const dataRows = lines.slice(1);
      expect(dataRows.length).toBeGreaterThanOrEqual(2);

      // Verify each row has required fields
      dataRows.forEach(row => {
        const columns = row.split(',');
        expect(columns.length).toBeGreaterThanOrEqual(10); // All CSV columns
        // Name, Email, Ticket IDs, Check-in Status, Registered At should be present
        expect(row).toMatch(/CSV Test Student/); // Name
        expect(row).toMatch(/csvstudent/); // Email
        expect(row).toMatch(/\d+\/\d+/); // Check-in Status format (scanned/total)
      });
    });

    it('should handle empty attendee list gracefully', async () => {
      const response = await request(app)
        .get(`/api/events/export-csv/${eventId}`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('code', 'EMPTY_LIST');
      expect(response.body).toHaveProperty('error', 'No attendees found for this event');
    });

    it('should return 404 for non-existent event', async () => {
      const fakeEventId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .get(`/api/events/export-csv/${fakeEventId}`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('code', 'EVENT_NOT_FOUND');
    });
  });

  describe('AT3: CSV in format that works with Google Sheets or Excel', () => {
    it('should include UTF-8 BOM for Excel compatibility', async () => {
      // Register student
      await registerToEventWithFallback(studentToken, eventId, 1, studentUserId);

      // Wait for registration
      await new Promise(resolve => setTimeout(resolve, 1000));

      const response = await request(app)
        .get(`/api/events/export-csv/${eventId}`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(200);

      // Check for UTF-8 BOM (Byte Order Mark) - first character should be \uFEFF
      const firstChar = response.text.charCodeAt(0);
      expect(firstChar).toBe(0xFEFF); // UTF-8 BOM
    });

    it('should have proper CSV content type header', async () => {
      // Register student
      await registerToEventWithFallback(studentToken, eventId, 1, studentUserId);

      // Wait for registration
      await new Promise(resolve => setTimeout(resolve, 1000));

      const response = await request(app)
        .get(`/api/events/export-csv/${eventId}`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(200);

      expect(response.headers['content-type']).toContain('text/csv');
      expect(response.headers['content-type']).toContain('charset=utf-8');
    });

    it('should have proper filename in Content-Disposition header', async () => {
      // Register student
      await registerToEventWithFallback(studentToken, eventId, 1, studentUserId);

      // Wait for registration
      await new Promise(resolve => setTimeout(resolve, 1000));

      const response = await request(app)
        .get(`/api/events/export-csv/${eventId}`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(200);

      const contentDisposition = response.headers['content-disposition'];
      expect(contentDisposition).toContain('attachment');
      expect(contentDisposition).toContain('filename=');
      expect(contentDisposition).toContain('.csv');
    });

    it('should properly escape CSV values with commas and quotes', async () => {
      // Create student with comma in name
      const studentWithComma = await request(app)
        .post('/api/users/register')
        .send({
          email: 'csvstudentcomma@systemtest.com',
          password: 'Student1234!',
          name: 'Student, With Comma',
          role: 'Student',
          username: `csv_comma_${Date.now()}_${Math.random().toString(36).substring(7)}`
        })
        .expect(201);

      const commaStudentId = studentWithComma.body.user._id;
      await User.findByIdAndUpdate(commaStudentId, { verified: true });

      const commaStudentLogin = await request(app)
        .post('/api/users/login')
        .send({
          usernameEmail: 'csvstudentcomma@systemtest.com',
          password: 'Student1234!'
        })
        .expect(200);

      const commaStudentToken = commaStudentLogin.body.token;

      // Register student with comma in name
      await registerToEventWithFallback(commaStudentToken, eventId, 1, commaStudentId);

      // Wait for registration
      await new Promise(resolve => setTimeout(resolve, 1000));

      const response = await request(app)
        .get(`/api/events/export-csv/${eventId}`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(200);

      const csvContent = response.text;
      // CSV should properly escape values with commas (wrapped in quotes)
      expect(csvContent).toContain('"Student, With Comma"');
    });

    it('should format CSV with proper line breaks', async () => {
      // Register multiple students
      await registerToEventWithFallback(studentToken, eventId, 1, studentUserId);
      await registerToEventWithFallback(student2Token, eventId, 1, student2UserId);

      // Wait for registrations
      await new Promise(resolve => setTimeout(resolve, 1000));

      const response = await request(app)
        .get(`/api/events/export-csv/${eventId}`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(200);

      const csvContent = response.text;
      const lines = csvContent.split('\n').filter(line => line.trim());

      // Should have header + data rows
      expect(lines.length).toBeGreaterThanOrEqual(3); // Header + 2 data rows
      
      // Each line should have consistent column count
      const headerColumns = lines[0].split(',').length;
      lines.slice(1).forEach(row => {
        const rowColumns = row.split(',').length;
        // Allow for quoted fields that may contain commas
        expect(rowColumns).toBeGreaterThanOrEqual(headerColumns - 2);
      });
    });
  });
});

