const mongoose = require('mongoose');

// Database that will contain all the users of the website
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    index: true,
    trim: true,
  },

  email: {
    type: String,
    unique: true,
    lowercase: true,
    required: [true, 'Email is required'],
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address'],
  },

  student_id: {
    type: String,
    unique: true,
    required: [true, 'Student ID is required'],
    index: true,
    trim: true,
  },

  password: {
    type: String,
    required: true,
    select: false,
  },

  events_registered: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Registration', 
    }
  ]
}, {
    collection: 'users',
    timestamps: true, 
    versionKey: false,
    toJSON: {
        virtuals: true,
        transform: (_doc, ret) => {
        delete ret.password;   // extra safety if password was ever selected
        return ret;
        }
    },
    toObject: { virtuals: true }
});

// Dynamically return the number of events registered to
userSchema.virtual('registrationsCount').get(function () {
  return Array.isArray(this.events_registered) ? this.events_registered.length : 0;
});

const User = mongoose.model('User', userSchema);
module.exports = User;
