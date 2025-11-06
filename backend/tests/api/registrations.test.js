const request = require('supertest');
const app = require('../../app');
const User = require('../../models/User');
const Organization = require('../../models/Organization');
const Event = require('../../models/Event');
const Registration = require('../../models/Registration');

describe('Registrations API Endpoints', () => {
  let authToken;
  let userId;
  let orgId;
  let eventId;

  beforeEach(async () => {
    // Create a test user
    const registerResponse = await request(app)
      .post('/api/users/register')
      .send({
        email: 'student@example.com',
        password: 'Test1234!',
        name: 'Student User',
        role: 'Student'
      });

    userId = registerResponse.body.user._id;

    const loginResponse = await request(app)
      .post('/api/users/login')
      .send({
        email: 'student@example.com',
        password: 'Test1234!'
      });

    authToken = loginResponse.body.token;

    // Create an organization
    const org = await Organization.create({
      name: 'Test Organization',
      description: 'Test Org Description',
      status: 'approved',
      contact: { email: 'org@example.com' }
    });
    orgId = org._id.toString();

    // Create an event
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);

    const event = await Event.create({
      title: 'Test Event',
      description: 'Test Event Description',
      start_at: futureDate,
      end_at: new Date(futureDate.getTime() + 2 * 60 * 60 * 1000),
      capacity: 100,
      category: 'workshop',
      organization: orgId,
      status: 'published',
      moderationStatus: 'approved'
    });
    eventId = event._id.toString();
  });

  describe('POST /api/registrations/register', () => {
    it('should register user to event successfully', async () => {
      const registrationData = {
        event_id: eventId
      };

      const response = await request(app)
        .post('/api/registrations/register')
        .set('Authorization', `Bearer ${authToken}`)
        .send(registrationData)
        .expect(201);

      expect(response.body).toHaveProperty('registration');
      expect(response.body.registration.event).toBe(eventId);
      expect(response.body.registration.user).toBe(userId);
    });

    it('should reject registration without authentication', async () => {
      const registrationData = {
        event_id: eventId
      };

      await request(app)
        .post('/api/registrations/register')
        .send(registrationData)
        .expect(401);
    });

    it('should reject registration with missing event_id', async () => {
      const response = await request(app)
        .post('/api/registrations/register')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject duplicate registration', async () => {
      const registrationData = {
        event_id: eventId
      };

      // First registration
      await request(app)
        .post('/api/registrations/register')
        .set('Authorization', `Bearer ${authToken}`)
        .send(registrationData)
        .expect(201);

      // Try to register again
      const response = await request(app)
        .post('/api/registrations/register')
        .set('Authorization', `Bearer ${authToken}`)
        .send(registrationData)
        .expect(409);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/registrations/get/by-user/:user_id', () => {
    beforeEach(async () => {
      // Create a registration
      await Registration.create({
        user: userId,
        event: eventId,
        status: 'confirmed'
      });
    });

    it('should get registrations by user', async () => {
      const response = await request(app)
        .get(`/api/registrations/get/by-user/${userId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('registrations');
      expect(Array.isArray(response.body.registrations)).toBe(true);
      expect(response.body.registrations.length).toBeGreaterThan(0);
    });

    it('should reject request without authentication', async () => {
      await request(app)
        .get(`/api/registrations/get/by-user/${userId}`)
        .expect(401);
    });
  });

  describe('GET /api/registrations/get/by-event/:event_id', () => {
    beforeEach(async () => {
      await Registration.create({
        user: userId,
        event: eventId,
        status: 'confirmed'
      });
    });

    it('should get registrations by event', async () => {
      const response = await request(app)
        .get(`/api/registrations/get/by-event/${eventId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('registrations');
      expect(Array.isArray(response.body.registrations)).toBe(true);
    });
  });

  describe('PUT /api/registrations/cancel/:reg_id', () => {
    let registrationId;

    beforeEach(async () => {
      const registration = await Registration.create({
        user: userId,
        event: eventId,
        status: 'confirmed'
      });
      registrationId = registration._id.toString();
    });

    it('should cancel registration', async () => {
      const response = await request(app)
        .put(`/api/registrations/cancel/${registrationId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.registration.status).toBe('cancelled');
    });

    it('should reject cancellation without authentication', async () => {
      await request(app)
        .put(`/api/registrations/cancel/${registrationId}`)
        .expect(401);
    });
  });

  describe('DELETE /api/registrations/delete/:reg_id', () => {
    let registrationId;

    beforeEach(async () => {
      const registration = await Registration.create({
        user: userId,
        event: eventId,
        status: 'confirmed'
      });
      registrationId = registration._id.toString();
    });

    it('should delete registration', async () => {
      await request(app)
        .delete(`/api/registrations/delete/${registrationId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify deletion
      const reg = await Registration.findById(registrationId);
      expect(reg).toBeNull();
    });
  });
});

