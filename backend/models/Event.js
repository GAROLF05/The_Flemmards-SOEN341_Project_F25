const mongoose = require('mongoose');

const EVENT_STATUS = {
    UPCOMING: 'upcoming',
    ONGOING: 'ongoing',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled'
};

const MODERATION_STATUS = {
    PENDING_APPROVAL: 'pending_approval',
    APPROVED: 'approved',
    REJECTED: 'rejected',
    FLAGGED: 'flagged'
};

const CATEGORY = {
    MUSIC: 'music',
    TECHNOLOGY: 'technology',
    BUSINESS: 'business',
    SPORTS: 'sports',
    COMMUNITY: 'community',
    ARTS_CULTURE: 'arts & culture',
    FOOD_DRINK: 'food & drink',
    HEALTH_WELLNESS: 'health & wellness',
    EDUCATION: 'education',
    OTHER: 'other'
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

    category: {
        type: String,
        enum: Object.values(CATEGORY),
        default: CATEGORY.OTHER,
        required: [true, 'Category is required for the event'],
        index: true,
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

    status: {
        type: String,
        enum: Object.values(EVENT_STATUS),
        default: EVENT_STATUS.UPCOMING,
        required: [true, 'Status of event is required'],
        index: true,
    },

    moderationStatus: {
        type: String,
        enum: Object.values(MODERATION_STATUS),
        default: MODERATION_STATUS.PENDING_APPROVAL,
        required: [true, 'Moderation status is required'],
        index: true,
    },

    moderationNotes: {
        type: String,
        trim: true,
    },

    moderatedBy: {
        type: String,
        trim: true,
    },

    moderatedAt: {
        type: Date,
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

    registered_users:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        index: true,
    }],

    waitlist: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Registration',
        index: true,
    }],

    comments: [{ 
        type: String,
        trim: true,
    }],

    image: {
        type: String,
        trim: true,
        default: null,
    }

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


// Export everything
const Event = mongoose.model('Event', eventSchema);
module.exports = {Event, EVENT_STATUS, MODERATION_STATUS, CATEGORY};