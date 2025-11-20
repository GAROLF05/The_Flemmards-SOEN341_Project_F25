const request = require('supertest');
const app = require('../../app');
const { User } = require('../../models/User');
const { Organization, ORGANIZATION_STATUS } = require('../../models/Organization');
const { Event, EVENT_STATUS } = require('../../models/Event');
const { Registration } = require('../../models/Registrations');
const Administrator = require('../../models/Administrators');
const bcrypt = require('bcrypt');

/**
 * System Test: Complete Organization Management Workflow
 * 1. Organization creation by organizer
 * 2. Organization moderation and approval/rejection
 * 3. Organization update and management
 * 4. Organization suspension
 * 5. Organization stats and analytics
 * 6. Organization deletion
 * 7. Organization status transitions
 */
describe('Organizations System Test - Complete Organization Management Workflow', () => {
  let adminToken;
  let organizerToken;
  let organizerUserId;
  let organizationId;
  let organizationIds = [];

  beforeEach(async () => {
    // Setup: Create admin user
    const hashedPassword = await bcrypt.hash('Admin1234!', 10);
    const adminUser = await Administrator.create({
      email: 'orgadmin@example.com',
      password: hashedPassword,
      name: 'Org Admin'
    });

    // Admin login
    const adminLogin = await request(app)
      .post('/api/users/login')
      .send({
        usernameEmail: 'orgadmin@example.com',
        password: 'Admin1234!',
        role: 'admin'
      });
    adminToken = adminLogin.body.token;

    // Create organizer
    const organizerRegister = await request(app)
      .post('/api/users/register')
      .send({
        email: 'orgorganizer@systemtest.com',
        password: 'Organizer1234!',
        name: 'Org Test Organizer',
        role: 'Organizer',
        username: `org_organizer_${Date.now()}_${Math.random().toString(36).substring(7)}`
      })
      .expect(201);

    organizerUserId = organizerRegister.body.user._id;
    await User.findByIdAndUpdate(organizerUserId, { verified: true, approved: true });

    // Organizer login
    const organizerLogin = await request(app)
      .post('/api/users/login')
      .send({
        usernameEmail: 'orgorganizer@systemtest.com',
        password: 'Organizer1234!'
      })
      .expect(200);

    organizerToken = organizerLogin.body.token;
  });

  describe('Complete Organization Lifecycle Workflow', () => {
    it('should execute complete organization lifecycle from creation to deletion', async () => {
      // ============================================
      // PHASE 1: Organizer Creates Organization
      // ============================================
      console.log('Phase 1: Organizer Creates Organization');

      const orgResponse = await request(app)
        .post('/api/org/create')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          name: 'System Test Organization',
          description: 'Organization created for system testing',
          website: 'https://systemtest.org',
          contact: {
            email: 'contact@systemtest.org',
            phone: '+1234567890'
          }
        })
        .expect(201);

      organizationId = orgResponse.body.organization._id;
      organizationIds.push(organizationId);

      expect(orgResponse.body.organization.name).toBe('System Test Organization');
      expect(orgResponse.body.organization.status).toBe('pending');

      // ============================================
      // PHASE 2: Admin Views Pending Organizations
      // ============================================
      console.log('Phase 2: Admin Views Pending Organizations');

      const pendingOrgsResponse = await request(app)
        .get('/api/org/pending/list')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(pendingOrgsResponse.body).toHaveProperty('organizations');
      expect(Array.isArray(pendingOrgsResponse.body.organizations)).toBe(true);
      
      const foundOrg = pendingOrgsResponse.body.organizations.find(
        o => o._id.toString() === organizationId.toString()
      );
      expect(foundOrg).toBeDefined();

      // ============================================
      // PHASE 3: Admin Approves Organization
      // ============================================
      console.log('Phase 3: Admin Approves Organization');

      // Approve by updating status
      const approveResponse = await request(app)
        .put(`/api/org/update/${organizationId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'approved'
        })
        .expect(200);

      expect(approveResponse.body.organization.status).toBe('approved');

      // ============================================
      // PHASE 4: View Organization Details
      // ============================================
      console.log('Phase 4: View Organization Details');

      const orgDetailsResponse = await request(app)
        .get(`/api/org/${organizationId}`)
        .expect(200);

      expect(orgDetailsResponse.body.organization._id.toString()).toBe(organizationId);
      expect(orgDetailsResponse.body.organization.name).toBe('System Test Organization');
      expect(orgDetailsResponse.body.organization.status).toBe('approved');

      // ============================================
      // PHASE 5: Update Organization
      // ============================================
      console.log('Phase 5: Update Organization');

      const updateResponse = await request(app)
        .put(`/api/org/update/${organizationId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Updated Organization Name',
          description: 'Updated description',
          website: 'https://updated.org'
        })
        .expect(200);

      expect(updateResponse.body.organization.name).toBe('Updated Organization Name');
      expect(updateResponse.body.organization.description).toBe('Updated description');

      // ============================================
      // PHASE 6: View Organization Stats
      // ============================================
      console.log('Phase 6: View Organization Stats');

      const statsResponse = await request(app)
        .get(`/api/org/stats/${organizationId}`)
        .expect(200);

      expect(statsResponse.body).toHaveProperty('stats');
      expect(statsResponse.body.stats).toHaveProperty('totalEvents');
      expect(statsResponse.body.stats).toHaveProperty('upcomingEvents');
      expect(statsResponse.body.stats).toHaveProperty('completedEvents');
      expect(statsResponse.body.stats).toHaveProperty('totalRegistrations');

      // ============================================
      // PHASE 7: Suspend Organization
      // ============================================
      console.log('Phase 7: Suspend Organization');

      const suspendResponse = await request(app)
        .patch(`/api/admin/suspend-organization/${organizationId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(suspendResponse.body.organization.status).toBe('suspended');

      // ============================================
      // PHASE 8: Delete Organization
      // ============================================
      console.log('Phase 8: Delete Organization');

      // First, unsuspend and ensure no events exist
      await Organization.findByIdAndUpdate(organizationId, { status: 'approved' });

      const deleteResponse = await request(app)
        .delete(`/api/org/delete/${organizationId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(deleteResponse.body.message).toContain('deleted');

      // Verify organization is deleted
      const deletedOrg = await Organization.findById(organizationId);
      expect(deletedOrg).toBeNull();

      // Verify user's organization reference is removed
      const user = await User.findById(organizerUserId);
      expect(user.organization).toBeNull();

      console.log('✅ Complete Organization Lifecycle Test Passed!');
    });

    it('should handle organization status transitions', async () => {
      console.log('Organization Status Transitions Test');

      // Create organization
      const orgResponse = await request(app)
        .post('/api/org/create')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          name: 'Status Test Organization',
          description: 'Organization for status transition testing',
          website: 'https://statustest.org',
          contact: {
            email: 'status@test.org',
            phone: '+1234567890'
          }
        })
        .expect(201);

      const orgId = orgResponse.body.organization._id;
      organizationIds.push(orgId);

      // Verify initial status
      expect(orgResponse.body.organization.status).toBe('pending');

      // Transition 1: Pending -> Approved
      await request(app)
        .put(`/api/org/update/${orgId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'approved' })
        .expect(200);

      const approvedOrg = await Organization.findById(orgId);
      expect(approvedOrg.status).toBe('approved');

      // Transition 2: Approved -> Suspended
      await request(app)
        .patch(`/api/admin/suspend-organization/${orgId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const suspendedOrg = await Organization.findById(orgId);
      expect(suspendedOrg.status).toBe('suspended');

      // Transition 3: Suspended -> Approved
      await request(app)
        .put(`/api/org/update/${orgId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'approved' })
        .expect(200);

      const reapprovedOrg = await Organization.findById(orgId);
      expect(reapprovedOrg.status).toBe('approved');

      // Transition 4: Approved -> Rejected
      await request(app)
        .put(`/api/org/update/${orgId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'rejected' })
        .expect(200);

      const rejectedOrg = await Organization.findById(orgId);
      expect(rejectedOrg.status).toBe('rejected');

      console.log('✅ Organization Status Transitions Test Passed!');
    });

    it('should handle organization creation with duplicate prevention', async () => {
      console.log('Organization Duplicate Prevention Test');

      // Create first organization
      const org1Response = await request(app)
        .post('/api/org/create')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          name: 'Unique Organization',
          description: 'First organization',
          website: 'https://unique1.org',
          contact: {
            email: 'unique1@test.org',
            phone: '+1234567890'
          }
        })
        .expect(201);

      const org1Id = org1Response.body.organization._id;
      organizationIds.push(org1Id);

      // Try to create duplicate organization (same organizer)
      const duplicateResponse = await request(app)
        .post('/api/org/create')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          name: 'Another Organization',
          description: 'Trying to create second org',
          website: 'https://unique2.org',
          contact: {
            email: 'unique2@test.org',
            phone: '+1234567891'
          }
        })
        .expect(409);

      expect(duplicateResponse.body.error).toContain('already have an organization');

      console.log('✅ Organization Duplicate Prevention Test Passed!');
    });

    it('should handle organization stats with events', async () => {
      console.log('Organization Stats with Events Test');

      // Create and approve organization
      const orgResponse = await request(app)
        .post('/api/org/create')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          name: 'Stats Test Organization',
          description: 'Organization for stats testing',
          website: 'https://statstest.org',
          contact: {
            email: 'stats@test.org',
            phone: '+1234567890'
          }
        })
        .expect(201);

      const orgId = orgResponse.body.organization._id;
      organizationIds.push(orgId);

      // Approve organization
      await Organization.findByIdAndUpdate(orgId, { status: 'approved' });

      // Create events for the organization
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);
      const endDate = new Date(futureDate.getTime() + 2 * 60 * 60 * 1000);

      const event1 = await Event.create({
        organization: orgId,
        title: 'Stats Event 1',
        description: 'Event 1',
        start_at: futureDate,
        end_at: endDate,
        capacity: 50,
        category: 'workshop',
        location: { name: 'Venue 1', address: '123 Street' },
        status: EVENT_STATUS.UPCOMING,
        moderationStatus: 'approved'
      });

      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 5);
      const pastEndDate = new Date(pastDate.getTime() + 2 * 60 * 60 * 1000);

      const event2 = await Event.create({
        organization: orgId,
        title: 'Stats Event 2',
        description: 'Event 2',
        start_at: pastDate,
        end_at: pastEndDate,
        capacity: 30,
        category: 'workshop',
        location: { name: 'Venue 2', address: '456 Street' },
        status: EVENT_STATUS.COMPLETED,
        moderationStatus: 'approved'
      });

      // Get stats
      const statsResponse = await request(app)
        .get(`/api/org/stats/${orgId}`)
        .expect(200);

      expect(statsResponse.body.stats.totalEvents).toBe(2);
      expect(statsResponse.body.stats.upcomingEvents).toBe(1);
      expect(statsResponse.body.stats.completedEvents).toBe(1);

      console.log('✅ Organization Stats with Events Test Passed!');
    });

    it('should handle organization deletion with events prevention', async () => {
      console.log('Organization Deletion with Events Prevention Test');

      // Create and approve organization
      const orgResponse = await request(app)
        .post('/api/org/create')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          name: 'Delete Test Organization',
          description: 'Organization for deletion testing',
          website: 'https://deletetest.org',
          contact: {
            email: 'delete@test.org',
            phone: '+1234567890'
          }
        })
        .expect(201);

      const orgId = orgResponse.body.organization._id;
      organizationIds.push(orgId);

      // Approve organization
      await Organization.findByIdAndUpdate(orgId, { status: 'approved' });

      // Create an event for the organization
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);
      const endDate = new Date(futureDate.getTime() + 2 * 60 * 60 * 1000);

      await Event.create({
        organization: orgId,
        title: 'Delete Prevention Event',
        description: 'Event to prevent deletion',
        start_at: futureDate,
        end_at: endDate,
        capacity: 50,
        category: 'workshop',
        location: { name: 'Venue', address: '123 Street' },
        status: EVENT_STATUS.UPCOMING,
        moderationStatus: 'approved'
      });

      // Try to delete organization with events - should fail
      const deleteResponse = await request(app)
        .delete(`/api/org/delete/${orgId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(409);

      expect(deleteResponse.body.error).toContain('Cannot delete organization with existing events');

      // Verify organization still exists
      const org = await Organization.findById(orgId);
      expect(org).toBeDefined();

      console.log('✅ Organization Deletion with Events Prevention Test Passed!');
    });

    it('should handle admin creating organization', async () => {
      console.log('Admin Create Organization Test');

      // Create a new organizer user for this test
      const newOrganizerRegister = await request(app)
        .post('/api/users/register')
        .send({
          email: 'neworganizer@systemtest.com',
          password: 'Organizer1234!',
          name: 'New Organizer',
          role: 'Organizer',
          username: `new_org_${Date.now()}_${Math.random().toString(36).substring(7)}`
        })
        .expect(201);

      const newOrganizerId = newOrganizerRegister.body.user._id;
      await User.findByIdAndUpdate(newOrganizerId, { verified: true, approved: true });

      // Admin creates organization for the organizer
      const adminCreateResponse = await request(app)
        .post('/api/org/admin/create')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Admin Created Organization',
          description: 'Created by admin',
          website: 'https://admincreated.org',
          contact: {
            email: 'admincreated@test.org',
            phone: '+1234567890'
          },
          organizerEmail: 'neworganizer@systemtest.com'
        })
        .expect(201);

      const adminCreatedOrgId = adminCreateResponse.body.organization._id;
      organizationIds.push(adminCreatedOrgId);

      expect(adminCreateResponse.body.organization.name).toBe('Admin Created Organization');
      expect(adminCreateResponse.body.organization.status).toBe('approved'); // Admin-created orgs are auto-approved
      expect(adminCreateResponse.body.organization.organizer).toBeDefined();

      // Verify organizer is linked
      const organizer = await User.findById(newOrganizerId);
      expect(organizer.organization.toString()).toBe(adminCreatedOrgId.toString());

      console.log('✅ Admin Create Organization Test Passed!');
    });

    it('should handle getting all organizations', async () => {
      console.log('Get All Organizations Test');

      // Create multiple organizations
      const orgs = [];
      for (let i = 0; i < 3; i++) {
        // Create new organizer for each org
        const orgRegister = await request(app)
          .post('/api/users/register')
          .send({
            email: `orguser${i}@systemtest.com`,
            password: 'Organizer1234!',
            name: `Org User ${i}`,
            role: 'Organizer',
            username: `org_user_${i}_${Date.now()}`
          })
          .expect(201);

        const orgUserId = orgRegister.body.user._id;
        await User.findByIdAndUpdate(orgUserId, { verified: true, approved: true });

        const orgLogin = await request(app)
          .post('/api/users/login')
          .send({
            usernameEmail: `orguser${i}@systemtest.com`,
            password: 'Organizer1234!'
          })
          .expect(200);

        const orgToken = orgLogin.body.token;

        const orgResponse = await request(app)
          .post('/api/org/create')
          .set('Authorization', `Bearer ${orgToken}`)
          .send({
            name: `Test Organization ${i}`,
            description: `Description ${i}`,
            website: `https://org${i}.test.org`,
            contact: {
              email: `org${i}@test.org`,
              phone: `+123456789${i}`
            }
          })
          .expect(201);

        const orgId = orgResponse.body.organization._id;
        organizationIds.push(orgId);
        orgs.push(orgId);

        // Approve organizations
        await Organization.findByIdAndUpdate(orgId, { status: 'approved' });
      }

      // Get all organizations
      const allOrgsResponse = await request(app)
        .get('/api/org/all')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(allOrgsResponse.body).toHaveProperty('organizations');
      expect(Array.isArray(allOrgsResponse.body.organizations)).toBe(true);
      expect(allOrgsResponse.body.organizations.length).toBeGreaterThanOrEqual(3);

      // Verify all returned orgs are approved or suspended
      allOrgsResponse.body.organizations.forEach(org => {
        expect(['approved', 'suspended']).toContain(org.status);
      });

      console.log('✅ Get All Organizations Test Passed!');
    });
  });
});

