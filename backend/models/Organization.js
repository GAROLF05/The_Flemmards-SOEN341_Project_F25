const mongoose = require('mongoose');
const validator = require('validator'); // npm install validator

const ORGANIZATION_STATUS = {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected',
    SUSPENDED: 'suspended'
};

// Database of all organizers/organizations on the website
const organizationSchema = new mongoose.Schema({

    name:{
        type: String,
        unique: true,
        trim: true,
        required: [true, 'Organization name is required'],
    },

    description:{
        type: String,
        required: [true, 'Description is required'],
        trim: true,
    },

    website:{
        type: String,
        trim: true,
        required: [true, 'Website URL is required'],
        unique: true,
        validate: { // Validates URL
            validator: v => validator.isURL(v, { protocols: ['http', 'https'], require_protocol: true }),
            message: props => `${props.value} is not a valid URL`
        }
    },

    contact:{
        email:{
            type: String,
            required: [true, 'Contact email is required'],
            trim: true,
            lowercase: true,
            unique: true,
            match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
        },

        phone:{
            type: String,
            required: [true, 'Contact phone number is required'],
            trim: true,
            unique: true,
            match: [/^\+?[0-9]{10,15}$/, 'Please enter a valid phone number (10–15 digits, optional +)']
        },

        socials:{
            instagram:{
                type: String,
                trim: true,
                sparse: true,
                unique: true,
                match: [/^@[A-Za-z0-9_.]{2,30}$/, 'Invalid Instagram handle (e.g. @username)']
            },

            twitter: {
                type: String,
                trim: true,
                sparse: true,
                unique: true,
                match: [/^@[A-Za-z0-9_]{1,15}$/, 'Invalid Twitter/X handle (e.g. @username)']
            },

            facebook:{
                type: String,
                trim: true,
                sparse: true,
                unique: true,
                match: [/^@[A-Za-z0-9_.]{2,30}$/, 'Invalid Facebook handle (e.g. @username)']
            }
        }
    },

    verified: {
        type: Boolean,
        default: false
    },

    status: {
        type: String,
        enum: Object.values(ORGANIZATION_STATUS),
        default: ORGANIZATION_STATUS.PENDING,
        index: true
    },


}, {
    collection: 'organizations',
    timestamps: true,          
    versionKey: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Text search across name & description (for search bar or filters)
organizationSchema.index({ name: 'text', description: 'text' });

// Returns the array of events 
organizationSchema.virtual('events', {
  ref: 'Event',
  localField: '_id',
  foreignField: 'organization',
});

const Organization = mongoose.model('Organization', organizationSchema);
module.exports = { Organization, ORGANIZATION_STATUS };