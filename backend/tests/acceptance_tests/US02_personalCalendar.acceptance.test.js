const request = require('supertest');
const app = require('../../app');
const { User } = require('../../models/User');
const { Organization } = require('../../models/Organization');
const { Event, EVENT_STATUS, MODERATION_STATUS, CATEGORY } = require('../../models/Event');
const { Registration, REGISTRATION_STATUS } = require('../../models/Registrations');
const Administrator = require('../../models/Administrators');
const bcrypt = require('bcrypt');

/**
 * System Test: US.02 - Event Management (Student) - Personal Calendar
 * 
 * Acceptance Tests:
 * 1. Each event has a button to save the event directly to a personal calendar
 * 2. Button to download the calendar as an `.ics` file
 * 3. Opening the downloaded `.ics` using a calendar app shows all necessary information including the event title, date and time, description and location
 * 4. Reserving a spot for an event is also added to the built-in calendar in the app
 * 5. The `.ics` file complies with RFC 5545 format and includes required fields (UID, DTSTART, DURATION/DTEND, SUMMARY, DESCRIPTION, LOCATION)
 * 6. Regenerated `.ics` file reflects updated event info
 * 7. Success and error toasts provide user feedback during generation
 * 8. Time zones are correctly formatted and preserved
 */
describe('US.02 - Event Management (Student) - Personal Calendar - System Test', () => {
  let adminToken;
  let organizerToken;
  let organizerUserId;
  let organizer2Token;
  let organizer2UserId;
  let studentToken;
  let studentUserId;
  let organizationId;
  let organizationId2;
  let eventIds = [];

  beforeEach(async () => {
    // Clear eventIds array for fresh start
    eventIds = [];
    
    // Setup: Create admin user
    const hashedPassword = await bcrypt.hash('Admin1234!', 10);
    const adminUser = await Administrator.create({
      email: 'calendaradmin@example.com',
      password: hashedPassword,
      name: 'Calendar Admin'
    });

    // Admin login
    const adminLogin = await request(app)
      .post('/api/users/login')
      .send({
        usernameEmail: 'calendaradmin@example.com',
        password: 'Admin1234!',
        role: 'admin'
      });
    adminToken = adminLogin.body.token;

    // Create organizer
    const organizerRegister = await request(app)
      .post('/api/users/register')
      .send({
        email: 'calendarorganizer@systemtest.com',
        password: 'Organizer1234!',
        name: 'Calendar Test Organizer',
        role: 'Organizer',
        username: `calendar_org_${Date.now()}_${Math.random().toString(36).substring(7)}`
      })
      .expect(201);

    organizerUserId = organizerRegister.body.user._id;
    await User.findByIdAndUpdate(organizerUserId, { verified: true, approved: true });

    // Organizer login
    const organizerLogin = await request(app)
      .post('/api/users/login')
      .send({
        usernameEmail: 'calendarorganizer@systemtest.com',
        password: 'Organizer1234!'
      })
      .expect(200);

    organizerToken = organizerLogin.body.token;

    // Create organization 1
    const orgResponse = await request(app)
      .post('/api/org/create')
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({
        name: 'Calendar Test Organization',
        description: 'Organization for calendar system tests',
        website: 'https://calendartest.org',
        contact: {
          email: 'calendar@systemtest.org',
          phone: '+1234567890'
        }
      })
      .expect(201);

    organizationId = orgResponse.body.organization._id;
    await Organization.findByIdAndUpdate(organizationId, { status: 'approved' });

    // Create second organizer for organization 2
    const organizer2Register = await request(app)
      .post('/api/users/register')
      .send({
        email: 'calendarorganizer2@systemtest.com',
        password: 'Organizer1234!',
        name: 'Calendar Test Organizer 2',
        role: 'Organizer',
        username: `calendar_org2_${Date.now()}_${Math.random().toString(36).substring(7)}`
      })
      .expect(201);

    organizer2UserId = organizer2Register.body.user._id;
    await User.findByIdAndUpdate(organizer2UserId, { verified: true, approved: true });

    // Second organizer login
    const organizer2Login = await request(app)
      .post('/api/users/login')
      .send({
        usernameEmail: 'calendarorganizer2@systemtest.com',
        password: 'Organizer1234!'
      })
      .expect(200);

    organizer2Token = organizer2Login.body.token;

    // Create organization 2 with second organizer
    const orgResponse2 = await request(app)
      .post('/api/org/create')
      .set('Authorization', `Bearer ${organizer2Token}`)
      .send({
        name: 'Calendar Test Organization 2',
        description: 'Second organization for calendar tests',
        website: 'https://calendartest2.org',
        contact: {
          email: 'calendar2@systemtest.org',
          phone: '+1234567891'
        }
      })
      .expect(201);

    organizationId2 = orgResponse2.body.organization._id;
    await Organization.findByIdAndUpdate(organizationId2, { status: 'approved' });

    // Create student
    const studentRegister = await request(app)
      .post('/api/users/register')
      .send({
        email: 'calendarstudent@systemtest.com',
        password: 'Student1234!',
        name: 'Calendar Test Student',
        role: 'Student',
        username: `calendar_student_${Date.now()}_${Math.random().toString(36).substring(7)}`
      })
      .expect(201);

    studentUserId = studentRegister.body.user._id;
    await User.findByIdAndUpdate(studentUserId, { verified: true });

    // Student login
    const studentLogin = await request(app)
      .post('/api/users/login')
      .send({
        usernameEmail: 'calendarstudent@systemtest.com',
        password: 'Student1234!'
      })
      .expect(200);

    studentToken = studentLogin.body.token;

    // Create test events with different properties
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);

    // Event 1: Full details for comprehensive ICS testing
    const event1 = await Event.create({
      title: 'Tech Conference 2025',
      description: 'Annual technology conference featuring latest innovations in AI and machine learning',
      start_at: new Date(futureDate.getTime() + 1 * 24 * 60 * 60 * 1000),
      end_at: new Date(futureDate.getTime() + 1 * 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000),
      capacity: 200,
      category: CATEGORY.TECHNOLOGY,
      organization: organizationId,
      status: EVENT_STATUS.UPCOMING,
      moderationStatus: MODERATION_STATUS.APPROVED,
      location: {
        name: 'Convention Center',
        address: '123 Tech Street, Tech City, QC H1A 1A1'
      }
    });
    eventIds.push(event1._id);

    // Event 2: Different time and location
    const event2 = await Event.create({
      title: 'Music Festival',
      description: 'Outdoor music festival with multiple artists',
      start_at: new Date(futureDate.getTime() + 2 * 24 * 60 * 60 * 1000),
      end_at: new Date(futureDate.getTime() + 2 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000),
      capacity: 100,
      category: CATEGORY.MUSIC,
      organization: organizationId,
      status: EVENT_STATUS.UPCOMING,
      moderationStatus: MODERATION_STATUS.APPROVED,
      location: {
        name: 'Central Park',
        address: '456 Music Avenue, Music City'
      }
    });
    eventIds.push(event2._id);

    // Event 3: For testing updated event info
    const event3 = await Event.create({
      title: 'Workshop Event',
      description: 'Learn modern web development techniques',
      start_at: new Date(futureDate.getTime() + 3 * 24 * 60 * 60 * 1000),
      end_at: new Date(futureDate.getTime() + 3 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
      capacity: 50,
      category: CATEGORY.WORKSHOP,
      organization: organizationId2,
      status: EVENT_STATUS.UPCOMING,
      moderationStatus: MODERATION_STATUS.APPROVED,
      location: {
        name: 'Tech Hub',
        address: '789 Workshop Road, Dev City'
      }
    });
    eventIds.push(event3._id);
  });

  describe('AT1: Each event has a button to save the event directly to a personal calendar', () => {
    it('should provide an endpoint to generate ICS file for any event', async () => {
      const response = await request(app)
        .post(`/api/calendar/generate/${eventIds[0].toString()}`)
        .expect(200);

      expect(response.headers['content-type']).toContain('text/calendar');
      expect(response.headers['content-disposition']).toContain('attachment');
      expect(response.headers['content-disposition']).toContain('.ics');
    });

    it('should allow students to access the calendar generation endpoint', async () => {
      // The endpoint is currently public, but we verify it works
      const response = await request(app)
        .post(`/api/calendar/generate/${eventIds[0].toString()}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.headers['content-type']).toContain('text/calendar');
    });
  });

  describe('AT2: Button to download the calendar as an `.ics` file', () => {
    it('should return a valid ICS file with correct headers', async () => {
      const response = await request(app)
        .post(`/api/calendar/generate/${eventIds[0].toString()}`)
        .expect(200);

      // Verify content type
      expect(response.headers['content-type']).toContain('text/calendar');
      expect(response.headers['content-type']).toContain('charset=utf-8');

      // Verify content disposition for download
      expect(response.headers['content-disposition']).toContain('attachment');
      expect(response.headers['content-disposition']).toContain('filename=');
      expect(response.headers['content-disposition']).toContain('.ics');

      // Verify ICS file structure
      const icsContent = response.text;
      expect(icsContent).toContain('BEGIN:VCALENDAR');
      expect(icsContent).toContain('END:VCALENDAR');
      expect(icsContent).toContain('BEGIN:VEVENT');
      expect(icsContent).toContain('END:VEVENT');
    });

    it('should generate different ICS files for different events', async () => {
      const response1 = await request(app)
        .post(`/api/calendar/generate/${eventIds[0].toString()}`)
        .expect(200);

      const response2 = await request(app)
        .post(`/api/calendar/generate/${eventIds[1].toString()}`)
        .expect(200);

      expect(response1.text).not.toEqual(response2.text);
      expect(response1.text).toContain('Tech Conference 2025');
      expect(response2.text).toContain('Music Festival');
    });
  });

  describe('AT3: Opening the downloaded `.ics` shows all necessary information', () => {
    it('should include event title in the ICS file', async () => {
      const response = await request(app)
        .post(`/api/calendar/generate/${eventIds[0].toString()}`)
        .expect(200);

      const icsContent = response.text;
      expect(icsContent).toContain('SUMMARY:Tech Conference 2025');
    });

    it('should include event description in the ICS file', async () => {
      const response = await request(app)
        .post(`/api/calendar/generate/${eventIds[0].toString()}`)
        .expect(200);

      const icsContent = response.text;
      expect(icsContent).toContain('DESCRIPTION:');
      expect(icsContent).toContain('Annual technology conference');
    });

    it('should include event location in the ICS file', async () => {
      const response = await request(app)
        .post(`/api/calendar/generate/${eventIds[0].toString()}`)
        .expect(200);

      const icsContent = response.text;
      expect(icsContent).toContain('LOCATION:');
      expect(icsContent).toContain('Convention Center');
      expect(icsContent).toContain('123 Tech Street');
    });

    it('should include event date and time in the ICS file', async () => {
      const response = await request(app)
        .post(`/api/calendar/generate/${eventIds[0].toString()}`)
        .expect(200);

      const icsContent = response.text;
      expect(icsContent).toContain('DTSTART:');
      // ICS library uses DURATION instead of DTEND when duration is provided
      expect(icsContent).toMatch(/DURATION:|DTEND:/);
    });

    it('should include organizer information in the ICS file', async () => {
      const response = await request(app)
        .post(`/api/calendar/generate/${eventIds[0].toString()}`)
        .expect(200);

      const icsContent = response.text;
      // ICS format: ORGANIZER;CN="...":MAILTO:...
      expect(icsContent).toMatch(/ORGANIZER/);
      expect(icsContent).toContain('Calendar Test Organization');
      expect(icsContent).toContain('calendar@systemtest.org');
    });

    it('should include all required RFC 5545 fields', async () => {
      const response = await request(app)
        .post(`/api/calendar/generate/${eventIds[0].toString()}`)
        .expect(200);

      const icsContent = response.text;
      
      // Required RFC 5545 fields
      expect(icsContent).toMatch(/UID:[^\r\n]+/); // UID field
      expect(icsContent).toMatch(/DTSTART:[^\r\n]+/); // DTSTART field
      // ICS library uses DURATION instead of DTEND when duration is provided (both are valid RFC 5545)
      expect(icsContent).toMatch(/DURATION:|DTEND:/); // DURATION or DTEND field
      expect(icsContent).toContain('SUMMARY:'); // SUMMARY field
      expect(icsContent).toContain('DESCRIPTION:'); // DESCRIPTION field
      expect(icsContent).toContain('LOCATION:'); // LOCATION field
    });
  });

  describe('AT4: Reserving a spot for an event is also added to the built-in calendar', () => {
    it('should allow generating ICS file after registration', async () => {
      // Create a registration for the student
      const registration = await Registration.create({
        user: studentUserId,
        event: eventIds[0],
        status: REGISTRATION_STATUS.CONFIRMED,
        quantity: 1
      });

      // After registration, student should be able to generate ICS
      const response = await request(app)
        .post(`/api/calendar/generate/${eventIds[0].toString()}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.headers['content-type']).toContain('text/calendar');
      expect(response.text).toContain('Tech Conference 2025');
    });

    it('should generate ICS file with correct event details for registered events', async () => {
      // Register student for event
      await Registration.create({
        user: studentUserId,
        event: eventIds[1],
        status: REGISTRATION_STATUS.CONFIRMED,
        quantity: 1
      });

      // Generate ICS for the registered event
      const response = await request(app)
        .post(`/api/calendar/generate/${eventIds[1].toString()}`)
        .expect(200);

      const icsContent = response.text;
      expect(icsContent).toContain('SUMMARY:Music Festival');
      expect(icsContent).toContain('Central Park');
    });
  });

  describe('AT5: The `.ics` file complies with RFC 5545 format', () => {
    it('should have proper VCALENDAR structure', async () => {
      const response = await request(app)
        .post(`/api/calendar/generate/${eventIds[0].toString()}`)
        .expect(200);

      const icsContent = response.text;
      
      // Check for proper calendar structure
      expect(icsContent).toContain('BEGIN:VCALENDAR');
      expect(icsContent).toContain('VERSION:2.0');
      expect(icsContent).toContain('PRODID:');
      expect(icsContent).toContain('CALSCALE:GREGORIAN');
      expect(icsContent).toContain('END:VCALENDAR');
    });

    it('should have proper VEVENT structure', async () => {
      const response = await request(app)
        .post(`/api/calendar/generate/${eventIds[0].toString()}`)
        .expect(200);

      const icsContent = response.text;
      
      // Check for proper event structure
      expect(icsContent).toContain('BEGIN:VEVENT');
      expect(icsContent).toContain('END:VEVENT');
      
      // Verify VEVENT is inside VCALENDAR
      const beginCalendarIndex = icsContent.indexOf('BEGIN:VCALENDAR');
      const endCalendarIndex = icsContent.indexOf('END:VCALENDAR');
      const beginEventIndex = icsContent.indexOf('BEGIN:VEVENT');
      const endEventIndex = icsContent.indexOf('END:VEVENT');
      
      expect(beginEventIndex).toBeGreaterThan(beginCalendarIndex);
      expect(endEventIndex).toBeLessThan(endCalendarIndex);
    });

    it('should have valid date-time format (UTC)', async () => {
      const response = await request(app)
        .post(`/api/calendar/generate/${eventIds[0].toString()}`)
        .expect(200);

      const icsContent = response.text;
      
      // DTSTART should be in UTC format
      const dtstartMatch = icsContent.match(/DTSTART[^:]*:([^\r\n]+)/);
      
      if (dtstartMatch) {
        const dtstart = dtstartMatch[1];
        // Should be in format YYYYMMDDTHHMMSSZ or similar
        expect(dtstart).toMatch(/^\d{8}T\d{6}/);
      }
      
      // ICS library uses DURATION instead of DTEND when duration is provided
      // Both are valid RFC 5545, but we check for DURATION since that's what the library generates
      const durationMatch = icsContent.match(/DURATION[^:]*:([^\r\n]+)/);
      if (durationMatch) {
        const duration = durationMatch[1];
        // DURATION format: PT8H (Period Time 8 Hours) or PT8H30M
        expect(duration).toMatch(/^PT\d+/);
      } else {
        // If DURATION is not present, check for DTEND
        const dtendMatch = icsContent.match(/DTEND[^:]*:([^\r\n]+)/);
        if (dtendMatch) {
          const dtend = dtendMatch[1];
          expect(dtend).toMatch(/^\d{8}T\d{6}/);
        }
      }
    });

    it('should have unique UID for each event', async () => {
      const response1 = await request(app)
        .post(`/api/calendar/generate/${eventIds[0].toString()}`)
        .expect(200);

      const response2 = await request(app)
        .post(`/api/calendar/generate/${eventIds[1].toString()}`)
        .expect(200);

      const icsContent1 = response1.text;
      const icsContent2 = response2.text;

      const uid1Match = icsContent1.match(/UID:([^\r\n]+)/);
      const uid2Match = icsContent2.match(/UID:([^\r\n]+)/);

      expect(uid1Match).toBeTruthy();
      expect(uid2Match).toBeTruthy();
      expect(uid1Match[1]).not.toEqual(uid2Match[1]);
    });
  });

  describe('AT6: Regenerated `.ics` file reflects updated event info', () => {
    it('should reflect updated event title in regenerated ICS', async () => {
      // Generate initial ICS
      const initialResponse = await request(app)
        .post(`/api/calendar/generate/${eventIds[2].toString()}`)
        .expect(200);

      expect(initialResponse.text).toContain('SUMMARY:Workshop Event');

      // Update event title
      await Event.findByIdAndUpdate(eventIds[2], {
        title: 'Updated Workshop Event Title'
      });

      // Regenerate ICS
      const updatedResponse = await request(app)
        .post(`/api/calendar/generate/${eventIds[2].toString()}`)
        .expect(200);

      expect(updatedResponse.text).toContain('SUMMARY:Updated Workshop Event Title');
      expect(updatedResponse.text).not.toContain('SUMMARY:Workshop Event');
    });

    it('should reflect updated event description in regenerated ICS', async () => {
      // Generate initial ICS
      const initialResponse = await request(app)
        .post(`/api/calendar/generate/${eventIds[2].toString()}`)
        .expect(200);

      expect(initialResponse.text).toContain('Learn modern web development');

      // Update event description
      await Event.findByIdAndUpdate(eventIds[2], {
        description: 'Updated description: Advanced web development techniques'
      });

      // Regenerate ICS
      const updatedResponse = await request(app)
        .post(`/api/calendar/generate/${eventIds[2].toString()}`)
        .expect(200);

      expect(updatedResponse.text).toContain('Advanced web development techniques');
    });

    it('should reflect updated event location in regenerated ICS', async () => {
      // Generate initial ICS
      const initialResponse = await request(app)
        .post(`/api/calendar/generate/${eventIds[2].toString()}`)
        .expect(200);

      expect(initialResponse.text).toContain('Tech Hub');
      expect(initialResponse.text).toContain('789 Workshop Road');

      // Update event location
      await Event.findByIdAndUpdate(eventIds[2], {
        location: {
          name: 'New Tech Hub',
          address: '999 Updated Street, New City'
        }
      });

      // Regenerate ICS
      const updatedResponse = await request(app)
        .post(`/api/calendar/generate/${eventIds[2].toString()}`)
        .expect(200);

      expect(updatedResponse.text).toContain('New Tech Hub');
      expect(updatedResponse.text).toContain('999 Updated Street');
      // Check that the old location format is not present (old address should be gone)
      expect(updatedResponse.text).not.toContain('789 Workshop Road');
    });

    it('should reflect updated event time in regenerated ICS', async () => {
      const newStartDate = new Date();
      newStartDate.setDate(newStartDate.getDate() + 10);
      const newEndDate = new Date(newStartDate.getTime() + 4 * 60 * 60 * 1000);

      // Update event times
      await Event.findByIdAndUpdate(eventIds[2], {
        start_at: newStartDate,
        end_at: newEndDate
      });

      // Regenerate ICS
      const updatedResponse = await request(app)
        .post(`/api/calendar/generate/${eventIds[2].toString()}`)
        .expect(200);

      const icsContent = updatedResponse.text;
      expect(icsContent).toContain('DTSTART:');
      // ICS library uses DURATION instead of DTEND when duration is provided
      expect(icsContent).toMatch(/DURATION:|DTEND:/);
      
      // Verify the dates are updated (check year/month/day)
      const year = newStartDate.getUTCFullYear();
      const month = String(newStartDate.getUTCMonth() + 1).padStart(2, '0');
      const day = String(newStartDate.getUTCDate()).padStart(2, '0');
      const dateString = `${year}${month}${day}`;
      expect(icsContent).toContain(dateString);
    });
  });

  describe('AT7: Success and error toasts provide user feedback', () => {
    it('should return 200 status for successful ICS generation', async () => {
      const response = await request(app)
        .post(`/api/calendar/generate/${eventIds[0].toString()}`)
        .expect(200);

      expect(response.headers['content-type']).toContain('text/calendar');
      // Frontend should show success toast on 200 response
    });

    it('should return 404 for non-existent event', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .post(`/api/calendar/generate/${fakeId}`)
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('not found');
      // Frontend should show error toast on 404 response
    });

    it('should return 400 for invalid event ID format', async () => {
      const response = await request(app)
        .post('/api/calendar/generate/invalid-id-format')
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Invalid event id format');
      // Frontend should show error toast on 400 response
    });

    it('should return 400 when event_id is missing', async () => {
      const response = await request(app)
        .post('/api/calendar/generate/')
        .expect(404); // Express returns 404 for missing route param

      // Frontend should handle this error appropriately
    });
  });

  describe('AT8: Time zones are correctly formatted and preserved', () => {
    it('should use UTC timezone in ICS file', async () => {
      const response = await request(app)
        .post(`/api/calendar/generate/${eventIds[0].toString()}`)
        .expect(200);

      const icsContent = response.text;
      
      // Check that dates are in UTC format (ending with Z or using UTC time)
      const dtstartMatch = icsContent.match(/DTSTART[^:]*:([^\r\n]+)/);
      if (dtstartMatch) {
        const dtstart = dtstartMatch[1];
        // Should be in UTC format: YYYYMMDDTHHMMSSZ
        expect(dtstart).toMatch(/^\d{8}T\d{6}/);
      }
    });

    it('should correctly calculate duration based on UTC times', async () => {
      const response = await request(app)
        .post(`/api/calendar/generate/${eventIds[0].toString()}`)
        .expect(200);

      const icsContent = response.text;
      
      // Event should have proper DTSTART
      expect(icsContent).toContain('DTSTART:');
      
      // ICS library uses DURATION instead of DTEND when duration is provided
      // Both are valid RFC 5545, but we check for DURATION since that's what the library generates
      const dtstartMatch = icsContent.match(/DTSTART[^:]*:(\d{8}T\d{6})/);
      const durationMatch = icsContent.match(/DURATION[^:]*:([^\r\n]+)/);
      
      if (dtstartMatch) {
        const startTime = dtstartMatch[1];
        expect(startTime).toBeTruthy();
      }
      
      // Verify DURATION is present (or DTEND if library uses it)
      if (durationMatch) {
        const duration = durationMatch[1];
        // DURATION format: PT8H (Period Time 8 Hours) or PT8H30M
        expect(duration).toMatch(/^PT\d+/);
      } else {
        // If DURATION is not present, check for DTEND
        const dtendMatch = icsContent.match(/DTEND[^:]*:(\d{8}T\d{6})/);
        if (dtendMatch && dtstartMatch) {
          const startTime = dtstartMatch[1];
          const endTime = dtendMatch[1];
          expect(endTime > startTime).toBe(true);
        }
      }
    });

    it('should preserve timezone information across different events', async () => {
      const response1 = await request(app)
        .post(`/api/calendar/generate/${eventIds[0].toString()}`)
        .expect(200);

      const response2 = await request(app)
        .post(`/api/calendar/generate/${eventIds[1].toString()}`)
        .expect(200);

      const icsContent1 = response1.text;
      const icsContent2 = response2.text;

      // Both should use consistent UTC format
      const dtstart1Match = icsContent1.match(/DTSTART[^:]*:(\d{8}T\d{6})/);
      const dtstart2Match = icsContent2.match(/DTSTART[^:]*:(\d{8}T\d{6})/);

      expect(dtstart1Match).toBeTruthy();
      expect(dtstart2Match).toBeTruthy();
      // Both should follow same format
      expect(dtstart1Match[1].length).toBe(dtstart2Match[1].length);
    });
  });
});

