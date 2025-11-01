const request = require('supertest');
const app = require('../../app');
const User = require('../../models/User');
const Organization = require('../../models/Organization');
const Event = require('../../models/Event');

describe('Events API Endpoints', () => {
  let authToken;
  let userId;
  let orgId;

  beforeEach(async () => {
    // Create a test user (organizer)
    const registerResponse = await request(app)
      .post('/api/users/register')
      .send({
        email: 'organizer@example.com',
        password: 'Test1234!',
        name: 'Organizer Test',
        role: 'Organizer'
      });

    userId = registerResponse.body.user._id;

    // Login to get token
    const loginResponse = await request(app)
      .post('/api/users/login')
      .send({
        email: 'organizer@example.com',
        password: 'Test1234!'
      });

    authToken = loginResponse.body.token;

    // Create an approved organization
    const org = await Organization.create({
      name: 'Test Organization',
      description: 'Test Org Description',
      status: 'approved',
      contact: {
        email: 'org@example.com'
      }
    });
    orgId = org._id.toString();
  });

  describe('GET /api/events/browse', () => {
    beforeEach(async () => {
      // Create some test events
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7); // 7 days from now

      await Event.create({
        title: 'Test Event 1',
        description: 'Description 1',
        start_at: futureDate,
        end_at: new Date(futureDate.getTime() + 2 * 60 * 60 * 1000), // 2 hours later
        capacity: 100,
        category: 'workshop',
        organization: orgId,
        status: 'published',
        moderationStatus: 'approved'
      });

      await Event.create({
        title: 'Test Event 2',
        description: 'Description 2',
        start_at: futureDate,
        end_at: new Date(futureDate.getTime() + 2 * 60 * 60 * 1000),
        capacity: 50,
        category: 'social',
        organization: orgId,
        status: 'published',
        moderationStatus: 'approved'
      });
    });

    it('should return all events', async () => {
      const response = await request(app)
        .get('/api/events/browse')
        .expect(200);

      expect(response.body).toHaveProperty('events');
      expect(Array.isArray(response.body.events)).toBe(true);
      expect(response.body.events.length).toBeGreaterThan(0);
    });

    it('should filter events by category', async () => {
      const response = await request(app)
        .get('/api/events/browse?category=workshop')
        .expect(200);

      expect(response.body.events).toBeDefined();
      // All returned events should be workshop category
      response.body.events.forEach(event => {
        expect(event.category).toBe('workshop');
      });
    });

    it('should filter events by search query', async () => {
      const response = await request(app)
        .get('/api/events/browse?q=Test Event 1')
        .expect(200);

      expect(response.body.events).toBeDefined();
      const titles = response.body.events.map(e => e.title);
      expect(titles.some(title => title.includes('Test Event 1'))).toBe(true);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/events/browse?page=1&limit=1')
        .expect(200);

      expect(response.body.events.length).toBeLessThanOrEqual(1);
      expect(response.body).toHaveProperty('pagination');
    });
  });

  describe('POST /api/events/create', () => {
    it('should create event with valid data and authentication', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      const eventData = {
        title: 'New Test Event',
        description: 'Event description',
        start_at: futureDate.toISOString(),
        end_at: new Date(futureDate.getTime() + 2 * 60 * 60 * 1000).toISOString(),
        capacity: 100,
        category: 'workshop',
        organization: orgId,
        location: {
          name: 'Room 101',
          address: '123 Main St'
        }
      };

      const response = await request(app)
        .post('/api/events/create')
        .set('Authorization', `Bearer ${authToken}`)
        .send(eventData)
        .expect(201);

      expect(response.body).toHaveProperty('event');
      expect(response.body.event.title).toBe(eventData.title);
    });

    it('should reject event creation without authentication', async () => {
      const eventData = {
        title: 'New Test Event',
        description: 'Event description',
        start_at: new Date().toISOString(),
        end_at: new Date().toISOString(),
        capacity: 100,
        category: 'workshop'
      };

      await request(app)
        .post('/api/events/create')
        .send(eventData)
        .expect(401);
    });

    it('should reject event creation with missing required fields', async () => {
      const eventData = {
        title: 'New Test Event'
        // Missing required fields
      };

      const response = await request(app)
        .post('/api/events/create')
        .set('Authorization', `Bearer ${authToken}`)
        .send(eventData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });
});

