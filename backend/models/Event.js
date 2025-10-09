const mongoose = require('mongoose');

const EVENT_STATUS = {
  UPCOMING: 'upcoming',
  ONGOING: 'ongoing',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

// Database that will contain all events on the website
const eventSchema = new mongoose.Schema({
    
    organization: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: [true, 'Organization is required to create an event'],
        index: true,
    },

    title: {
        type: String,
        required: [true, 'Title of event is required'],
        index: true,
        trim: true,
    },

    description:{
        type: String,
        required: true,
    },

    start_at:{
        type: Date,
        required: [true, 'Starting date and time are required'],
        index: true,
    },

    end_at:{
        type: Date,
        required: [true, 'Ending date and time are required'],
        index: true,
        validate: {
        validator(v) {
            return this.start_at && v > this.start_at;
        },
        message: 'end_at must be after start_at'
        }
    },

    capacity:{
        type: Number,
        required: [true, 'Capacity of event is required'],
        index: true,
        min: [0, 'capacity must be at least 0'],
    },

    registrations_count: {
        type: Number,
        default: 0,
        min: 0
    },

    status: {
        type: String,
        enum: Object.values(EVENT_STATUS),
        default: EVENT_STATUS.UPCOMING,
        required: [true, 'Status of event is required'],
        index: true,
    },

    location:{
        name:{
            type: String,
            trim: true,
            required: [true, 'Name of location is required'],
        },

        address:{
            type: String,
            trim: true,
            required: [true, 'Address of location is required'],
        },
    },

    registered_users:{
        type: mongoose.Schema.Types.ObjectId,
        index: true,
    },

    waitlist: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Registration',
    }],
    
}, {
    collection: 'events',
    timestamps: true,
    versionKey: false,
    toJSON: { 
        virtuals: true 
    },
    toObject: { 
        virtuals: true 
    }
});

// No two events can exist in the same organization with same title and same start time
eventSchema.index({ organization: 1, title: 1, start_at: 1 }, { unique: true });

// Virtual field that can calculate the number of seats left on the go without storing it in DB
eventSchema.virtual('seats_left').get(function () {
  const left = this.capacity - this.registrations_count;
  return left < 0 ? this.capacity : left;
});

// Export everything
const Event = mongoose.model('Event', eventSchema);
module.exports = {Event, EVENT_STATUS}