const express = require('express');
const router = express.Router();
const menuCaloriesController = require('../controllers/menuCaloriesController');

// Get menu calories for specific date
router.get('/menu-calories/:date', menuCaloriesController.getMenuCaloriesByDate);

// Get weekly menu calories
router.get('/week-menu-calories', menuCaloriesController.getWeekMenuCalories);

// Get food suggestions by partial name
router.get('/food-suggestions', menuCaloriesController.getFoodSuggestions);

// Calculate custom meal nutrition
router.post('/calculate-nutrition', menuCaloriesController.calculateCustomMealNutrition);

module.exports = router;