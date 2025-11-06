const request = require('supertest');
const app = require('../../app');
const User = require('../../models/User');
const Organization = require('../../models/Organization');
const Event = require('../../models/Event');
const Registration = require('../../models/Registration');
const Ticket = require('../../models/Ticket');

describe('Tickets API Endpoints', () => {
  let authToken;
  let userId;
  let orgId;
  let eventId;
  let registrationId;
  let ticketId;

  beforeEach(async () => {
    // Create a test user
    const registerResponse = await request(app)
      .post('/api/users/register')
      .send({
        email: 'ticketuser@example.com',
        password: 'Test1234!',
        name: 'Ticket User',
        role: 'Student'
      });

    userId = registerResponse.body.user._id;

    const loginResponse = await request(app)
      .post('/api/users/login')
      .send({
        email: 'ticketuser@example.com',
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

    // Create a registration
    const registration = await Registration.create({
      user: userId,
      event: eventId,
      status: 'confirmed'
    });
    registrationId = registration._id.toString();
  });

  describe('POST /api/tickets/ticket/create', () => {
    it('should create ticket with valid registration', async () => {
      const ticketData = {
        registration_id: registrationId
      };

      const response = await request(app)
        .post('/api/tickets/ticket/create')
        .set('Authorization', `Bearer ${authToken}`)
        .send(ticketData)
        .expect(201);

      expect(response.body).toHaveProperty('ticket');
      expect(response.body.ticket.registration).toBe(registrationId);
      expect(response.body.ticket).toHaveProperty('qrCode');
    });

    it('should reject ticket creation without authentication', async () => {
      const ticketData = {
        registration_id: registrationId
      };

      await request(app)
        .post('/api/tickets/ticket/create')
        .send(ticketData)
        .expect(401);
    });

    it('should reject ticket creation with invalid registration', async () => {
      const ticketData = {
        registration_id: '507f1f77bcf86cd799439011'
      };

      const response = await request(app)
        .post('/api/tickets/ticket/create')
        .set('Authorization', `Bearer ${authToken}`)
        .send(ticketData)
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/tickets/ticket/by-id/:ticket_id', () => {
    beforeEach(async () => {
      const ticket = await Ticket.create({
        registration: registrationId,
        status: 'active',
        qrCode: 'test-qr-code'
      });
      ticketId = ticket._id.toString();
    });

    it('should get ticket by id', async () => {
      const response = await request(app)
        .get(`/api/tickets/ticket/by-id/${ticketId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('ticket');
      expect(response.body.ticket._id).toBe(ticketId);
    });

    it('should reject request without authentication', async () => {
      await request(app)
        .get(`/api/tickets/ticket/by-id/${ticketId}`)
        .expect(401);
    });
  });

  describe('GET /api/tickets/user/:user_id', () => {
    beforeEach(async () => {
      await Ticket.create({
        registration: registrationId,
        status: 'active',
        qrCode: 'test-qr-code'
      });
    });

    it('should get tickets by user', async () => {
      const response = await request(app)
        .get(`/api/tickets/user/${userId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('tickets');
      expect(Array.isArray(response.body.tickets)).toBe(true);
    });
  });

  describe('GET /api/tickets/event/:event_id', () => {
    beforeEach(async () => {
      await Ticket.create({
        registration: registrationId,
        status: 'active',
        qrCode: 'test-qr-code'
      });
    });

    it('should get tickets by event', async () => {
      const response = await request(app)
        .get(`/api/tickets/event/${eventId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('tickets');
      expect(Array.isArray(response.body.tickets)).toBe(true);
    });
  });

  describe('POST /api/tickets/ticket/scan', () => {
    beforeEach(async () => {
      const ticket = await Ticket.create({
        registration: registrationId,
        status: 'active',
        qrCode: 'test-qr-code-123'
      });
      ticketId = ticket._id.toString();
    });

    it('should scan ticket successfully', async () => {
      const scanData = {
        ticket_id: ticketId
      };

      const response = await request(app)
        .post('/api/tickets/ticket/scan')
        .set('Authorization', `Bearer ${authToken}`)
        .send(scanData)
        .expect(200);

      expect(response.body).toHaveProperty('ticket');
      expect(response.body.ticket.status).toBe('used');
    });

    it('should reject scan without authentication', async () => {
      await request(app)
        .post('/api/tickets/ticket/scan')
        .send({ ticket_id: ticketId })
        .expect(401);
    });

    it('should reject scan of already used ticket', async () => {
      // Mark ticket as used first
      await Ticket.findByIdAndUpdate(ticketId, { status: 'used' });

      const response = await request(app)
        .post('/api/tickets/ticket/scan')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ ticket_id: ticketId })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('PUT /api/tickets/ticket/used/:ticket_id', () => {
    beforeEach(async () => {
      const ticket = await Ticket.create({
        registration: registrationId,
        status: 'active',
        qrCode: 'test-qr-code'
      });
      ticketId = ticket._id.toString();
    });

    it('should mark ticket as used', async () => {
      const response = await request(app)
        .put(`/api/tickets/ticket/used/${ticketId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.ticket.status).toBe('used');
    });
  });

  describe('PUT /api/tickets/ticket/cancel/:ticket_id', () => {
    beforeEach(async () => {
      const ticket = await Ticket.create({
        registration: registrationId,
        status: 'active',
        qrCode: 'test-qr-code'
      });
      ticketId = ticket._id.toString();
    });

    it('should cancel ticket', async () => {
      const response = await request(app)
        .put(`/api/tickets/ticket/cancel/${ticketId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.ticket.status).toBe('cancelled');
    });
  });
});

