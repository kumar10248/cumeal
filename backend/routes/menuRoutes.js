const express = require('express');
const router = express.Router();
const { 
  getAllMenus,
  getMenuByDate, 
  getCurrentWeekMenu, 
  createMenu, 
  updateMenu, 
  deleteMenu 
} = require('../controllers/menuController');

// Get all menus
router.get('/', getAllMenus);

// Get menu by specific date
router.get('/date/:date', getMenuByDate);

// Get menus for current week
router.get('/week', getCurrentWeekMenu);

// Create new menu
router.post('/', createMenu);

// Update menu
router.put('/:id', updateMenu);

// Delete menu
router.delete('/:id', deleteMenu);

module.exports = router;