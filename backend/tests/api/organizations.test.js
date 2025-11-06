const request = require('supertest');
const app = require('../../app');
const User = require('../../models/User');
const Organization = require('../../models/Organization');

describe('Organizations API Endpoints', () => {
  let authToken;
  let adminToken;
  let userId;
  let orgId;

  beforeEach(async () => {
    // Create a test user (organizer)
    const registerResponse = await request(app)
      .post('/api/users/register')
      .send({
        email: 'orguser@example.com',
        password: 'Test1234!',
        name: 'Org User',
        role: 'Organizer'
      });

    userId = registerResponse.body.user._id;

    const loginResponse = await request(app)
      .post('/api/users/login')
      .send({
        email: 'orguser@example.com',
        password: 'Test1234!'
      });

    authToken = loginResponse.body.token;

    // Create admin user
    const adminRegister = await request(app)
      .post('/api/users/register')
      .send({
        email: 'admin@example.com',
        password: 'Test1234!',
        name: 'Admin User',
        role: 'Admin'
      });

    const adminLogin = await request(app)
      .post('/api/users/login')
      .send({
        email: 'admin@example.com',
        password: 'Test1234!'
      });

    adminToken = adminLogin.body.token;
  });

  describe('POST /api/org/create', () => {
    it('should create organization with valid data', async () => {
      const orgData = {
        name: 'New Test Organization',
        description: 'Test organization description',
        contact: {
          email: 'contact@testorg.com',
          phone: '123-456-7890'
        }
      };

      const response = await request(app)
        .post('/api/org/create')
        .set('Authorization', `Bearer ${authToken}`)
        .send(orgData)
        .expect(201);

      expect(response.body).toHaveProperty('organization');
      expect(response.body.organization.name).toBe(orgData.name);
      expect(response.body.organization.status).toBe('pending');
    });

    it('should reject organization creation without authentication', async () => {
      const orgData = {
        name: 'Test Organization',
        description: 'Test description'
      };

      await request(app)
        .post('/api/org/create')
        .send(orgData)
        .expect(401);
    });

    it('should reject organization creation with missing required fields', async () => {
      const orgData = {
        name: 'Test Organization'
        // Missing description
      };

      const response = await request(app)
        .post('/api/org/create')
        .set('Authorization', `Bearer ${authToken}`)
        .send(orgData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/org/:org_id', () => {
    beforeEach(async () => {
      const org = await Organization.create({
        name: 'Test Org',
        description: 'Test Description',
        status: 'approved',
        contact: { email: 'test@org.com' }
      });
      orgId = org._id.toString();
    });

    it('should get organization by id', async () => {
      const response = await request(app)
        .get(`/api/org/${orgId}`)
        .expect(200);

      expect(response.body).toHaveProperty('organization');
      expect(response.body.organization._id).toBe(orgId);
    });

    it('should return 404 for non-existent organization', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      await request(app)
        .get(`/api/org/${fakeId}`)
        .expect(404);
    });
  });

  describe('GET /api/org/all', () => {
    beforeEach(async () => {
      await Organization.create({
        name: 'Org 1',
        description: 'Description 1',
        status: 'approved',
        contact: { email: 'org1@test.com' }
      });
      await Organization.create({
        name: 'Org 2',
        description: 'Description 2',
        status: 'pending',
        contact: { email: 'org2@test.com' }
      });
    });

    it('should get all organizations (admin only)', async () => {
      const response = await request(app)
        .get('/api/org/all')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('organizations');
      expect(Array.isArray(response.body.organizations)).toBe(true);
    });

    it('should reject request without admin token', async () => {
      await request(app)
        .get('/api/org/all')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);
    });
  });

  describe('GET /api/org/pending/list', () => {
    beforeEach(async () => {
      await Organization.create({
        name: 'Pending Org',
        description: 'Pending Description',
        status: 'pending',
        contact: { email: 'pending@test.com' }
      });
    });

    it('should get pending organizations (admin only)', async () => {
      const response = await request(app)
        .get('/api/org/pending/list')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('organizations');
      expect(Array.isArray(response.body.organizations)).toBe(true);
    });
  });

  describe('PUT /api/org/update/:org_id', () => {
    beforeEach(async () => {
      const org = await Organization.create({
        name: 'Original Org',
        description: 'Original Description',
        status: 'approved',
        contact: { email: 'original@test.com' }
      });
      orgId = org._id.toString();
    });

    it('should update organization (admin only)', async () => {
      const updateData = {
        name: 'Updated Org Name',
        description: 'Updated Description'
      };

      const response = await request(app)
        .put(`/api/org/update/${orgId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.organization.name).toBe(updateData.name);
    });

    it('should reject update without admin token', async () => {
      await request(app)
        .put(`/api/org/update/${orgId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Updated Name' })
        .expect(403);
    });
  });

  describe('DELETE /api/org/delete/:org_id', () => {
    beforeEach(async () => {
      const org = await Organization.create({
        name: 'To Delete Org',
        description: 'To Delete',
        status: 'approved',
        contact: { email: 'delete@test.com' }
      });
      orgId = org._id.toString();
    });

    it('should delete organization (admin only)', async () => {
      await request(app)
        .delete(`/api/org/delete/${orgId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Verify deletion
      await request(app)
        .get(`/api/org/${orgId}`)
        .expect(404);
    });

    it('should reject deletion without admin token', async () => {
      await request(app)
        .delete(`/api/org/delete/${orgId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);
    });
  });
});

