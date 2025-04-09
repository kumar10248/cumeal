const mongoose = require('mongoose');
const feedbackSchema = new mongoose.Schema({
    name: {
      type: String,
      required: true,
      trim: true
    },
    message: {
      type: String,
      trim: true
    },
    wantsMobileApp: {
      type: Boolean,
      required: true
    },
    deviceId: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  });
  
  // Create Feedback model
  module.exports = mongoose.model('Feedback', feedbackSchema);