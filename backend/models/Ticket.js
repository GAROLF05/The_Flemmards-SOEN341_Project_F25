const mongoose = require('mongoose');
const crypto = require('crypto');

const TICKET_STATUS = {
  VALID: 'valid',
  USED: 'used',
  CANCELLED: 'cancelled',
};

const ticketSchema = new mongoose.Schema({

    ticketId:{
        type: String,
        required: [true, "Ticket ID is required"],
        unique: true,
        default: ()=> 'TIC-' + crypto.randomBytes(8).toString('hex').toUpperCase(),
        trim: true,
    },

    user:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, "User information is required"],
        index: true,
        immutable: true,
    },

    event:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        required: [true, "Event information is required"],
        index: true,
        immutable: true,
    },

    registration:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Registration',
        required: [true, "Registration information is required"],
        index: true,
        immutable: true,
    },

    code: {
        type: String,
        required: [true, "Ticket code is required"],
        unique: true,
        default: () => 'TK-' + crypto.randomBytes(6).toString('hex').toUpperCase(),
        trim: true,
        immutable: true
    },

    qr_expires_at: {
        type: Date,
        required: true,
        default: () => new Date(Date.now() + 30 * 60 * 1000),
        validate: {
            validator: (v) => v > new Date(),
            message: 'qr_expires_at must be in the future'
        }
    },

    status:{
        type: String,
        required: [true, "Status of ticket is required"],
        index: true,
        enum: Object.values(TICKET_STATUS),
        default: TICKET_STATUS.VALID,
    },

    scannedAt: { type: Date },
    scannedBy: { type: String, trim: true }
    
}, {
    timestamps: true,
    versionKey: false,
})

ticketSchema.index({ event: 1, status: 1 });

// Validates if user and event are registered with ticket
ticketSchema.pre('validate', async function () {
  if (!this.isNew || !this.registration) return;

  const reg = await mongoose.model('Registration')
    .findById(this.registration)
    .select('user event')
    .lean();

  if (reg) {
    if (!this.user)  this.user  = reg.user;
    if (!this.event) this.event = reg.event;
  }
});

module.exports = mongoose.model('Ticket', ticketSchema);
module.exports.TICKET_STATUS = TICKET_STATUS;