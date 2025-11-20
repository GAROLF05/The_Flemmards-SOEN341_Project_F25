const request = require('supertest');
const app = require('../../app');
const { User } = require('../../models/User');
const { Organization } = require('../../models/Organization');
const Administrator = require('../../models/Administrators');
const bcrypt = require('bcrypt');

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

    // Verify user email
    await User.findByIdAndUpdate(userId, {
      verified: true
    });

    const loginResponse = await request(app)
      .post('/api/users/login')
      .send({
        usernameEmail: 'orguser@example.com',
        password: 'Test1234!'
      });

    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body).toHaveProperty('token');
    authToken = loginResponse.body.token;

    // Create admin user directly in Administrator collection
    const hashedPassword = await bcrypt.hash('Test1234!', 10);
    await Administrator.create({
      email: 'admin@example.com',
      password: hashedPassword,
      name: 'Admin User'
    });

    const adminLogin = await request(app)
      .post('/api/users/login')
      .send({
        usernameEmail: 'admin@example.com',
        password: 'Test1234!',
        role: 'admin'
      });

    expect(adminLogin.status).toBe(200);
    expect(adminLogin.body).toHaveProperty('token');
    adminToken = adminLogin.body.token;
  });

  describe('POST /api/org/create', () => {
    it('should create organization with valid data', async () => {
      const orgData = {
        name: 'New Test Organization',
        description: 'Test organization description',
        website: 'https://testorg.com',
        contact: {
          email: 'contact@testorg.com',
          phone: '+1234567890'
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
        website: 'https://testorg.com',
        contact: { 
          email: 'test@org.com',
          phone: '+1234567890'
        }
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
        website: 'https://org1.com',
        contact: { 
          email: 'org1@test.com',
          phone: '+1234567890'
        }
      });
      await Organization.create({
        name: 'Org 2',
        description: 'Description 2',
        status: 'pending',
        website: 'https://org2.com',
        contact: { 
          email: 'org2@test.com',
          phone: '+1234567890'
        }
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
        website: 'https://pending.com',
        contact: { 
          email: 'pending@test.com',
          phone: '+1234567890'
        }
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
        website: 'https://original.com',
        contact: { 
          email: 'original@test.com',
          phone: '+1234567890'
        }
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
        website: 'https://delete.com',
        contact: { 
          email: 'delete@test.com',
          phone: '+1234567890'
        }
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

