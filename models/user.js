const mongoose = require('mongoose');
const { Schema } = mongoose;

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    hashedPassword: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      validate: {
    validator: function(v) {
      return /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(v);
    }
  },
      required: true,
      unique: true,
      trim: true,
      lowercase: true
    },
    avatar: {
      type: String,
      default: "assets/default.jpg"
    },
    bio: {
      type: String,
      maxlength: 500,
      default: ""
    },
    location: {
      type: String,
      default: ""
    },
    contactInfo: {
      type: String,
      default: ""
    }
  },
  {
    timestamps: true,
  }
);

userSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    delete returnedObject.hashedPassword;
  },
});

const User = mongoose.model('User', userSchema);

module.exports = User;