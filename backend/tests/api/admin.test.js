const request = require('supertest');
const app = require('../../app');
const { User } = require('../../models/User');
const { Organization } = require('../../models/Organization');
const { Event } = require('../../models/Event');
const Ticket = require('../../models/Ticket');
const { Registration } = require('../../models/Registrations');
const Administrator = require('../../models/Administrators');
const bcrypt = require('bcrypt');

describe('Admin API Endpoints', () => {
  let adminToken;
  let adminUserId;
  let userToken;
  let userId;
  let orgId;
  let eventId;

  beforeEach(async () => {
    // Create admin user directly in Administrator collection
    const hashedPassword = await bcrypt.hash('Test1234!', 10);
    const adminUser = await Administrator.create({
      email: 'admin@example.com',
      password: hashedPassword,
      name: 'Admin User'
    });
    adminUserId = adminUser._id.toString();

    // Login as admin with role='admin'
    const adminLogin = await request(app)
      .post('/api/users/login')
      .send({
        usernameEmail: 'admin@example.com',
        password: 'Test1234!',
        role: 'admin'
      });

    adminToken = adminLogin.body.token;

    // Create regular user
    const userRegister = await request(app)
      .post('/api/users/register')
      .send({
        email: 'regular@example.com',
        password: 'Test1234!',
        name: 'Regular User',
        role: 'Student'
      });

    userId = userRegister.body.user._id;

    const userLogin = await request(app)
      .post('/api/users/login')
      .send({
        usernameEmail: 'regular@example.com',
        password: 'Test1234!'
      });

    userToken = userLogin.body.token;

    // Create organization
    const org = await Organization.create({
      name: 'Test Organization',
      description: 'Test Org Description',
      status: 'pending',
      contact: { 
        email: 'org@example.com',
        phone: '+1234567890'
      },
      website: 'https://example.com'
    });
    orgId = org._id.toString();

    // Create event
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
      status: 'upcoming',
      moderationStatus: 'pending_approval',
      location: {
        name: 'Test Location',
        address: '123 Test Street, Test City'
      }
    });
    eventId = event._id.toString();
  });

  describe('GET /api/admin/dashboard/stats', () => {
    it('should get dashboard stats (admin only)', async () => {
      const response = await request(app)
        .get('/api/admin/dashboard/stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('stats');
    });

    it('should reject request without admin token', async () => {
      await request(app)
        .get('/api/admin/dashboard/stats')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('should reject request without authentication', async () => {
      await request(app)
        .get('/api/admin/dashboard/stats')
        .expect(401);
    });
  });

  describe('GET /api/admin/users/all', () => {
    it('should get all users (admin only)', async () => {
      const response = await request(app)
        .get('/api/admin/users/all')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('users');
      expect(Array.isArray(response.body.users)).toBe(true);
    });

    it('should reject request without admin token', async () => {
      await request(app)
        .get('/api/admin/users/all')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });
  });

  describe('GET /api/admin/pending-events', () => {
    it('should get pending events (admin only)', async () => {
      const response = await request(app)
        .get('/api/admin/pending-events')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('events');
      expect(Array.isArray(response.body.events)).toBe(true);
    });
  });

  describe('PATCH /api/admin/events/approve/:event_id', () => {
    it('should approve event (admin only)', async () => {
      const response = await request(app)
        .patch(`/api/admin/events/approve/${eventId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('event');
      expect(response.body.event.moderationStatus).toBe('approved');
    });

    it('should reject approval without admin token', async () => {
      await request(app)
        .patch(`/api/admin/events/approve/${eventId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });
  });

  describe('PATCH /api/admin/events/reject/:event_id', () => {
    it('should reject event (admin only)', async () => {
      const response = await request(app)
        .patch(`/api/admin/events/reject/${eventId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('event');
      expect(response.body.event.moderationStatus).toBe('rejected');
    });
  });

  describe('PATCH /api/admin/approve-organizer/:user_id', () => {
    beforeEach(async () => {
      // Create organizer user
      const orgUser = await User.create({
        email: 'organizer@example.com',
        password: 'Test1234!',
        name: 'Organizer User',
        role: 'Organizer'
      });
      userId = orgUser._id.toString();
    });

    it('should approve organizer (admin only)', async () => {
      const response = await request(app)
        .patch(`/api/admin/approve-organizer/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ approved: true })
        .expect(200);

      expect(response.body).toHaveProperty('user');
    });
  });

  describe('GET /api/admin/pending-organizers', () => {
    it('should get pending organizers (admin only)', async () => {
      const response = await request(app)
        .get('/api/admin/pending-organizers')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('organizers');
      expect(Array.isArray(response.body.organizers)).toBe(true);
    });
  });

  describe('PATCH /api/admin/update-user-role/:user_id', () => {
    it('should update user role (admin only)', async () => {
      const updateData = {
        role: 'Organizer'
      };

      const response = await request(app)
        .patch(`/api/admin/update-user-role/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.user.role).toBe(updateData.role);
    });

    it('should reject update without admin token', async () => {
      await request(app)
        .patch(`/api/admin/update-user-role/${userId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ role: 'Organizer' })
        .expect(403);
    });
  });

  describe('DELETE /api/admin/users/:user_id', () => {
    it('should delete user (admin only)', async () => {
      await request(app)
        .delete(`/api/admin/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Verify deletion
      const user = await User.findById(userId);
      expect(user).toBeNull();
    });

    it('should reject deletion without admin token', async () => {
      await request(app)
        .delete(`/api/admin/users/${userId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });
  });

  describe('GET /api/admin/registrations/all', () => {
    beforeEach(async () => {
      await Registration.create({
        user: userId,
        event: eventId,
        status: 'confirmed'
      });
    });

    it('should get all registrations (admin only)', async () => {
      const response = await request(app)
        .get('/api/admin/registrations/all')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('registrations');
      expect(Array.isArray(response.body.registrations)).toBe(true);
    });
  });

  describe('GET /api/admin/tickets/all', () => {
    beforeEach(async () => {
      const registration = await Registration.create({
        user: userId,
        event: eventId,
        status: 'confirmed'
      });

      await Ticket.create({
        registration: registration._id,
        status: 'valid',
        qrCode: 'test-qr'
      });
    });

    it('should get all tickets (admin only)', async () => {
      const response = await request(app)
        .get('/api/admin/tickets/all')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('tickets');
      expect(Array.isArray(response.body.tickets)).toBe(true);
    });
  });
});

