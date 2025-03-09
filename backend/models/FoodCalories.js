const mongoose = require('mongoose');

const FoodCaloriesSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  calories: {
    type: Number,
    required: true
  },
  category: {
    type: String,
    enum: ['breakfast', 'lunch', 'snacks', 'dinner', 'common'],
    default: 'common'
  },
  servingSize: {
    type: String,
    default: '1 serving'
  },
  nutrients: {
    protein: {
      type: Number,
      default: 0
    },
    carbs: {
      type: Number,
      default: 0
    },
    fat: {
      type: Number,
      default: 0
    },
    fiber: {
      type: Number,
      default: 0
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create a text index for better search functionality
FoodCaloriesSchema.index({ name: 'text' });

module.exports = mongoose.model('FoodCalories', FoodCaloriesSchema);