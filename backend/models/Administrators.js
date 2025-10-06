const mongoose = require('mongoose');

const administratorSchema = new mongoose.Schema({
    
    name:{
        type: String,
        required: [true, 'Administrator name is required'],
        index: true,
        trim: true,
    },

    username: { 
        type: String, 
        unique: true, 
        sparse: true, 
        trim: true 
    },

    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address'],
        index: true,
    },

    password: {
        type: String,
        required: true,
        select: false,
    },

}, {
    
    collection: 'admins',
    timestamps: true,
    versionKey: false,
  })

module.exports = mongoose.model('Administrator', administratorSchema);
