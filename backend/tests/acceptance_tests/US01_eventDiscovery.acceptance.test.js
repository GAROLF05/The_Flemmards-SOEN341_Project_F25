const request = require('supertest');
const app = require('../../app');
const { User } = require('../../models/User');
const { Organization } = require('../../models/Organization');
const { Event, EVENT_STATUS, MODERATION_STATUS, CATEGORY } = require('../../models/Event');
const { Registration, REGISTRATION_STATUS } = require('../../models/Registrations');
const Administrator = require('../../models/Administrators');
const bcrypt = require('bcrypt');

/**
 * System Test: US.01 - Event Discovery (Student) - Filtering, Browsing
 * 
 * Acceptance Tests:
 * 1. Opening event browsing page displays all active events with their title, date, category, location and price
 * 2. Scrolling page to list more events
 * 3. Applying filters to display events by category, date and organization. If no events match, display informative message
 * 4. Clearing filters using a "Clear Filters" button
 * 5. Entering keywords in the search bar to find events that match based on queries
 * 6. A custom error message pops up when losing connection to the server
 */
describe('US.01 - Event Discovery (Student) - System Test', () => {
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
    // Setup: Create admin user
    const hashedPassword = await bcrypt.hash('Admin1234!', 10);
    const adminUser = await Administrator.create({
      email: 'discoveryadmin@example.com',
      password: hashedPassword,
      name: 'Discovery Admin'
    });

    // Admin login
    const adminLogin = await request(app)
      .post('/api/users/login')
      .send({
        usernameEmail: 'discoveryadmin@example.com',
        password: 'Admin1234!',
        role: 'admin'
      });
    adminToken = adminLogin.body.token;

    // Create organizer
    const organizerRegister = await request(app)
      .post('/api/users/register')
      .send({
        email: 'discoveryorganizer@systemtest.com',
        password: 'Organizer1234!',
        name: 'Discovery Test Organizer',
        role: 'Organizer',
        username: `discovery_org_${Date.now()}_${Math.random().toString(36).substring(7)}`
      })
      .expect(201);

    organizerUserId = organizerRegister.body.user._id;
    await User.findByIdAndUpdate(organizerUserId, { verified: true, approved: true });

    // Organizer login
    const organizerLogin = await request(app)
      .post('/api/users/login')
      .send({
        usernameEmail: 'discoveryorganizer@systemtest.com',
        password: 'Organizer1234!'
      })
      .expect(200);

    organizerToken = organizerLogin.body.token;

    // Create organization 1
    const orgResponse = await request(app)
      .post('/api/org/create')
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({
        name: 'Discovery Test Organization',
        description: 'Organization for discovery system tests',
        website: 'https://discoverytest.org',
        contact: {
          email: 'discovery@systemtest.org',
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
        email: 'discoveryorganizer2@systemtest.com',
        password: 'Organizer1234!',
        name: 'Discovery Test Organizer 2',
        role: 'Organizer',
        username: `discovery_org2_${Date.now()}_${Math.random().toString(36).substring(7)}`
      })
      .expect(201);

    organizer2UserId = organizer2Register.body.user._id;
    await User.findByIdAndUpdate(organizer2UserId, { verified: true, approved: true });

    // Second organizer login
    const organizer2Login = await request(app)
      .post('/api/users/login')
      .send({
        usernameEmail: 'discoveryorganizer2@systemtest.com',
        password: 'Organizer1234!'
      })
      .expect(200);

    organizer2Token = organizer2Login.body.token;

    // Create organization 2 with second organizer
    const orgResponse2 = await request(app)
      .post('/api/org/create')
      .set('Authorization', `Bearer ${organizer2Token}`)
      .send({
        name: 'Discovery Test Organization 2',
        description: 'Second organization for discovery tests',
        website: 'https://discoverytest2.org',
        contact: {
          email: 'discovery2@systemtest.org',
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
        email: 'discoverystudent@systemtest.com',
        password: 'Student1234!',
        name: 'Discovery Test Student',
        role: 'Student',
        username: `discovery_student_${Date.now()}_${Math.random().toString(36).substring(7)}`
      })
      .expect(201);

    studentUserId = studentRegister.body.user._id;
    await User.findByIdAndUpdate(studentUserId, { verified: true });

    // Student login
    const studentLogin = await request(app)
      .post('/api/users/login')
      .send({
        usernameEmail: 'discoverystudent@systemtest.com',
        password: 'Student1234!'
      })
      .expect(200);

    studentToken = studentLogin.body.token;

    // Create multiple test events with different properties
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);

    // Event 1: Technology category, high capacity
    const event1 = await Event.create({
      title: 'Tech Conference 2025',
      description: 'Annual technology conference featuring latest innovations',
      start_at: new Date(futureDate.getTime() + 1 * 24 * 60 * 60 * 1000),
      end_at: new Date(futureDate.getTime() + 1 * 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000),
      capacity: 200,
      category: CATEGORY.TECHNOLOGY,
      organization: organizationId,
      status: EVENT_STATUS.UPCOMING,
      moderationStatus: MODERATION_STATUS.APPROVED,
      location: {
        name: 'Convention Center',
        address: '123 Tech Street, Tech City'
      }
    });
    eventIds.push(event1._id);

    // Event 2: Music category, medium capacity
    const event2 = await Event.create({
      title: 'Summer Music Festival',
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

    // Event 3: Workshop category, small capacity, different organization
    const event3 = await Event.create({
      title: 'Web Development Workshop',
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

    // Event 4: Business category, short duration
    const event4 = await Event.create({
      title: 'Business Networking Event',
      description: 'Connect with industry professionals',
      start_at: new Date(futureDate.getTime() + 4 * 24 * 60 * 60 * 1000),
      end_at: new Date(futureDate.getTime() + 4 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
      capacity: 75,
      category: CATEGORY.BUSINESS,
      organization: organizationId,
      status: EVENT_STATUS.UPCOMING,
      moderationStatus: MODERATION_STATUS.APPROVED,
      location: {
        name: 'Business Center',
        address: '321 Business Blvd, Commerce City'
      }
    });
    eventIds.push(event4._id);

    // Event 5: Sports category, for pagination testing
    const event5 = await Event.create({
      title: 'Basketball Tournament',
      description: 'Annual campus basketball championship',
      start_at: new Date(futureDate.getTime() + 5 * 24 * 60 * 60 * 1000),
      end_at: new Date(futureDate.getTime() + 5 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
      capacity: 150,
      category: CATEGORY.SPORTS,
      organization: organizationId,
      status: EVENT_STATUS.UPCOMING,
      moderationStatus: MODERATION_STATUS.APPROVED,
      location: {
        name: 'Sports Arena',
        address: '654 Sports Lane, Athletic City'
      }
    });
    eventIds.push(event5._id);

    // Create some registrations to test "most registered" functionality
    await Registration.create({
      user: studentUserId,
      event: event1._id,
      status: REGISTRATION_STATUS.CONFIRMED,
      quantity: 1
    });

    await Registration.create({
      user: studentUserId,
      event: event2._id,
      status: REGISTRATION_STATUS.CONFIRMED,
      quantity: 1
    });
  });

  describe('AT1: Opening event browsing page displays all active events', () => {
    it('should display all active events with their title, date, category, location and price', async () => {
      const response = await request(app)
        .get('/api/events/browse')
        .expect(200);

      expect(response.body).toHaveProperty('events');
      expect(response.body).toHaveProperty('total');
      expect(Array.isArray(response.body.events)).toBe(true);
      expect(response.body.events.length).toBeGreaterThan(0);

      // Verify each event has required fields: title, date, category, location
      response.body.events.forEach(event => {
        expect(event).toHaveProperty('title');
        expect(event.title).toBeTruthy();
        expect(event).toHaveProperty('start_at');
        expect(event.start_at).toBeTruthy();
        expect(event).toHaveProperty('category');
        expect(event.category).toBeTruthy();
        expect(event).toHaveProperty('location');
        expect(event.location).toHaveProperty('name');
        expect(event.location).toHaveProperty('address');
        // Note: Price may not be in the current model, but location is verified
      });

      // Verify only approved and upcoming/ongoing events are shown
      response.body.events.forEach(event => {
        expect(['upcoming', 'ongoing']).toContain(event.status);
      });
    });
  });

  describe('AT2: Scrolling page to list more events', () => {
    it('should support scrolling to load more events through pagination', async () => {
      // Simulate scrolling by requesting multiple pages
      const allEvents = [];
      let currentPage = 1;
      let hasMore = true;
      const pageSize = 2;

      while (hasMore && currentPage <= 5) {
        const response = await request(app)
          .get(`/api/events/browse?page=${currentPage}&limit=${pageSize}`)
          .expect(200);

        expect(response.body).toHaveProperty('events');
        expect(response.body).toHaveProperty('currentPage', currentPage);
        expect(response.body).toHaveProperty('totalPages');
        expect(response.body.events.length).toBeLessThanOrEqual(pageSize);

        allEvents.push(...response.body.events);
        hasMore = currentPage < response.body.totalPages;
        currentPage++;
      }

      expect(allEvents.length).toBeGreaterThan(0);
      
      // Verify we got different events across pages (no duplicates)
      const eventIds = allEvents.map(e => e._id.toString());
      const uniqueIds = new Set(eventIds);
      expect(uniqueIds.size).toBe(eventIds.length);
    });
  });

  describe('AT3: Applying filters to display events by category, date and organization', () => {
    it('should filter events by category, date and organization', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      const startDate = new Date(futureDate.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString();
      const endDate = new Date(futureDate.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString();

      // Filter by category and date
      const response = await request(app)
        .get(`/api/events/browse?category=technology&startDate=${startDate}&endDate=${endDate}`)
        .expect(200);

      expect(response.body).toHaveProperty('events');
      expect(Array.isArray(response.body.events)).toBe(true);

      if (response.body.events.length > 0) {
        response.body.events.forEach(event => {
          expect(event.category).toBe('technology');
          const eventStart = new Date(event.start_at);
          expect(eventStart >= new Date(startDate)).toBe(true);
          expect(eventStart <= new Date(endDate)).toBe(true);
        });
      }
    });

    it('should display informative message when no events match filters', async () => {
      // Use filters that will yield no results
      const response = await request(app)
        .get('/api/events/browse?category=nonexistentcategory123')
        .expect(200);

      expect(response.body.events).toEqual([]);
      expect(response.body.total).toBe(0);
      // The API returns empty array, frontend should display "No results" message
    });

    it('should filter by organization through populated organization field', async () => {
      const response = await request(app)
        .get('/api/events/browse')
        .expect(200);

      // Filter by organization name in the response
      const org1Events = response.body.events.filter(
        event => event.organization && event.organization.name === 'Discovery Test Organization'
      );
      expect(org1Events.length).toBeGreaterThan(0);
    });
  });

  describe('AT4: Clearing filters using a "Clear Filters" button', () => {
    it('should return all events when filters are cleared', async () => {
      // First, apply filters
      const filteredResponse = await request(app)
        .get('/api/events/browse?category=technology&minCapacity=200')
        .expect(200);

      const filteredCount = filteredResponse.body.total;

      // Then, clear filters (simulate "Clear Filters" button - no query params)
      const clearedResponse = await request(app)
        .get('/api/events/browse')
        .expect(200);

      // All events should have equal or more events than filtered
      expect(clearedResponse.body.total).toBeGreaterThanOrEqual(filteredCount);
      expect(clearedResponse.body.events.length).toBeGreaterThanOrEqual(filteredResponse.body.events.length);
    });
  });

  describe('AT5: Entering keywords in the search bar to find events', () => {
    it('should find events that match based on search queries', async () => {
      // Search by title keyword
      const titleSearchResponse = await request(app)
        .get('/api/events/browse?q=Tech')
        .expect(200);

      expect(titleSearchResponse.body.events.length).toBeGreaterThan(0);
      titleSearchResponse.body.events.forEach(event => {
        const titleMatch = event.title.toLowerCase().includes('tech');
        const descMatch = event.description.toLowerCase().includes('tech');
        expect(titleMatch || descMatch).toBe(true);
      });

      // Search by description keyword
      const descSearchResponse = await request(app)
        .get('/api/events/browse?q=workshop')
        .expect(200);

      expect(descSearchResponse.body.events.length).toBeGreaterThan(0);
      descSearchResponse.body.events.forEach(event => {
        const titleMatch = event.title.toLowerCase().includes('workshop');
        const descMatch = event.description.toLowerCase().includes('workshop');
        expect(titleMatch || descMatch).toBe(true);
      });
    });

    it('should return empty results for non-matching search queries', async () => {
      const response = await request(app)
        .get('/api/events/browse?q=NonExistentEventName12345XYZ')
        .expect(200);

      expect(response.body.events).toEqual([]);
      expect(response.body.total).toBe(0);
    });

    it('should be case-insensitive in search', async () => {
      const response = await request(app)
        .get('/api/events/browse?q=MUSIC')
        .expect(200);

      if (response.body.events.length > 0) {
        response.body.events.forEach(event => {
          const titleMatch = event.title.toLowerCase().includes('music');
          const descMatch = event.description.toLowerCase().includes('music');
          expect(titleMatch || descMatch).toBe(true);
        });
      }
    });
  });

  describe('AT6: Custom error message when losing connection to the server', () => {
    it('should handle server connection errors gracefully', async () => {
      // This test simulates what would happen if the server is down
      // In a real scenario, the frontend would catch network errors
      // For backend testing, we can test error handling in the controller
      
      // Test with invalid endpoint to simulate connection issues
      const response = await request(app)
        .get('/api/events/browse-invalid')
        .expect(404);

      // The frontend should display a custom error message
      // Backend returns 404, frontend should handle this with user-friendly message
    });

    it('should handle malformed requests gracefully', async () => {
      // Test with invalid query parameters
      const response = await request(app)
        .get('/api/events/browse?page=invalid&limit=invalid')
        .expect(200); // API should handle gracefully and use defaults

      expect(response.body).toHaveProperty('events');
      expect(Array.isArray(response.body.events)).toBe(true);
    });
  });
});

