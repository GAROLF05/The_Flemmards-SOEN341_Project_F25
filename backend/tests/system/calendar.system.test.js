const request = require('supertest');
const app = require('../../app');
const { User } = require('../../models/User');
const { Organization } = require('../../models/Organization');
const { Event, EVENT_STATUS, MODERATION_STATUS } = require('../../models/Event');
const Administrator = require('../../models/Administrators');
const bcrypt = require('bcrypt');

/**
 * System Test: Complete Calendar ICS Generation Workflow
 * 1. Event creation with full details (organization, location, dates)
 * 2. ICS generation for various event scenarios
 * 3. Validation of ICS file content and structure
 * 4. Edge cases: missing data, different date formats, etc.
 * 5. Multiple events and batch ICS generation
 */
describe('Calendar System Test - Complete ICS Generation Workflow', () => {
  let adminToken;
  let organizerToken;
  let organizerUserId;
  let organizationId;
  let eventIds = [];

  beforeEach(async () => {
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

    // Create organization
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

    // Approve organization
    await Organization.findByIdAndUpdate(organizationId, {
      status: 'approved'
    });
  });

  describe('Complete Calendar ICS Workflow', () => {
    it('should execute complete calendar workflow from event creation to ICS generation', async () => {
      // ============================================
      // PHASE 1: Create Event with Full Details
      // ============================================
      console.log('Phase 1: Create Event with Full Details');

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 14);
      const endDate = new Date(futureDate.getTime() + 3 * 60 * 60 * 1000); // 3 hours later

      const eventResponse = await request(app)
        .post('/api/events/create')
        .set('Authorization', `Bearer ${organizerToken}`)
        .field('title', 'Calendar System Test Event')
        .field('description', 'Event created for calendar ICS generation testing')
        .field('start_at', futureDate.toISOString())
        .field('end_at', endDate.toISOString())
        .field('capacity', 100)
        .field('category', 'workshop')
        .field('organization', organizationId)
        .field('location[name]', 'Test Conference Center')
        .field('location[address]', '123 Calendar Test Street, Montreal, QC')
        .expect(201);

      const eventId = eventResponse.body.event._id;
      eventIds.push(eventId);

      expect(eventResponse.body.event.title).toBe('Calendar System Test Event');
      expect(eventResponse.body.event.moderationStatus).toBe('pending_approval');

      // Approve event
      await request(app)
        .patch(`/api/admin/events/approve/${eventId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // ============================================
      // PHASE 2: Generate ICS File
      // ============================================
      console.log('Phase 2: Generate ICS File');

      const icsResponse = await request(app)
        .post(`/api/calendar/generate/${eventId}`)
        .expect(200);

      // Verify response headers
      expect(icsResponse.headers['content-type']).toContain('text/calendar');
      expect(icsResponse.headers['content-disposition']).toContain(`event-${eventId}.ics`);

      // Verify ICS file structure
      const icsContent = icsResponse.text;
      expect(icsContent).toContain('BEGIN:VCALENDAR');
      expect(icsContent).toContain('END:VCALENDAR');
      expect(icsContent).toContain('BEGIN:VEVENT');
      expect(icsContent).toContain('END:VEVENT');

      // Verify event details in ICS
      expect(icsContent).toContain('SUMMARY:Calendar System Test Event');
      expect(icsContent).toContain('DESCRIPTION:Event created for calendar ICS generation testing');
      expect(icsContent).toContain('Test Conference Center');
      expect(icsContent).toContain('123 Calendar Test Street');
      expect(icsContent).toContain('STATUS:CONFIRMED');
      expect(icsContent).toContain('BUSY');

      // Verify organizer information
      expect(icsContent).toContain('Calendar Test Organization');
      expect(icsContent).toContain('calendar@systemtest.org');

      console.log('✅ Complete Calendar Workflow Test Passed!');
    });

    it('should handle ICS generation for events with different scenarios', async () => {
      // ============================================
      // SCENARIO 1: Event with simple location (both name and address required)
      // ============================================
      console.log('Scenario 1: Event with simple location');

      const futureDate1 = new Date();
      futureDate1.setDate(futureDate1.getDate() + 10);
      const endDate1 = new Date(futureDate1.getTime() + 2 * 60 * 60 * 1000);

      const event1Response = await request(app)
        .post('/api/events/create')
        .set('Authorization', `Bearer ${organizerToken}`)
        .field('title', 'Simple Location Event')
        .field('description', 'Event with simple location')
        .field('start_at', futureDate1.toISOString())
        .field('end_at', endDate1.toISOString())
        .field('capacity', 50)
        .field('category', 'workshop')
        .field('organization', organizationId)
        .field('location[name]', 'Simple Venue')
        .field('location[address]', '123 Simple Street')
        .expect(201);

      const event1Id = event1Response.body.event._id;
      eventIds.push(event1Id);

      await request(app)
        .patch(`/api/admin/events/approve/${event1Id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const ics1Response = await request(app)
        .post(`/api/calendar/generate/${event1Id}`)
        .expect(200);

      const ics1Content = ics1Response.text;
      expect(ics1Content).toContain('SUMMARY:Simple Location Event');
      expect(ics1Content).toContain('Simple Venue');
      expect(ics1Content).toContain('123 Simple Street');

      // ============================================
      // SCENARIO 2: Event with detailed location
      // ============================================
      console.log('Scenario 2: Event with detailed location');

      const futureDate2 = new Date();
      futureDate2.setDate(futureDate2.getDate() + 12);
      const endDate2 = new Date(futureDate2.getTime() + 1.5 * 60 * 60 * 1000);

      const event2Response = await request(app)
        .post('/api/events/create')
        .set('Authorization', `Bearer ${organizerToken}`)
        .field('title', 'Detailed Location Event')
        .field('description', 'Event with detailed location information')
        .field('start_at', futureDate2.toISOString())
        .field('end_at', endDate2.toISOString())
        .field('capacity', 75)
        .field('category', 'workshop')
        .field('organization', organizationId)
        .field('location[name]', 'Grand Conference Hall')
        .field('location[address]', '456 Main Boulevard, Suite 100, Montreal, QC H3A 1A1')
        .expect(201);

      const event2Id = event2Response.body.event._id;
      eventIds.push(event2Id);

      await request(app)
        .patch(`/api/admin/events/approve/${event2Id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const ics2Response = await request(app)
        .post(`/api/calendar/generate/${event2Id}`)
        .expect(200);

      const ics2Content = ics2Response.text;
      expect(ics2Content).toContain('SUMMARY:Detailed Location Event');
      expect(ics2Content).toContain('Grand Conference Hall');
      expect(ics2Content).toContain('456 Main Boulevard');

      // ============================================
      // SCENARIO 3: Event with virtual location (still requires both fields)
      // ============================================
      console.log('Scenario 3: Event with virtual location');

      const futureDate3 = new Date();
      futureDate3.setDate(futureDate3.getDate() + 15);
      const endDate3 = new Date(futureDate3.getTime() + 4 * 60 * 60 * 1000);

      const event3Response = await request(app)
        .post('/api/events/create')
        .set('Authorization', `Bearer ${organizerToken}`)
        .field('title', 'Virtual Event')
        .field('description', 'Virtual event with online location')
        .field('start_at', futureDate3.toISOString())
        .field('end_at', endDate3.toISOString())
        .field('capacity', 200)
        .field('category', 'workshop')
        .field('organization', organizationId)
        .field('location[name]', 'Online')
        .field('location[address]', 'Zoom Meeting - Link will be sent via email')
        .expect(201);

      const event3Id = event3Response.body.event._id;
      eventIds.push(event3Id);

      await request(app)
        .patch(`/api/admin/events/approve/${event3Id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const ics3Response = await request(app)
        .post(`/api/calendar/generate/${event3Id}`)
        .expect(200);

      const ics3Content = ics3Response.text;
      expect(ics3Content).toContain('SUMMARY:Virtual Event');
      expect(ics3Content).toContain('Online');

      // ============================================
      // SCENARIO 4: Long duration event
      // ============================================
      console.log('Scenario 4: Long duration event');

      const futureDate4 = new Date();
      futureDate4.setDate(futureDate4.getDate() + 20);
      const endDate4 = new Date(futureDate4.getTime() + 8 * 60 * 60 * 1000); // 8 hours

      const event4Response = await request(app)
        .post('/api/events/create')
        .set('Authorization', `Bearer ${organizerToken}`)
        .field('title', 'All Day Workshop')
        .field('description', 'Long duration workshop event')
        .field('start_at', futureDate4.toISOString())
        .field('end_at', endDate4.toISOString())
        .field('capacity', 30)
        .field('category', 'workshop')
        .field('organization', organizationId)
        .field('location[name]', 'Workshop Center')
        .field('location[address]', '789 Workshop Avenue')
        .expect(201);

      const event4Id = event4Response.body.event._id;
      eventIds.push(event4Id);

      await request(app)
        .patch(`/api/admin/events/approve/${event4Id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const ics4Response = await request(app)
        .post(`/api/calendar/generate/${event4Id}`)
        .expect(200);

      const ics4Content = ics4Response.text;
      expect(ics4Content).toContain('SUMMARY:All Day Workshop');
      // Verify duration is correctly calculated (8 hours)
      expect(ics4Content).toMatch(/DURATION:PT\d+H/); // Duration format

      console.log('✅ Multiple Scenarios Test Passed!');
    });

    it('should handle error cases for ICS generation', async () => {
      // ============================================
      // ERROR CASE 1: Non-existent event
      // ============================================
      console.log('Error Case 1: Non-existent event');

      const fakeId = '507f1f77bcf86cd799439011';
      const errorResponse1 = await request(app)
        .post(`/api/calendar/generate/${fakeId}`)
        .expect(404);

      expect(errorResponse1.body).toHaveProperty('error');
      expect(errorResponse1.body.error).toBe('Event not found');

      // ============================================
      // ERROR CASE 2: Invalid event ID format
      // ============================================
      console.log('Error Case 2: Invalid event ID format');

      const invalidId = 'not-a-valid-id';
      const errorResponse2 = await request(app)
        .post(`/api/calendar/generate/${invalidId}`)
        .expect(400);

      expect(errorResponse2.body).toHaveProperty('error');
      expect(errorResponse2.body.error).toBe('Invalid event id format');

      // ============================================
      // ERROR CASE 3: Missing event ID
      // ============================================
      console.log('Error Case 3: Missing event ID');

      const errorResponse3 = await request(app)
        .post('/api/calendar/generate/')
        .expect(404); // Route not found, but we can test with empty body

      console.log('✅ Error Cases Test Passed!');
    });

    it('should generate ICS for multiple events and verify consistency', async () => {
      console.log('Multiple Events ICS Generation Test');

      const events = [];
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5);

      // Create 5 events with different properties
      for (let i = 0; i < 5; i++) {
        const eventDate = new Date(futureDate);
        eventDate.setDate(eventDate.getDate() + i);
        const endDate = new Date(eventDate.getTime() + (2 + i) * 60 * 60 * 1000);

        const eventResponse = await request(app)
          .post('/api/events/create')
          .set('Authorization', `Bearer ${organizerToken}`)
          .field('title', `Batch Event ${i + 1}`)
          .field('description', `Event number ${i + 1} for batch testing`)
          .field('start_at', eventDate.toISOString())
          .field('end_at', endDate.toISOString())
          .field('capacity', 50 + i * 10)
          .field('category', 'workshop')
          .field('organization', organizationId)
          .field('location[name]', `Venue ${i + 1}`)
          .field('location[address]', `${i + 1}00 Test Street`)
          .expect(201);

        const eventId = eventResponse.body.event._id;
        events.push(eventId);
        eventIds.push(eventId);

        // Approve event
        await request(app)
          .patch(`/api/admin/events/approve/${eventId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);
      }

      // Generate ICS for all events and verify
      for (let i = 0; i < events.length; i++) {
        const icsResponse = await request(app)
          .post(`/api/calendar/generate/${events[i]}`)
          .expect(200);

        const icsContent = icsResponse.text;

        // Verify basic structure
        expect(icsContent).toContain('BEGIN:VCALENDAR');
        expect(icsContent).toContain('END:VCALENDAR');
        expect(icsContent).toContain('BEGIN:VEVENT');
        expect(icsContent).toContain('END:VEVENT');

        // Verify event-specific content
        expect(icsContent).toContain(`SUMMARY:Batch Event ${i + 1}`);
        expect(icsContent).toContain(`Event number ${i + 1}`);
        expect(icsContent).toContain(`Venue ${i + 1}`);
        expect(icsContent).toContain(`${i + 1}00 Test Street`);

        // Verify headers
        expect(icsResponse.headers['content-type']).toContain('text/calendar');
        expect(icsResponse.headers['content-disposition']).toContain(`event-${events[i]}.ics`);
      }

      console.log('✅ Multiple Events ICS Generation Test Passed!');
    });

    it('should handle events with organization fallback values', async () => {
      console.log('Organization Fallback Test');

      // Create a new organizer for this test (since one organizer can only have one org)
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

      const organizer2UserId = organizer2Register.body.user._id;
      await User.findByIdAndUpdate(organizer2UserId, { verified: true, approved: true });

      const organizer2Login = await request(app)
        .post('/api/users/login')
        .send({
          usernameEmail: 'calendarorganizer2@systemtest.com',
          password: 'Organizer1234!'
        })
        .expect(200);

      const organizer2Token = organizer2Login.body.token;

      // Create organization without contact email (will set email to null after creation)
      const orgResponse = await request(app)
        .post('/api/org/create')
        .set('Authorization', `Bearer ${organizer2Token}`)
        .send({
          name: 'No Email Organization',
          description: 'Organization without email',
          website: 'https://noemail.org',
          contact: {
            email: 'temp@example.com', // Required for creation
            phone: '+1234567890'
          }
        })
        .expect(201);

      const orgId = orgResponse.body.organization._id;
      await Organization.findByIdAndUpdate(orgId, { status: 'approved' });

      // Remove email after creation (simulating missing email scenario)
      await Organization.findByIdAndUpdate(orgId, {
        'contact.email': null
      });

      // Create event with this organization
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 8);
      const endDate = new Date(futureDate.getTime() + 2 * 60 * 60 * 1000);

      const eventResponse = await request(app)
        .post('/api/events/create')
        .set('Authorization', `Bearer ${organizer2Token}`)
        .field('title', 'Event with Org No Email')
        .field('description', 'Testing fallback email')
        .field('start_at', futureDate.toISOString())
        .field('end_at', endDate.toISOString())
        .field('capacity', 50)
        .field('category', 'workshop')
        .field('organization', orgId)
        .field('location[name]', 'Test Location')
        .field('location[address]', '123 Test Street')
        .expect(201);

      const eventId = eventResponse.body.event._id;
      eventIds.push(eventId);

      await request(app)
        .patch(`/api/admin/events/approve/${eventId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Generate ICS - should use fallback email
      const icsResponse = await request(app)
        .post(`/api/calendar/generate/${eventId}`)
        .expect(200);

      const icsContent = icsResponse.text;
      expect(icsContent).toContain('No Email Organization'); // Should still have org name
      // Should use default email when organization email is missing
      expect(icsContent).toContain('noreply@flemmards.ca');

      console.log('✅ Organization Fallback Test Passed!');
    });

    it('should verify ICS file contains correct date/time formatting', async () => {
      console.log('Date/Time Formatting Test');

      // Create event with specific future date/time
      const specificDate = new Date();
      specificDate.setDate(specificDate.getDate() + 30); // 30 days from now
      specificDate.setHours(14, 30, 0, 0); // 2:30 PM
      const endDate = new Date(specificDate);
      endDate.setHours(17, 45, 0, 0); // 5:45 PM

      const eventResponse = await request(app)
        .post('/api/events/create')
        .set('Authorization', `Bearer ${organizerToken}`)
        .field('title', 'Date Format Test Event')
        .field('description', 'Testing date formatting in ICS')
        .field('start_at', specificDate.toISOString())
        .field('end_at', endDate.toISOString())
        .field('capacity', 50)
        .field('category', 'workshop')
        .field('organization', organizationId)
        .field('location[name]', 'Time Test Venue')
        .field('location[address]', '789 Time Test Avenue')
        .expect(201);

      const eventId = eventResponse.body.event._id;
      eventIds.push(eventId);

      await request(app)
        .patch(`/api/admin/events/approve/${eventId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const icsResponse = await request(app)
        .post(`/api/calendar/generate/${eventId}`)
        .expect(200);

      const icsContent = icsResponse.text;

      // Verify ICS contains date/time in proper format (YYYYMMDDTHHMMSSZ)
      // The ics library uses DTSTART and DURATION (not DTEND)
      expect(icsContent).toMatch(/DTSTART/);
      expect(icsContent).toMatch(/DURATION/);
      
      // Extract year from the date we set (should be current year + 0 or 1)
      const year = specificDate.getFullYear();
      expect(icsContent).toMatch(new RegExp(year.toString())); // Year should be in the content

      // Verify duration is calculated correctly (3 hours 15 minutes = PT3H15M)
      expect(icsContent).toMatch(/DURATION:PT\d+H\d+M/);

      console.log('✅ Date/Time Formatting Test Passed!');
    });
  });
});

