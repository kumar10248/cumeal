const Menu = require('../models/Menu');
const FoodCalories = require('../models/FoodCalories'); // Assuming we'll create this model

// Helper function to get date labels (Today, Tomorrow, or weekday)
const getDateLabel = (date) => {
  if (!date) return 'Invalid Date';

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const menuDate = new Date(date);
  if (isNaN(menuDate.getTime())) return 'Invalid Date';

  menuDate.setHours(0, 0, 0, 0);

  if (menuDate.getTime() === today.getTime()) return 'Today';
  if (menuDate.getTime() === tomorrow.getTime()) return 'Tomorrow';

  return menuDate.toLocaleDateString('en-US', { weekday: 'long' });
};

// Helper to calculate calories for menu items
const calculateCaloriesForMenu = async (menuItems) => {
  if (!menuItems) return [];
  
  // Split the comma-separated items and trim whitespace
  const items = menuItems.split(',').map(item => item.trim());
  
  // Get all food items and their calories from the database
  const caloriesData = await FoodCalories.find({
    name: { $in: items }
  });
  
  // Create a lookup map for easy calorie retrieval
  const caloriesMap = {};
  caloriesData.forEach(food => {
    caloriesMap[food.name.toLowerCase()] = food.calories;
  });
  
  // Map each item with its calorie information
  return items.map(item => {
    // Try to find exact match or partial match
    let calories = caloriesMap[item.toLowerCase()] || null;
    
    // If no exact match, try to find partial matches
    if (!calories) {
      const itemLower = item.toLowerCase();
      for (const [foodName, calorieValue] of Object.entries(caloriesMap)) {
        if (itemLower.includes(foodName) || foodName.includes(itemLower)) {
          calories = calorieValue;
          break;
        }
      }
    }
    
    return {
      name: item,
      calories: calories || 'N/A' // Use N/A if no match found
    };
  });
};

// Helper to process menu with calories
const processMenuWithCalories = async (menu) => {
  if (!menu) return null;
  
  const menuObj = menu.toObject();
  
  // Process each meal type to include calories
  menuObj.breakfastItems = await calculateCaloriesForMenu(menu.breakfast);
  menuObj.lunchItems = await calculateCaloriesForMenu(menu.lunch);
  menuObj.snacksItems = await calculateCaloriesForMenu(menu.snacks);
  menuObj.dinnerItems = await calculateCaloriesForMenu(menu.dinner);
  
  // Calculate total calories per meal
  menuObj.breakfastTotalCalories = menuObj.breakfastItems
    .reduce((sum, item) => sum + (typeof item.calories === 'number' ? item.calories : 0), 0);
  
  menuObj.lunchTotalCalories = menuObj.lunchItems
    .reduce((sum, item) => sum + (typeof item.calories === 'number' ? item.calories : 0), 0);
  
  menuObj.snacksTotalCalories = menuObj.snacksItems
    .reduce((sum, item) => sum + (typeof item.calories === 'number' ? item.calories : 0), 0);
  
  menuObj.dinnerTotalCalories = menuObj.dinnerItems
    .reduce((sum, item) => sum + (typeof item.calories === 'number' ? item.calories : 0), 0);
  
  // Add date label
  menuObj.dateLabel = getDateLabel(menu.date);
  
  return menuObj;
};

// Get all menu items with calories
const getAllMenus = async (req, res) => {
  try {
    const menus = await Menu.find().sort({ date: 1 });
    
    // Process each menu to include calories information
    const processedMenus = await Promise.all(
      menus.map(menu => processMenuWithCalories(menu))
    );
    
    res.status(200).json(processedMenus);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get menu for a specific date with calories
const getMenuByDate = async (req, res) => {
  try {
    const date = new Date(req.params.date);
    if (isNaN(date.getTime())) {
      return res.status(400).json({ message: 'Invalid date format' });
    }

    const startOfDay = new Date(date.toISOString().split('T')[0] + "T00:00:00.000Z");
    const endOfDay = new Date(date.toISOString().split('T')[0] + "T23:59:59.999Z");

    const menu = await Menu.findOne({ date: { $gte: startOfDay, $lt: endOfDay } });

    if (!menu) {
      return res.status(404).json({ message: 'Menu not found for this date' });
    }

    const processedMenu = await processMenuWithCalories(menu);
    res.status(200).json(processedMenu);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get menus for current week with calories
const getCurrentWeekMenu = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Calculate Monday of the current week
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + 1);

    // Calculate Sunday of the current week
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    // Fetch menus for the current week
    const menus = await Menu.find({ date: { $gte: startOfWeek, $lte: endOfWeek } }).sort({ date: 1 });

    // Process each menu to include calories information
    const processedMenus = await Promise.all(
      menus.map(menu => processMenuWithCalories(menu))
    );

    res.status(200).json(processedMenus);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create new menu with calories validation
const createMenu = async (req, res) => {
  try {
    const { date, breakfast, lunch, snacks, dinner } = req.body;
    const menuDate = new Date(date);

    if (isNaN(menuDate.getTime())) {
      return res.status(400).json({ message: 'Invalid date format' });
    }

    const startOfDay = new Date(menuDate.toISOString().split('T')[0] + "T00:00:00.000Z");
    const endOfDay = new Date(menuDate.toISOString().split('T')[0] + "T23:59:59.999Z");

    const existingMenu = await Menu.findOne({ date: { $gte: startOfDay, $lt: endOfDay } });

    if (existingMenu) {
      return res.status(400).json({ message: 'Menu for this date already exists' });
    }

    const newMenu = new Menu({ date: menuDate, breakfast, lunch, snacks, dinner });
    const savedMenu = await newMenu.save();

    // Process the saved menu to include calories information
    const processedMenu = await processMenuWithCalories(savedMenu);
    res.status(201).json(processedMenu);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update menu with calories
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

    // Process the updated menu to include calories information
    const processedMenu = await processMenuWithCalories(updatedMenu);
    res.status(200).json(processedMenu);
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

// Get nutritional stats for a date range
const getNutritionalStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Start date and end date are required' });
    }
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ message: 'Invalid date format' });
    }
    
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    
    const menus = await Menu.find({
      date: { $gte: start, $lte: end }
    }).sort({ date: 1 });
    
    // Process each menu to include calories information
    const processedMenus = await Promise.all(
      menus.map(menu => processMenuWithCalories(menu))
    );
    
    // Calculate average calories per meal type across the date range
    let avgBreakfastCalories = 0;
    let avgLunchCalories = 0;
    let avgSnacksCalories = 0;
    let avgDinnerCalories = 0;
    
    if (processedMenus.length > 0) {
      avgBreakfastCalories = processedMenus.reduce((sum, menu) => 
        sum + menu.breakfastTotalCalories, 0) / processedMenus.length;
      
      avgLunchCalories = processedMenus.reduce((sum, menu) => 
        sum + menu.lunchTotalCalories, 0) / processedMenus.length;
      
      avgSnacksCalories = processedMenus.reduce((sum, menu) => 
        sum + menu.snacksTotalCalories, 0) / processedMenus.length;
      
      avgDinnerCalories = processedMenus.reduce((sum, menu) => 
        sum + menu.dinnerTotalCalories, 0) / processedMenus.length;
    }
    
    res.status(200).json({
      menus: processedMenus,
      stats: {
        totalDays: processedMenus.length,
        avgBreakfastCalories: Math.round(avgBreakfastCalories),
        avgLunchCalories: Math.round(avgLunchCalories),
        avgSnacksCalories: Math.round(avgSnacksCalories),
        avgDinnerCalories: Math.round(avgDinnerCalories),
        avgDailyCalories: Math.round(avgBreakfastCalories + avgLunchCalories + avgSnacksCalories + avgDinnerCalories)
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get top favorite items based on ratings/feedback
const getTopFavoriteItems = async (req, res) => {
  try {
    // This would typically use a separate model for user ratings or preferences
    // Here we're just mocking the functionality
    const favorites = [
      { name: 'Aloo Parantha', category: 'breakfast', count: 145, avgRating: 4.8 },
      { name: 'Kadhai Paneer', category: 'dinner', count: 132, avgRating: 4.7 },
      { name: 'Rajma Chawal', category: 'lunch', count: 129, avgRating: 4.6 },
      { name: 'Chole Bhature', category: 'breakfast', count: 118, avgRating: 4.6 },
      { name: 'Samosa', category: 'snacks', count: 110, avgRating: 4.5 }
    ];
    
    res.status(200).json(favorites);
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
  deleteMenu,
  getNutritionalStats,
  getTopFavoriteItems
};