const Menu = require('../models/Menu');

// Helper function to get date labels (Today, Tomorrow, or weekday)
const getDateLabel = (date) => {
  if (!date) return 'Invalid Date';

  // Convert dates to IST timezone for consistency with frontend
  const today = new Date();
  // Convert to IST (UTC+5:30)
  const offset = 5.5 * 60 * 60 * 1000; // 5.5 hours in milliseconds
  const istTime = new Date(today.getTime() + (today.getTimezoneOffset() * 60 * 1000) + offset);
  
  // Create today's date in IST, with time set to midnight
  const istToday = new Date(istTime);
  istToday.setHours(0, 0, 0, 0);

  const tomorrow = new Date(istToday);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const menuDate = new Date(date);
  if (isNaN(menuDate.getTime())) return 'Invalid Date';

  menuDate.setHours(0, 0, 0, 0);

  if (menuDate.getTime() === istToday.getTime()) return 'Today';
  if (menuDate.getTime() === tomorrow.getTime()) return 'Tomorrow';

  return menuDate.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'Asia/Kolkata' });
};

// Get all menu items
const getAllMenus = async (req, res) => {
  try {
    const menus = await Menu.find().sort({ date: 1 });
    res.status(200).json(menus);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get menu for a specific date
const getMenuByDate = async (req, res) => {
  try {
    const date = new Date(req.params.date);
    if (isNaN(date.getTime())) {
      return res.status(400).json({ message: 'Invalid date format' });
    }

    // Use IST date handling for consistency with frontend
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(startOfDay);
    endOfDay.setHours(23, 59, 59, 999);

    const menu = await Menu.findOne({ date: { $gte: startOfDay, $lt: endOfDay } });

    if (!menu) {
      return res.status(404).json({ message: 'Menu not found for this date' });
    }

    res.status(200).json({ ...menu.toObject(), dateLabel: getDateLabel(menu.date) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get menus for current week
const getCurrentWeekMenu = async (req, res) => {
  try {
    // Convert to IST timezone for consistency with frontend
    const today = new Date();
    // Convert to IST (UTC+5:30)
    const offset = 5.5 * 60 * 60 * 1000; // 5.5 hours in milliseconds
    const istTime = new Date(today.getTime() + (today.getTimezoneOffset() * 60 * 1000) + offset);
    
    // Create today's date in IST, with time set to midnight
    const istToday = new Date(istTime);
    istToday.setHours(0, 0, 0, 0);

    // Calculate Monday of the current week (in IST)
    const startOfWeek = new Date(istToday);
    const day = istToday.getDay() || 7; // Convert Sunday from 0 to 7
    if (day !== 1) // If not Monday
      startOfWeek.setHours(-24 * (day - 1)); // Go back to Monday
    startOfWeek.setHours(0, 0, 0, 0);

    // Calculate Sunday of the current week
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    // Fetch menus for the current week
    const menus = await Menu.find({ date: { $gte: startOfWeek, $lte: endOfWeek } }).sort({ date: 1 });

    // Make sure to apply dateLabel with IST timezone
    res.status(200).json(menus.map(menu => ({ ...menu.toObject(), dateLabel: getDateLabel(menu.date) })));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create new menu
const createMenu = async (req, res) => {
  try {
    const { date, breakfast, lunch, snacks, dinner } = req.body;
    const menuDate = new Date(date);

    if (isNaN(menuDate.getTime())) {
      return res.status(400).json({ message: 'Invalid date format' });
    }

    // Use midnight-to-midnight range in local time zone
    const startOfDay = new Date(menuDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(startOfDay);
    endOfDay.setHours(23, 59, 59, 999);

    const existingMenu = await Menu.findOne({ date: { $gte: startOfDay, $lt: endOfDay } });

    if (existingMenu) {
      return res.status(400).json({ message: 'Menu for this date already exists' });
    }

    const newMenu = new Menu({ date: menuDate, breakfast, lunch, snacks, dinner });
    const savedMenu = await newMenu.save();

    res.status(201).json(savedMenu);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update menu
const updateMenu = async (req, res) => {
  try {
    // Only update fields that are provided in request body
    const updatedMenu = await Menu.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!updatedMenu) {
      return res.status(404).json({ message: 'Menu not found' });
    }

    res.status(200).json(updatedMenu);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete menu
const deleteMenu = async (req, res) => {
  try {
    const deletedMenu = await Menu.findByIdAndDelete(req.params.id);

    if (!deletedMenu) {
      return res.status(404).json({ message: 'Menu not found' });
    }

    res.status(200).json({ message: 'Menu deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllMenus,
  getMenuByDate,
  getCurrentWeekMenu,
  createMenu,
  updateMenu,
  deleteMenu
};