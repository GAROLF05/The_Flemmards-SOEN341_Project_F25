/**
 * Unit Tests for Calendar Controller
 * Tests individual controller functions in isolation
 */

const calendarController = require('../../controllers/calendarController');
const { Event } = require('../../models/Event');
const { Organization } = require('../../models/Organization');
const mongoose = require('mongoose');

describe('Calendar Controller Unit Tests', () => {
  let mockReq;
  let mockRes;
  let testOrgId;
  let testEventId;

  beforeEach(async () => {
    // Create test organization
    const org = await Organization.create({
      name: 'Unit Test Org',
      description: 'Test Org Description',
      status: 'approved',
      contact: {
        email: 'unittestorg@example.com',
        phone: '+1234567890'
      },
      website: 'https://example.com'
    });
    testOrgId = org._id;

    // Create test event
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    const event = await Event.create({
      title: 'Unit Test Event',
      description: 'Test Event Description',
      start_at: futureDate,
      end_at: new Date(futureDate.getTime() + 2 * 60 * 60 * 1000), // 2 hours later
      capacity: 100,
      category: 'workshop',
      organization: testOrgId,
      status: 'upcoming',
      moderationStatus: 'approved',
      location: {
        name: 'Test Location',
        address: '123 Test Street, Test City'
      }
    });
    testEventId = event._id;

    // Setup mock request and response
    mockReq = {
      params: {},
      body: {}
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      setHeader: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis()
    };
  });

  describe('generateICS', () => {
    it('should generate ICS file for valid event ID in params', async () => {
      mockReq.params.event_id = testEventId.toString();

      await calendarController.generateICS(mockReq, mockRes);

      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        expect.stringContaining('attachment; filename=event-')
      );
      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'Content-Type',
        'text/calendar; charset=utf-8'
      );
      expect(mockRes.send).toHaveBeenCalled();
      
      const icsContent = mockRes.send.mock.calls[0][0];
      expect(icsContent).toContain('BEGIN:VCALENDAR');
      expect(icsContent).toContain('END:VCALENDAR');
      expect(icsContent).toContain('Unit Test Event');
    });

    it('should generate ICS file for valid event ID in body', async () => {
      mockReq.body.eventId = testEventId.toString();

      await calendarController.generateICS(mockReq, mockRes);

      expect(mockRes.setHeader).toHaveBeenCalled();
      expect(mockRes.send).toHaveBeenCalled();
      
      const icsContent = mockRes.send.mock.calls[0][0];
      expect(icsContent).toContain('BEGIN:VCALENDAR');
      expect(icsContent).toContain('Unit Test Event');
    });

    it('should include event description in ICS file', async () => {
      mockReq.params.event_id = testEventId.toString();

      await calendarController.generateICS(mockReq, mockRes);

      const icsContent = mockRes.send.mock.calls[0][0];
      expect(icsContent).toContain('Test Event Description');
    });

    it('should include location in ICS file when both name and address are present', async () => {
      mockReq.params.event_id = testEventId.toString();

      await calendarController.generateICS(mockReq, mockRes);

      const icsContent = mockRes.send.mock.calls[0][0];
      expect(icsContent).toContain('Test Location');
      expect(icsContent).toContain('123 Test Street, Test City');
    });

    it('should handle location with only name', async () => {
      const event = await Event.create({
        title: 'Event With Name Only',
        description: 'Test',
        start_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        end_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
        capacity: 50,
        category: 'workshop',
        organization: testOrgId,
        status: 'upcoming',
        moderationStatus: 'approved',
        location: {
          name: 'Location Name Only',
          address: ''
        }
      });

      mockReq.params.event_id = event._id.toString();

      await calendarController.generateICS(mockReq, mockRes);

      const icsContent = mockRes.send.mock.calls[0][0];
      expect(icsContent).toContain('Location Name Only');
    });

    it('should handle location with only address', async () => {
      const event = await Event.create({
        title: 'Event With Address Only',
        description: 'Test',
        start_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        end_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
        capacity: 50,
        category: 'workshop',
        organization: testOrgId,
        status: 'upcoming',
        moderationStatus: 'approved',
        location: {
          name: '',
          address: '123 Address Only St'
        }
      });

      mockReq.params.event_id = event._id.toString();

      await calendarController.generateICS(mockReq, mockRes);

      const icsContent = mockRes.send.mock.calls[0][0];
      expect(icsContent).toContain('123 Address Only St');
    });

    it('should handle event without location', async () => {
      const event = await Event.create({
        title: 'Event Without Location',
        description: 'Test',
        start_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        end_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
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
      // Remove location
      await Event.findByIdAndUpdate(event._id, { $unset: { location: 1 } });

      mockReq.params.event_id = event._id.toString();

      await calendarController.generateICS(mockReq, mockRes);

      expect(mockRes.send).toHaveBeenCalled();
      const icsContent = mockRes.send.mock.calls[0][0];
      expect(icsContent).toContain('BEGIN:VCALENDAR');
    });

    it('should use organization name and email as organizer', async () => {
      mockReq.params.event_id = testEventId.toString();

      await calendarController.generateICS(mockReq, mockRes);

      const icsContent = mockRes.send.mock.calls[0][0];
      expect(icsContent).toContain('Unit Test Org');
      expect(icsContent).toContain('unittestorg@example.com');
    });

    it('should use default organizer when organization is missing', async () => {
      const event = await Event.create({
        title: 'Event Without Org',
        description: 'Test',
        start_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        end_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
        capacity: 50,
        category: 'workshop',
        organization: null,
        status: 'upcoming',
        moderationStatus: 'approved',
        location: {
          name: 'Test Location',
          address: '123 Test St'
        }
      });

      mockReq.params.event_id = event._id.toString();

      await calendarController.generateICS(mockReq, mockRes);

      const icsContent = mockRes.send.mock.calls[0][0];
      expect(icsContent).toContain('The Flemmards');
      expect(icsContent).toContain('noreply@flemmards.ca');
    });

    it('should calculate duration correctly', async () => {
      const startDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const endDate = new Date(startDate.getTime() + 3 * 60 * 60 * 1000 + 30 * 60 * 1000); // 3.5 hours
      
      const event = await Event.create({
        title: 'Event With Duration',
        description: 'Test',
        start_at: startDate,
        end_at: endDate,
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

      mockReq.params.event_id = event._id.toString();

      await calendarController.generateICS(mockReq, mockRes);

      const icsContent = mockRes.send.mock.calls[0][0];
      // Duration should be in the ICS file
      expect(icsContent).toContain('DURATION');
    });

    it('should handle zero duration when end_at is before start_at', async () => {
      const startDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const endDate = new Date(startDate.getTime() - 1000); // Before start
      
      const event = await Event.create({
        title: 'Event With Invalid Duration',
        description: 'Test',
        start_at: startDate,
        end_at: endDate,
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

      mockReq.params.event_id = event._id.toString();

      await calendarController.generateICS(mockReq, mockRes);

      // Should still generate ICS, but with zero duration
      expect(mockRes.send).toHaveBeenCalled();
      const icsContent = mockRes.send.mock.calls[0][0];
      expect(icsContent).toContain('BEGIN:VCALENDAR');
    });

    it('should return 400 if event_id is missing', async () => {
      // No event_id in params or body

      await calendarController.generateICS(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'event_id is required' });
    });

    it('should return 400 for invalid event ID format', async () => {
      mockReq.params.event_id = 'invalid-id-format';

      await calendarController.generateICS(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Invalid event id format' });
    });

    it('should return 404 for non-existent event', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      mockReq.params.event_id = fakeId;

      await calendarController.generateICS(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Event not found' });
    });

    it('should handle events with empty title', async () => {
      const event = await Event.create({
        title: '',
        description: 'Test Description',
        start_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        end_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
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

      mockReq.params.event_id = event._id.toString();

      await calendarController.generateICS(mockReq, mockRes);

      // Should use default 'Event' title
      const icsContent = mockRes.send.mock.calls[0][0];
      expect(icsContent).toContain('BEGIN:VCALENDAR');
    });

    it('should handle events with empty description', async () => {
      const event = await Event.create({
        title: 'Event Title',
        description: '',
        start_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        end_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
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

      mockReq.params.event_id = event._id.toString();

      await calendarController.generateICS(mockReq, mockRes);

      expect(mockRes.send).toHaveBeenCalled();
      const icsContent = mockRes.send.mock.calls[0][0];
      expect(icsContent).toContain('Event Title');
    });

    it('should format dates correctly in ICS format', async () => {
      const specificDate = new Date('2025-12-25T14:30:00Z');
      const endDate = new Date('2025-12-25T16:30:00Z');
      
      const event = await Event.create({
        title: 'Specific Date Event',
        description: 'Test',
        start_at: specificDate,
        end_at: endDate,
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

      mockReq.params.event_id = event._id.toString();

      await calendarController.generateICS(mockReq, mockRes);

      const icsContent = mockRes.send.mock.calls[0][0];
      // ICS format should contain date in YYYYMMDDTHHMMSSZ format
      expect(icsContent).toContain('2025');
      expect(icsContent).toContain('12');
      expect(icsContent).toContain('25');
    });

    it('should set correct Content-Disposition header with event ID', async () => {
      mockReq.params.event_id = testEventId.toString();

      await calendarController.generateICS(mockReq, mockRes);

      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        `attachment; filename=event-${testEventId}.ics`
      );
    });

    it('should set correct Content-Type header', async () => {
      mockReq.params.event_id = testEventId.toString();

      await calendarController.generateICS(mockReq, mockRes);

      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'Content-Type',
        'text/calendar; charset=utf-8'
      );
    });

    it('should include CONFIRMED status in ICS', async () => {
      mockReq.params.event_id = testEventId.toString();

      await calendarController.generateICS(mockReq, mockRes);

      const icsContent = mockRes.send.mock.calls[0][0];
      expect(icsContent).toContain('STATUS:CONFIRMED');
    });

    it('should include BUSY status in ICS', async () => {
      mockReq.params.event_id = testEventId.toString();

      await calendarController.generateICS(mockReq, mockRes);

      const icsContent = mockRes.send.mock.calls[0][0];
      expect(icsContent).toContain('BUSY');
    });

    it('should handle organization without contact email', async () => {
      const org = await Organization.create({
        name: 'Org Without Email',
        description: 'Test',
        status: 'approved',
        contact: {
          email: '',
          phone: '+1234567890'
        },
        website: 'https://example.com'
      });

      const event = await Event.create({
        title: 'Event With Org No Email',
        description: 'Test',
        start_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        end_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
        capacity: 50,
        category: 'workshop',
        organization: org._id,
        status: 'upcoming',
        moderationStatus: 'approved',
        location: {
          name: 'Test Location',
          address: '123 Test St'
        }
      });

      mockReq.params.event_id = event._id.toString();

      await calendarController.generateICS(mockReq, mockRes);

      const icsContent = mockRes.send.mock.calls[0][0];
      // Should use default email
      expect(icsContent).toContain('noreply@flemmards.ca');
    });

    it('should handle organization without name', async () => {
      const org = await Organization.create({
        name: '',
        description: 'Test',
        status: 'approved',
        contact: {
          email: 'test@example.com',
          phone: '+1234567890'
        },
        website: 'https://example.com'
      });

      const event = await Event.create({
        title: 'Event With Org No Name',
        description: 'Test',
        start_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        end_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
        capacity: 50,
        category: 'workshop',
        organization: org._id,
        status: 'upcoming',
        moderationStatus: 'approved',
        location: {
          name: 'Test Location',
          address: '123 Test St'
        }
      });

      mockReq.params.event_id = event._id.toString();

      await calendarController.generateICS(mockReq, mockRes);

      const icsContent = mockRes.send.mock.calls[0][0];
      // Should use default name
      expect(icsContent).toContain('The Flemmards');
    });

    it('should prioritize params.event_id over body.eventId', async () => {
      const event1 = await Event.create({
        title: 'Event 1',
        description: 'Test',
        start_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        end_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
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

      mockReq.params.event_id = testEventId.toString();
      mockReq.body.eventId = event1._id.toString();

      await calendarController.generateICS(mockReq, mockRes);

      // Should use params.event_id (testEventId)
      const icsContent = mockRes.send.mock.calls[0][0];
      expect(icsContent).toContain('Unit Test Event');
    });
  });
});

