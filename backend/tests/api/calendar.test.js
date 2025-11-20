const request = require('supertest');
const app = require('../../app');
const { Organization } = require('../../models/Organization');
const { Event, EVENT_STATUS } = require('../../models/Event');

describe('Calendar API Endpoints', () => {
  let orgId;
  let eventId;

  beforeEach(async () => {
    // Create an organization
    const org = await Organization.create({
      name: 'Test Organization',
      description: 'Test Org Description',
      status: 'approved',
      website: 'https://example.com',
      contact: {
        email: 'org@example.com',
        phone: '+1234567890'
      }
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
      status: EVENT_STATUS.UPCOMING,
      moderationStatus: 'approved',
      location: {
        name: 'Test Location',
        address: '123 Test St'
      }
    });
    eventId = event._id.toString();
  });

  describe('POST /api/calendar/generate/:event_id', () => {
    it('should generate ICS file for event', async () => {
      const response = await request(app)
        .post(`/api/calendar/generate/${eventId}`)
        .expect(200);

      expect(response.headers['content-type']).toContain('text/calendar');
      expect(response.text).toContain('BEGIN:VCALENDAR');
      expect(response.text).toContain('END:VCALENDAR');
      expect(response.text).toContain('Test Event');
    });

    it('should return 404 for non-existent event', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      await request(app)
        .post(`/api/calendar/generate/${fakeId}`)
        .expect(404);
    });

    it('should include event details in ICS file', async () => {
      const response = await request(app)
        .post(`/api/calendar/generate/${eventId}`)
        .expect(200);

      const icsContent = response.text;
      expect(icsContent).toContain('SUMMARY:Test Event');
      expect(icsContent).toContain('DESCRIPTION:Test Event Description');
    });
  });
});

