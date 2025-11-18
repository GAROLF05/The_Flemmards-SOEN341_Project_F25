const mongoose = require("mongoose");

// User role enum
const USER_ROLE = {
  STUDENT: "Student",
  ORGANIZER: "Organizer",
};

// Database that will contain all the users of the website
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      index: true,
      trim: true,
    },

    username: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },

    email: {
      type: String,
      unique: true,
      lowercase: true,
      required: [true, "Email is required"],
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please use a valid email address"],
    },

    password: {
      type: String,
      required: true,
      select: false,
    },

    role: {
      type: String,
      enum: Object.values(USER_ROLE),
      required: true,
    },

    // Approval status for organizers (only applies when role is 'Organizer')
    approved: {
      type: Boolean,
      default: function () {
        // Students are approved by default, organizers need admin approval
        return this.role === "Student";
      },
      index: true,
    },

    // Rejection timestamp for organizers (set when admin rejects organizer account)
    rejectedAt: {
      type: Date,
      default: null,
      index: true,
    },

    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: false,
      sparse: true,
      unique: true,
    },

    verified: {
      type: Boolean,
      default: false,
    },
    verificationToken: {
      type: String,
      select: false,
    },

    resetPasswordToken: {
      type: String,
      select: false,
    },
    resetPasswordExpires: {
      type: Date,
      default: null,
      select: false,
    },
  },
  {
    collection: "users",
    timestamps: true,
    versionKey: false,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        delete ret.password; // extra safety if password was ever selected
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

// Virtual: list of tickets owned by user (Ticket.user -> User)
userSchema.virtual("tickets", {
  ref: "Ticket",
  localField: "_id",
  foreignField: "user",
  justOne: false,
});

// Virtual: list of registrations for this user (Registration.user -> User)
userSchema.virtual("registrations", {
  ref: "Registration",
  localField: "_id",
  foreignField: "user",
  justOne: false,
});

const User = mongoose.model("User", userSchema);
module.exports = { User, USER_ROLE };
