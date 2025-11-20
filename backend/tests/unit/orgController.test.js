/**
 * Unit Tests for Organization Controller
 * Tests individual controller functions in isolation
 */

const orgController = require('../../controllers/orgController');
const { Organization, ORGANIZATION_STATUS } = require('../../models/Organization');
const { User } = require('../../models/User');
const { Event, EVENT_STATUS } = require('../../models/Event');
const { Registration } = require('../../models/Registrations');
const Administrator = require('../../models/Administrators');
const mongoose = require('mongoose');

describe('Organization Controller Unit Tests', () => {
  let mockReq;
  let mockRes;
  let adminUser;
  let organizerUser;
  let regularUser;
  let testOrgId;
  let testUserId;

  beforeEach(async () => {
    // Create admin user
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash('Test1234!', 10);
    adminUser = await Administrator.create({
      email: 'unitorgadmin@example.com',
      password: hashedPassword,
      name: 'Unit Test Admin'
    });

    // Create organizer user
    organizerUser = await User.create({
      email: 'unitorgorganizer@example.com',
      password: 'Test1234!',
      name: 'Unit Test Organizer',
      role: 'Organizer',
      approved: true
    });
    testUserId = organizerUser._id;

    // Create regular user
    regularUser = await User.create({
      email: 'unitorguser@example.com',
      password: 'Test1234!',
      name: 'Unit Test User',
      role: 'Student'
    });

    // Create test organization
    const org = await Organization.create({
      name: 'Unit Test Organization',
      description: 'Test Organization Description',
      website: 'https://example.com',
      contact: {
        email: 'unittestorg@example.com',
        phone: '+1234567890'
      },
      status: 'approved',
      organizer: organizerUser._id
    });
    testOrgId = org._id;

    // Link organization to organizer
    organizerUser.organization = testOrgId;
    await organizerUser.save();

    // Setup mock request and response
    mockReq = {
      user: {
        _id: organizerUser._id,
        email: organizerUser.email,
        role: 'Organizer'
      },
      params: {},
      body: {},
      query: {}
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis()
    };
  });

  describe('createOrganization', () => {
    it('should create organization for organizer', async () => {
      // Create a new organizer without an organization
      const newOrganizer = await User.create({
        email: 'neworganizer@example.com',
        password: 'Test1234!',
        name: 'New Organizer',
        role: 'Organizer',
        approved: false
      });

      mockReq.user = {
        _id: newOrganizer._id,
        email: newOrganizer.email,
        role: 'Organizer'
      };

      mockReq.body = {
        name: 'New Test Organization',
        description: 'New Organization Description',
        website: 'https://neworg.com',
        contact: {
          email: 'neworg@example.com',
          phone: '+1234567890'
        }
      };

      await orgController.createOrganization(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      const responseData = mockRes.json.mock.calls[0][0];
      expect(responseData).toHaveProperty('organization');
      expect(responseData.organization.name).toBe('New Test Organization');
      expect(responseData.organization.status).toBe('pending');
    });

    it('should return 401 if user is not authenticated', async () => {
      mockReq.user = null;
      mockReq.body = {
        name: 'Test Org',
        description: 'Test',
        website: 'https://test.com',
        contact: {
          email: 'test@example.com',
          phone: '+1234567890'
        }
      };

      await orgController.createOrganization(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it('should return 400 if required fields are missing', async () => {
      mockReq.body = {
        name: 'Incomplete Org'
        // Missing required fields
      };

      await orgController.createOrganization(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 if contact object is incomplete', async () => {
      mockReq.body = {
        name: 'Test Org',
        description: 'Test',
        website: 'https://test.com',
        contact: {
          email: 'test@example.com'
          // Missing phone
        }
      };

      await orgController.createOrganization(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should return 409 if organizer already has an organization', async () => {
      mockReq.user = {
        _id: organizerUser._id,
        email: organizerUser.email,
        role: 'Organizer'
      };
      mockReq.body = {
        name: 'Another Org',
        description: 'Test',
        website: 'https://another.com',
        contact: {
          email: 'another@example.com',
          phone: '+1234567890'
        }
      };

      await orgController.createOrganization(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(409);
    });

    it('should return 403 if user is not an organizer', async () => {
      mockReq.user = {
        _id: regularUser._id,
        email: regularUser.email,
        role: 'Student'
      };
      mockReq.body = {
        name: 'Test Org',
        description: 'Test',
        website: 'https://test.com',
        contact: {
          email: 'test@example.com',
          phone: '+1234567890'
        }
      };

      await orgController.createOrganization(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(403);
    });

    it('should return 404 if user not found', async () => {
      mockReq.user = {
        _id: new mongoose.Types.ObjectId(),
        email: 'nonexistent@example.com',
        role: 'Organizer'
      };
      mockReq.body = {
        name: 'Test Org',
        description: 'Test',
        website: 'https://test.com',
        contact: {
          email: 'test@example.com',
          phone: '+1234567890'
        }
      };

      await orgController.createOrganization(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });

  describe('adminCreateOrganization', () => {
    it('should create organization for admin', async () => {
      mockReq.user = {
        _id: adminUser._id,
        email: adminUser.email,
        role: 'Admin'
      };

      mockReq.body = {
        name: 'Admin Created Org',
        description: 'Admin Created Description',
        website: 'https://adminorg.com',
        contact: {
          email: 'adminorg@example.com',
          phone: '+1234567890'
        }
      };

      await orgController.adminCreateOrganization(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      const responseData = mockRes.json.mock.calls[0][0];
      expect(responseData).toHaveProperty('organization');
      expect(responseData.organization.name).toBe('Admin Created Org');
      expect(responseData.organization.status).toBe('approved');
    });

    it('should create organization with organizer link', async () => {
      // Create organizer without organization
      const newOrganizer = await User.create({
        email: 'linkedorganizer@example.com',
        password: 'Test1234!',
        name: 'Linked Organizer',
        role: 'Organizer',
        approved: true
      });

      mockReq.user = {
        _id: adminUser._id,
        email: adminUser.email,
        role: 'Admin'
      };

      mockReq.body = {
        name: 'Linked Org',
        description: 'Linked Description',
        website: 'https://linked.com',
        contact: {
          email: 'linked@example.com',
          phone: '+1234567890'
        },
        organizerEmail: 'linkedorganizer@example.com'
      };

      await orgController.adminCreateOrganization(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      const responseData = mockRes.json.mock.calls[0][0];
      expect(responseData.organization.organizer).toBeDefined();
    });

    it('should return 400 if required fields are missing', async () => {
      mockReq.user = {
        _id: adminUser._id,
        email: adminUser.email,
        role: 'Admin'
      };
      mockReq.body = {
        name: 'Incomplete Org'
        // Missing required fields
      };

      await orgController.adminCreateOrganization(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should return 404 if organizer email not found', async () => {
      mockReq.user = {
        _id: adminUser._id,
        email: adminUser.email,
        role: 'Admin'
      };
      mockReq.body = {
        name: 'Test Org',
        description: 'Test',
        website: 'https://test.com',
        contact: {
          email: 'test@example.com',
          phone: '+1234567890'
        },
        organizerEmail: 'nonexistent@example.com'
      };

      await orgController.adminCreateOrganization(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it('should return 409 if organizer already has organization', async () => {
      mockReq.user = {
        _id: adminUser._id,
        email: adminUser.email,
        role: 'Admin'
      };
      mockReq.body = {
        name: 'Test Org',
        description: 'Test',
        website: 'https://test.com',
        contact: {
          email: 'test@example.com',
          phone: '+1234567890'
        },
        organizerEmail: organizerUser.email
      };

      await orgController.adminCreateOrganization(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(409);
    });
  });

  describe('getAllOrganizations', () => {
    it('should return all organizations for admin', async () => {
      mockReq.user = {
        _id: adminUser._id,
        email: adminUser.email,
        role: 'Admin'
      };

      await orgController.getAllOrganizations(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      const responseData = mockRes.json.mock.calls[0][0];
      expect(responseData).toHaveProperty('organizations');
      expect(responseData).toHaveProperty('total');
      expect(Array.isArray(responseData.organizations)).toBe(true);
    });

    it('should only return approved and suspended organizations', async () => {
      // Create organizations with different statuses
      const pendingOrg = await Organization.create({
        name: 'Pending Org',
        description: 'Test',
        website: 'https://pending.com',
        contact: {
          email: 'pending@example.com',
          phone: '+1234567890'
        },
        status: 'pending'
      });

      mockReq.user = {
        _id: adminUser._id,
        email: adminUser.email,
        role: 'Admin'
      };

      await orgController.getAllOrganizations(mockReq, mockRes);

      const responseData = mockRes.json.mock.calls[0][0];
      responseData.organizations.forEach(org => {
        expect(['approved', 'suspended']).toContain(org.status);
      });
    });

    it('should populate organizer information', async () => {
      mockReq.user = {
        _id: adminUser._id,
        email: adminUser.email,
        role: 'Admin'
      };

      await orgController.getAllOrganizations(mockReq, mockRes);

      const responseData = mockRes.json.mock.calls[0][0];
      if (responseData.organizations.length > 0) {
        const org = responseData.organizations[0];
        if (org.organizer && typeof org.organizer === 'object') {
          expect(org.organizer).toHaveProperty('name');
        }
      }
    });
  });

  describe('getOrganizationById', () => {
    it('should return organization by ID', async () => {
      mockReq.params.org_id = testOrgId.toString();

      await orgController.getOrganizationById(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      const responseData = mockRes.json.mock.calls[0][0];
      expect(responseData).toHaveProperty('organization');
      expect(responseData.organization._id.toString()).toBe(testOrgId.toString());
    });

    it('should return 400 if org_id is missing', async () => {
      // No org_id in params

      await orgController.getOrganizationById(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 for invalid org_id format', async () => {
      mockReq.params.org_id = 'invalid-id';

      await orgController.getOrganizationById(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should return 404 for non-existent organization', async () => {
      mockReq.params.org_id = new mongoose.Types.ObjectId().toString();

      await orgController.getOrganizationById(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it('should populate organizer information', async () => {
      mockReq.params.org_id = testOrgId.toString();

      await orgController.getOrganizationById(mockReq, mockRes);

      const responseData = mockRes.json.mock.calls[0][0];
      if (responseData.organization.organizer && typeof responseData.organization.organizer === 'object') {
        expect(responseData.organization.organizer).toHaveProperty('name');
      }
    });
  });

  describe('getOrganizationByStatus', () => {
    it('should return organizations by status', async () => {
      mockReq.user = {
        _id: adminUser._id,
        email: adminUser.email,
        role: 'Admin'
      };
      mockReq.params.status = 'pending';

      await orgController.getOrganizationByStatus(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      const responseData = mockRes.json.mock.calls[0][0];
      expect(responseData).toHaveProperty('organizations');
      expect(responseData).toHaveProperty('total');
      responseData.organizations.forEach(org => {
        expect(org.status).toBe('pending');
      });
    });

    it('should return 400 if status is missing', async () => {
      mockReq.user = {
        _id: adminUser._id,
        email: adminUser.email,
        role: 'Admin'
      };
      // No status in params

      await orgController.getOrganizationByStatus(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 for invalid status', async () => {
      mockReq.user = {
        _id: adminUser._id,
        email: adminUser.email,
        role: 'Admin'
      };
      mockReq.params.status = 'invalid-status';

      await orgController.getOrganizationByStatus(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('getPendingOrganizations', () => {
    it('should return pending organizations', async () => {
      mockReq.user = {
        _id: adminUser._id,
        email: adminUser.email,
        role: 'Admin'
      };

      await orgController.getPendingOrganizations(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      const responseData = mockRes.json.mock.calls[0][0];
      expect(responseData).toHaveProperty('organizations');
      expect(responseData).toHaveProperty('total');
      responseData.organizations.forEach(org => {
        expect(org.status).toBe('pending');
      });
    });
  });

  describe('updateOrganization', () => {
    it('should update organization successfully', async () => {
      mockReq.user = {
        _id: adminUser._id,
        email: adminUser.email,
        role: 'Admin'
      };
      mockReq.params.org_id = testOrgId.toString();
      mockReq.body = {
        name: 'Updated Organization Name',
        description: 'Updated Description'
      };

      await orgController.updateOrganization(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      const responseData = mockRes.json.mock.calls[0][0];
      expect(responseData.organization.name).toBe('Updated Organization Name');
      expect(responseData.organization.description).toBe('Updated Description');
    });

    it('should return 400 if org_id is missing', async () => {
      mockReq.user = {
        _id: adminUser._id,
        email: adminUser.email,
        role: 'Admin'
      };
      // No org_id in params

      await orgController.updateOrganization(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 for invalid org_id format', async () => {
      mockReq.user = {
        _id: adminUser._id,
        email: adminUser.email,
        role: 'Admin'
      };
      mockReq.params.org_id = 'invalid-id';
      mockReq.body = { name: 'Updated Name' };

      await orgController.updateOrganization(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should return 404 for non-existent organization', async () => {
      mockReq.user = {
        _id: adminUser._id,
        email: adminUser.email,
        role: 'Admin'
      };
      mockReq.params.org_id = new mongoose.Types.ObjectId().toString();
      mockReq.body = { name: 'Updated Name' };

      await orgController.updateOrganization(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it('should prevent updating _id and organizer', async () => {
      mockReq.user = {
        _id: adminUser._id,
        email: adminUser.email,
        role: 'Admin'
      };
      mockReq.params.org_id = testOrgId.toString();
      const originalOrganizer = (await Organization.findById(testOrgId)).organizer;
      mockReq.body = {
        _id: new mongoose.Types.ObjectId(),
        organizer: new mongoose.Types.ObjectId(),
        name: 'Updated Name'
      };

      await orgController.updateOrganization(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      const updatedOrg = await Organization.findById(testOrgId);
      expect(updatedOrg.organizer.toString()).toBe(originalOrganizer.toString());
    });
  });

  describe('deleteOrganization', () => {
    it('should delete organization successfully', async () => {
      // Create organization without events
      const orgToDelete = await Organization.create({
        name: 'Org To Delete',
        description: 'Test',
        website: 'https://delete.com',
        contact: {
          email: 'delete@example.com',
          phone: '+1234567890'
        },
        status: 'approved'
      });

      mockReq.user = {
        _id: adminUser._id,
        email: adminUser.email,
        role: 'Admin'
      };
      mockReq.params.org_id = orgToDelete._id.toString();

      await orgController.deleteOrganization(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      const deletedOrg = await Organization.findById(orgToDelete._id);
      expect(deletedOrg).toBeNull();
    });

    it('should return 400 if org_id is missing', async () => {
      mockReq.user = {
        _id: adminUser._id,
        email: adminUser.email,
        role: 'Admin'
      };

      await orgController.deleteOrganization(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 for invalid org_id format', async () => {
      mockReq.user = {
        _id: adminUser._id,
        email: adminUser.email,
        role: 'Admin'
      };
      mockReq.params.org_id = 'invalid-id';

      await orgController.deleteOrganization(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should return 404 for non-existent organization', async () => {
      mockReq.user = {
        _id: adminUser._id,
        email: adminUser.email,
        role: 'Admin'
      };
      mockReq.params.org_id = new mongoose.Types.ObjectId().toString();

      await orgController.deleteOrganization(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it('should return 409 if organization has events', async () => {
      // Create event for the organization
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      await Event.create({
        title: 'Test Event',
        description: 'Test',
        start_at: futureDate,
        end_at: new Date(futureDate.getTime() + 2 * 60 * 60 * 1000),
        capacity: 50,
        category: 'workshop',
        organization: testOrgId,
        status: 'upcoming',
        moderationStatus: 'approved',
        location: {
          name: 'Test Location',
          address: '123 Test St'
        }
      });

      mockReq.user = {
        _id: adminUser._id,
        email: adminUser.email,
        role: 'Admin'
      };
      mockReq.params.org_id = testOrgId.toString();

      await orgController.deleteOrganization(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(409);
    });

    it('should remove organization reference from user', async () => {
      // Create organizer with organization
      const orgUser = await User.create({
        email: 'orguser@example.com',
        password: 'Test1234!',
        name: 'Org User',
        role: 'Organizer',
        approved: true
      });

      const orgToDelete = await Organization.create({
        name: 'Org To Delete 2',
        description: 'Test',
        website: 'https://delete2.com',
        contact: {
          email: 'delete2@example.com',
          phone: '+1234567890'
        },
        status: 'approved',
        organizer: orgUser._id
      });

      orgUser.organization = orgToDelete._id;
      await orgUser.save();

      mockReq.user = {
        _id: adminUser._id,
        email: adminUser.email,
        role: 'Admin'
      };
      mockReq.params.org_id = orgToDelete._id.toString();

      await orgController.deleteOrganization(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      const updatedUser = await User.findById(orgUser._id);
      expect(updatedUser.organization).toBeNull();
    });
  });

  describe('getOrganizationStats', () => {
    it('should return organization stats', async () => {
      // Create events for the organization
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      const event1 = await Event.create({
        title: 'Upcoming Event',
        description: 'Test',
        start_at: futureDate,
        end_at: new Date(futureDate.getTime() + 2 * 60 * 60 * 1000),
        capacity: 50,
        category: 'workshop',
        organization: testOrgId,
        status: 'upcoming',
        moderationStatus: 'approved',
        location: {
          name: 'Test Location',
          address: '123 Test St'
        }
      });

      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 7);
      const event2 = await Event.create({
        title: 'Completed Event',
        description: 'Test',
        start_at: pastDate,
        end_at: new Date(pastDate.getTime() + 2 * 60 * 60 * 1000),
        capacity: 50,
        category: 'workshop',
        organization: testOrgId,
        status: 'completed',
        moderationStatus: 'approved',
        location: {
          name: 'Test Location',
          address: '123 Test St'
        }
      });

      // Create registrations
      await Registration.create({
        user: testUserId,
        event: event1._id,
        status: 'confirmed',
        quantity: 1
      });

      await Registration.create({
        user: testUserId,
        event: event2._id,
        status: 'confirmed',
        quantity: 1
      });

      mockReq.params.org_id = testOrgId.toString();

      await orgController.getOrganizationStats(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      const responseData = mockRes.json.mock.calls[0][0];
      expect(responseData).toHaveProperty('stats');
      expect(responseData.stats).toHaveProperty('totalEvents');
      expect(responseData.stats).toHaveProperty('upcomingEvents');
      expect(responseData.stats).toHaveProperty('completedEvents');
      expect(responseData.stats).toHaveProperty('totalRegistrations');
      expect(responseData.stats.totalEvents).toBeGreaterThanOrEqual(2);
    });

    it('should return 400 if org_id is missing', async () => {
      // No org_id in params

      await orgController.getOrganizationStats(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 for invalid org_id format', async () => {
      mockReq.params.org_id = 'invalid-id';

      await orgController.getOrganizationStats(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should return 404 for non-existent organization', async () => {
      mockReq.params.org_id = new mongoose.Types.ObjectId().toString();

      await orgController.getOrganizationStats(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });
});

