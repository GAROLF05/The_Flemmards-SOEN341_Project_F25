const request = require('supertest');
const app = require('../../app');
const { User, USER_ROLE } = require('../../models/User');
const { Organization, ORGANIZATION_STATUS } = require('../../models/Organization');
const { Event } = require('../../models/Event');
const Administrator = require('../../models/Administrators');
const bcrypt = require('bcrypt');

/**
 * System Test: US.12 - Management (Administrators) - Organization Management
 * 
 * Acceptance Tests:
 * 1. Admins can see the organization management panel with action buttons.
 * 2. Admin can create, edit, delete organizations.
 */

describe('US.12 - Management (Administrators) - Organization Management - System Test', () => {
  let adminToken;
  let adminUserId;
  let organizerToken;
  let organizerUserId;
  let organizationId;

  beforeEach(async () => {
    // Setup: Create admin user
    const hashedPassword = await bcrypt.hash('Admin1234!', 10);
    const adminUser = await Administrator.create({
      email: 'managementadmin@example.com',
      password: hashedPassword,
      name: 'Management Admin'
    });

    adminUserId = adminUser._id;

    // Admin login
    const adminLogin = await request(app)
      .post('/api/users/login')
      .send({
        usernameEmail: 'managementadmin@example.com',
        password: 'Admin1234!',
        role: 'admin'
      });
    adminToken = adminLogin.body.token;

    // Create approved organizer for testing
    const organizerRegister = await request(app)
      .post('/api/users/register')
      .send({
        email: 'testorganizer@management.test',
        password: 'Organizer1234!',
        name: 'Test Organizer',
        role: 'Organizer',
        username: `test_org_${Date.now()}_${Math.random().toString(36).substring(7)}`
      })
      .expect(201);

    organizerUserId = organizerRegister.body.user._id;
    await User.findByIdAndUpdate(organizerUserId, { verified: true, approved: true });

    // Organizer login
    const organizerLogin = await request(app)
      .post('/api/users/login')
      .send({
        usernameEmail: 'testorganizer@management.test',
        password: 'Organizer1234!'
      })
      .expect(200);

    organizerToken = organizerLogin.body.token;

    // Create organization for testing
    const orgResponse = await request(app)
      .post('/api/org/create')
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({
        name: 'Test Organization',
        description: 'Organization for management tests',
        website: 'https://testorg.org',
        contact: {
          email: 'contact@testorg.org',
          phone: '+1234567890'
        }
      })
      .expect(201);

    organizationId = orgResponse.body.organization._id;
  });

  afterEach(async () => {
    // Cleanup
    await Event.deleteMany({});
    await Organization.deleteMany({});
    await User.deleteMany({});
    await Administrator.deleteMany({});
  });

  describe('AT1: Admins can see the organization management panel with action buttons', () => {
    it('should return all organizations for admin management panel', async () => {
      const response = await request(app)
        .get('/api/org/all')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('organizations');
      expect(response.body).toHaveProperty('total');
      expect(Array.isArray(response.body.organizations)).toBe(true);
      expect(typeof response.body.total).toBe('number');
    });

    it('should return organizations with organizer information', async () => {
      const response = await request(app)
        .get('/api/org/all')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      if (response.body.organizations.length > 0) {
        const org = response.body.organizations[0];
        expect(org).toHaveProperty('_id');
        expect(org).toHaveProperty('name');
        expect(org).toHaveProperty('description');
        expect(org).toHaveProperty('status');
        expect(org).toHaveProperty('organizer');
      }
    });

    it('should return organizations sorted by creation date (newest first)', async () => {
      // Create another organization
      const newOrgResponse = await request(app)
        .post('/api/org/admin/create')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'New Organization',
          description: 'Newly created organization',
          website: 'https://neworg.org',
          contact: {
            email: 'contact@neworg.org',
            phone: '+1234567891'
          }
        })
        .expect(201);

      const response = await request(app)
        .get('/api/org/all')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      if (response.body.organizations.length > 1) {
        const firstOrg = response.body.organizations[0];
        const secondOrg = response.body.organizations[1];
        
        // Newest should be first (sorted by createdAt: -1)
        const firstDate = new Date(firstOrg.createdAt || firstOrg._id.getTimestamp());
        const secondDate = new Date(secondOrg.createdAt || secondOrg._id.getTimestamp());
        expect(firstDate.getTime()).toBeGreaterThanOrEqual(secondDate.getTime());
      }
    });

    it('should require admin authentication to view organizations', async () => {
      await request(app)
        .get('/api/org/all')
        .expect(401);
    });

    it('should prevent non-admin users from viewing organizations', async () => {
      await request(app)
        .get('/api/org/all')
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(403);
    });

    it('should return pending organizations list', async () => {
      // Create a new organizer for pending organization (organizer from beforeEach already has an org)
      const pendingOrganizerRegister = await request(app)
        .post('/api/users/register')
        .send({
          email: 'pendingorganizer@management.test',
          password: 'Organizer1234!',
          name: 'Pending Organizer',
          role: 'Organizer',
          username: `pending_org_${Date.now()}_${Math.random().toString(36).substring(7)}`
        })
        .expect(201);

      const pendingOrganizerId = pendingOrganizerRegister.body.user._id;
      await User.findByIdAndUpdate(pendingOrganizerId, { verified: true, approved: false });

      const pendingOrganizerLogin = await request(app)
        .post('/api/users/login')
        .send({
          usernameEmail: 'pendingorganizer@management.test',
          password: 'Organizer1234!'
        })
        .expect(200);

      const pendingOrganizerToken = pendingOrganizerLogin.body.token;

      // Create a pending organization
      const pendingOrgResponse = await request(app)
        .post('/api/org/create')
        .set('Authorization', `Bearer ${pendingOrganizerToken}`)
        .send({
          name: 'Pending Organization',
          description: 'Pending organization',
          website: 'https://pendingorg.org',
          contact: {
            email: 'contact@pendingorg.org',
            phone: '+1234567892'
          }
        })
        .expect(201);

      const response = await request(app)
        .get('/api/org/pending/list')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('organizations');
      expect(Array.isArray(response.body.organizations)).toBe(true);
    });
  });

  describe('AT2: Admin can create, edit, delete organizations', () => {
    it('should allow admin to create a new organization', async () => {
      const newOrgData = {
        name: 'Admin Created Organization',
        description: 'This organization was created by an admin',
        website: 'https://admincreated.org',
        contact: {
          email: 'contact@admincreated.org',
          phone: '+1234567893'
        }
      };

      const response = await request(app)
        .post('/api/org/admin/create')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newOrgData)
        .expect(201);

      expect(response.body).toHaveProperty('organization');
      expect(response.body.organization.name).toBe(newOrgData.name);
      expect(response.body.organization.description).toBe(newOrgData.description);
      expect(response.body.organization.website).toBe(newOrgData.website);
      expect(response.body.organization.contact.email).toBe(newOrgData.contact.email);
      expect(response.body.organization.status).toBe(ORGANIZATION_STATUS.APPROVED); // Admins can approve immediately

      // Verify in database
      const createdOrg = await Organization.findById(response.body.organization._id);
      expect(createdOrg).toBeTruthy();
      expect(createdOrg.name).toBe(newOrgData.name);
      expect(createdOrg.status).toBe(ORGANIZATION_STATUS.APPROVED);
    });

    it('should allow admin to create organization with organizer assignment', async () => {
      // Create a new organizer without an organization for assignment
      const newOrganizerRegister = await request(app)
        .post('/api/users/register')
        .send({
          email: 'neworganizer@management.test',
          password: 'Organizer1234!',
          name: 'New Organizer',
          role: 'Organizer',
          username: `new_org_${Date.now()}_${Math.random().toString(36).substring(7)}`
        })
        .expect(201);

      const newOrganizerId = newOrganizerRegister.body.user._id;
      await User.findByIdAndUpdate(newOrganizerId, { verified: true, approved: true });

      const newOrgData = {
        name: 'Organization With Organizer',
        description: 'Organization with assigned organizer',
        website: 'https://withorganizer.org',
        contact: {
          email: 'contact@withorganizer.org',
          phone: '+1234567894'
        },
        organizerEmail: 'neworganizer@management.test'
      };

      const response = await request(app)
        .post('/api/org/admin/create')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newOrgData)
        .expect(201);

      expect(response.body).toHaveProperty('organization');
      expect(response.body.organization.name).toBe(newOrgData.name);
      expect(response.body.organization.organizer).toBeTruthy();
      expect(response.body.organization.organizer.email).toBe('neworganizer@management.test');

      // Verify organizer is linked
      const organizer = await User.findById(newOrganizerId);
      expect(organizer.organization.toString()).toBe(response.body.organization._id.toString());
    });

    it('should validate required fields when creating organization', async () => {
      const incompleteData = {
        name: 'Incomplete Organization'
        // Missing description, website, contact
      };

      await request(app)
        .post('/api/org/admin/create')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(incompleteData)
        .expect(400);
    });

    it('should allow admin to update organization information', async () => {
      const updates = {
        name: 'Updated Organization Name',
        description: 'Updated description',
        website: 'https://updatedorg.org',
        contact: {
          email: 'updated@org.org',
          phone: '+9876543210'
        }
      };

      const response = await request(app)
        .put(`/api/org/update/${organizationId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updates)
        .expect(200);

      expect(response.body).toHaveProperty('organization');
      expect(response.body.organization.name).toBe(updates.name);
      expect(response.body.organization.description).toBe(updates.description);
      expect(response.body.organization.website).toBe(updates.website);
      expect(response.body.organization.contact.email).toBe(updates.contact.email);
      expect(response.body.organization.contact.phone).toBe(updates.contact.phone);

      // Verify in database
      const updatedOrg = await Organization.findById(organizationId);
      expect(updatedOrg.name).toBe(updates.name);
      expect(updatedOrg.description).toBe(updates.description);
    });

    it('should allow admin to update organization status', async () => {
      const updates = {
        status: ORGANIZATION_STATUS.SUSPENDED
      };

      const response = await request(app)
        .put(`/api/org/update/${organizationId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updates)
        .expect(200);

      expect(response.body.organization.status).toBe(ORGANIZATION_STATUS.SUSPENDED);

      // Verify in database
      const updatedOrg = await Organization.findById(organizationId);
      expect(updatedOrg.status).toBe(ORGANIZATION_STATUS.SUSPENDED);
    });

    it('should prevent updating organization organizer field', async () => {
      // Create a new organizer
      const newOrganizerRegister = await request(app)
        .post('/api/users/register')
        .send({
          email: 'neworganizer@management.test',
          password: 'Organizer1234!',
          name: 'New Organizer',
          role: 'Organizer',
          username: `new_org_${Date.now()}_${Math.random().toString(36).substring(7)}`
        })
        .expect(201);

      const newOrganizerId = newOrganizerRegister.body.user._id;
      await User.findByIdAndUpdate(newOrganizerId, { verified: true, approved: true });

      const updates = {
        organizer: newOrganizerId
      };

      const response = await request(app)
        .put(`/api/org/update/${organizationId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updates)
        .expect(200);

      // Organizer field should not be updated (one-to-one relationship must be maintained)
      const updatedOrg = await Organization.findById(organizationId);
      expect(updatedOrg.organizer.toString()).not.toBe(newOrganizerId.toString());
    });

    it('should return 404 when updating non-existent organization', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      await request(app)
        .put(`/api/org/update/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Updated Name' })
        .expect(404);
    });

    it('should allow admin to delete organization without events', async () => {
      const response = await request(app)
        .delete(`/api/org/delete/${organizationId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('deleted successfully');

      // Verify organization is deleted
      const deletedOrg = await Organization.findById(organizationId);
      expect(deletedOrg).toBeNull();

      // Verify organizer's organization reference is removed
      const organizer = await User.findById(organizerUserId);
      expect(organizer.organization).toBeNull();
    });

    it('should prevent deleting organization with existing events', async () => {
      // Create an event for the organization
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const endDate = new Date(futureDate.getTime() + 2 * 60 * 60 * 1000);

      await Event.create({
        organization: organizationId,
        title: 'Test Event',
        description: 'Test event',
        category: 'technology',
        start_at: futureDate,
        end_at: endDate,
        capacity: 100,
        location: {
          name: 'Test Venue',
          address: '123 Test Street'
        },
        moderationStatus: 'approved'
      });

      const response = await request(app)
        .delete(`/api/org/delete/${organizationId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(409); // Conflict - cannot delete organization with events

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Cannot delete organization with existing events');
      expect(response.body).toHaveProperty('eventsCount');

      // Verify organization still exists
      const org = await Organization.findById(organizationId);
      expect(org).toBeTruthy();
    });

    it('should require admin authentication to create organizations', async () => {
      await request(app)
        .post('/api/org/admin/create')
        .send({
          name: 'Unauthorized Org',
          description: 'Test',
          website: 'https://test.org',
          contact: { email: 'test@test.org', phone: '+1234567890' }
        })
        .expect(401);
    });

    it('should require admin authentication to update organizations', async () => {
      await request(app)
        .put(`/api/org/update/${organizationId}`)
        .send({ name: 'Unauthorized Update' })
        .expect(401);
    });

    it('should require admin authentication to delete organizations', async () => {
      await request(app)
        .delete(`/api/org/delete/${organizationId}`)
        .expect(401);
    });

    it('should prevent non-admin users from creating organizations via admin endpoint', async () => {
      await request(app)
        .post('/api/org/admin/create')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          name: 'Organizer Created Org',
          description: 'Test',
          website: 'https://test.org',
          contact: { email: 'test@test.org', phone: '+1234567890' }
        })
        .expect(403);
    });

    it('should prevent non-admin users from updating organizations', async () => {
      await request(app)
        .put(`/api/org/update/${organizationId}`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({ name: 'Organizer Update' })
        .expect(403);
    });

    it('should prevent non-admin users from deleting organizations', async () => {
      await request(app)
        .delete(`/api/org/delete/${organizationId}`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(403);
    });

    it('should handle duplicate organization name when creating', async () => {
      const orgData = {
        name: 'Duplicate Name Organization',
        description: 'First organization',
        website: 'https://duplicate1.org',
        contact: {
          email: 'contact1@duplicate.org',
          phone: '+1234567895'
        }
      };

      // Create first organization
      await request(app)
        .post('/api/org/admin/create')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(orgData)
        .expect(201);

      // Try to create second organization with same name
      const duplicateData = {
        ...orgData,
        website: 'https://duplicate2.org',
        contact: {
          email: 'contact2@duplicate.org',
          phone: '+1234567896'
        }
      };

      await request(app)
        .post('/api/org/admin/create')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(duplicateData)
        .expect(409); // Conflict - duplicate name
    });
  });
});

