const mongoose = require('mongoose');
const crypto = require('crypto');

const REGISTRATION_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded'
};

// Database containing all registrations (1 user - 1 event)
const registrationSchema = new mongoose.Schema({
	registrationId: {
		type: String,
		required: [true, 'Registration ID is required'],
		unique: true,
		default: ()=> 'REG-' + crypto.randomBytes(8).toString('hex').toUpperCase(),
        trim: true,
	},

	user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
        required: [true, 'User is required'],
        index: true,
        immutable: true,
    },

	event: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Event',
        required: [true, 'Event is required'],
        index: true,
        immutable: true,
    },

    quantity:{
        type: Number,
        required: [true, 'Quantity is required'],
        min: 1,
        default: 1,
    },

	status:{
        type: String,
        enum: Object.values(REGISTRATION_STATUS),
        default: REGISTRATION_STATUS.PAID,
        required: [true, 'Status of registration is required'],
        index: true,
    },

    ticketIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ticket'
    }],

    ticketsIssued: {
        type: Number,
        default: 0
    },

	
}, {
    collection: 'registrations',
    timestamps: true,
    versionKey: false,
    toJSON:  { virtuals: true },
    toObject:{ virtuals: true }
});


registrationSchema.index({ user: 1, event: 1 }, { unique: true }); // one registration per (user,event)

// Dynamically check all tickets with certain registration ID
registrationSchema.virtual('tickets', {
  ref: 'Ticket',
  localField: '_id',
  foreignField: 'registration'
});

// Dynamically count all tickets with certain registration ID
registrationSchema.virtual('ticketsCount', {
  ref: 'Ticket',
  localField: '_id',
  foreignField: 'registration',
  count: true
});


module.exports = mongoose.model('Registration', registrationSchema);
module.exports.REGISTRATION_STATUS = REGISTRATION_STATUS;