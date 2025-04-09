const Menu = require('../models/Menu');
const FoodCalories = require('../models/FoodCalories');

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

// Helper function to calculate nutritional information for a list of food items
const calculateNutrition = async (foodItems) => {
  if (!foodItems || !Array.isArray(foodItems) || foodItems.length === 0) {
    return {
      items: [],
      totalCalories: 0,
      totalNutrients: { protein: 0, carbs: 0, fat: 0, fiber: 0 }
    };
  }

  try {
    // Get nutritional information for each food item
    const foodPromises = foodItems.map(async (item) => {
      const foodData = await FoodCalories.findOne({ name: { $regex: new RegExp(item, 'i') } });
      return foodData;
    });

    const foodData = await Promise.all(foodPromises);
    
    // Filter out any null values (items not found in the database)
    const validFoodData = foodData.filter(item => item !== null);
    
    // Calculate total calories and nutrients
    let totalCalories = 0;
    const totalNutrients = { protein: 0, carbs: 0, fat: 0, fiber: 0 };
    
    validFoodData.forEach(food => {
      totalCalories += food.calories;
      totalNutrients.protein += food.nutrients.protein;
      totalNutrients.carbs += food.nutrients.carbs;
      totalNutrients.fat += food.nutrients.fat;
      totalNutrients.fiber += food.nutrients.fiber;
    });
    
    return {
      items: validFoodData,
      totalCalories,
      totalNutrients
    };
  } catch (error) {
    console.error('Error calculating nutrition:', error);
    throw error;
  }
};

// Get menu with calories information for a specific date
const getMenuCaloriesByDate = async (req, res) => {
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

    // Calculate nutrition for each meal type
    const breakfastNutrition = await calculateNutrition(menu.breakfast);
    const lunchNutrition = await calculateNutrition(menu.lunch);
    const snacksNutrition = await calculateNutrition(menu.snacks);
    const dinnerNutrition = await calculateNutrition(menu.dinner);

    // Calculate daily totals
    const dailyTotalCalories = 
      breakfastNutrition.totalCalories + 
      lunchNutrition.totalCalories + 
      snacksNutrition.totalCalories + 
      dinnerNutrition.totalCalories;

    const dailyTotalNutrients = {
      protein: breakfastNutrition.totalNutrients.protein + 
               lunchNutrition.totalNutrients.protein + 
               snacksNutrition.totalNutrients.protein + 
               dinnerNutrition.totalNutrients.protein,
      carbs: breakfastNutrition.totalNutrients.carbs + 
             lunchNutrition.totalNutrients.carbs + 
             snacksNutrition.totalNutrients.carbs + 
             dinnerNutrition.totalNutrients.carbs,
      fat: breakfastNutrition.totalNutrients.fat + 
           lunchNutrition.totalNutrients.fat + 
           snacksNutrition.totalNutrients.fat + 
           dinnerNutrition.totalNutrients.fat,
      fiber: breakfastNutrition.totalNutrients.fiber + 
             lunchNutrition.totalNutrients.fiber + 
             snacksNutrition.totalNutrients.fiber + 
             dinnerNutrition.totalNutrients.fiber
    };

    res.status(200).json({
      _id: menu._id,
      date: menu.date,
      dateLabel: getDateLabel(menu.date),
      meals: {
        breakfast: {
          items: menu.breakfast,
          nutrition: breakfastNutrition
        },
        lunch: {
          items: menu.lunch,
          nutrition: lunchNutrition
        },
        snacks: {
          items: menu.snacks,
          nutrition: snacksNutrition
        },
        dinner: {
          items: menu.dinner,
          nutrition: dinnerNutrition
        }
      },
      dailyTotals: {
        calories: dailyTotalCalories,
        nutrients: dailyTotalNutrients
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get calories for current week's menu
const getWeekMenuCalories = async (req, res) => {
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

    // Calculate nutrition information for each menu
    const menuPromises = menus.map(async (menu) => {
      // Calculate nutrition for each meal type
      const breakfastNutrition = await calculateNutrition(menu.breakfast);
      const lunchNutrition = await calculateNutrition(menu.lunch);
      const snacksNutrition = await calculateNutrition(menu.snacks);
      const dinnerNutrition = await calculateNutrition(menu.dinner);

      // Calculate daily totals
      const dailyTotalCalories = 
        breakfastNutrition.totalCalories + 
        lunchNutrition.totalCalories + 
        snacksNutrition.totalCalories + 
        dinnerNutrition.totalCalories;

      const dailyTotalNutrients = {
        protein: breakfastNutrition.totalNutrients.protein + 
                lunchNutrition.totalNutrients.protein + 
                snacksNutrition.totalNutrients.protein + 
                dinnerNutrition.totalNutrients.protein,
        carbs: breakfastNutrition.totalNutrients.carbs + 
              lunchNutrition.totalNutrients.carbs + 
              snacksNutrition.totalNutrients.carbs + 
              dinnerNutrition.totalNutrients.carbs,
        fat: breakfastNutrition.totalNutrients.fat + 
            lunchNutrition.totalNutrients.fat + 
            snacksNutrition.totalNutrients.fat + 
            dinnerNutrition.totalNutrients.fat,
        fiber: breakfastNutrition.totalNutrients.fiber + 
              lunchNutrition.totalNutrients.fiber + 
              snacksNutrition.totalNutrients.fiber + 
              dinnerNutrition.totalNutrients.fiber
      };

      return {
        _id: menu._id,
        date: menu.date,
        dateLabel: getDateLabel(menu.date),
        meals: {
          breakfast: {
            items: menu.breakfast,
            nutrition: breakfastNutrition
          },
          lunch: {
            items: menu.lunch,
            nutrition: lunchNutrition
          },
          snacks: {
            items: menu.snacks,
            nutrition: snacksNutrition
          },
          dinner: {
            items: menu.dinner,
            nutrition: dinnerNutrition
          }
        },
        dailyTotals: {
          calories: dailyTotalCalories,
          nutrients: dailyTotalNutrients
        }
      };
    });

    const weekMenuWithCalories = await Promise.all(menuPromises);

    // Calculate weekly totals
    const weeklyTotalCalories = weekMenuWithCalories.reduce(
      (total, day) => total + day.dailyTotals.calories, 0
    );

    const weeklyTotalNutrients = {
      protein: weekMenuWithCalories.reduce((total, day) => total + day.dailyTotals.nutrients.protein, 0),
      carbs: weekMenuWithCalories.reduce((total, day) => total + day.dailyTotals.nutrients.carbs, 0),
      fat: weekMenuWithCalories.reduce((total, day) => total + day.dailyTotals.nutrients.fat, 0),
      fiber: weekMenuWithCalories.reduce((total, day) => total + day.dailyTotals.nutrients.fiber, 0)
    };

    res.status(200).json({
      weeklyMenus: weekMenuWithCalories,
      weeklyTotals: {
        calories: weeklyTotalCalories,
        nutrients: weeklyTotalNutrients,
        dailyAvgCalories: weekMenuWithCalories.length > 0 
          ? Math.round(weeklyTotalCalories / weekMenuWithCalories.length) 
          : 0
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get food items suggestions and nutrition by partial name
const getFoodSuggestions = async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || query.length < 2) {
      return res.status(400).json({ message: 'Query must be at least 2 characters long' });
    }
    
    const foodItems = await FoodCalories.find({ 
      name: { $regex: new RegExp(query, 'i') } 
    }).limit(10);
    
    res.status(200).json(foodItems);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Calculate nutrition for specific food items
const calculateCustomMealNutrition = async (req, res) => {
  try {
    const { foodItems } = req.body;
    
    if (!foodItems || !Array.isArray(foodItems) || foodItems.length === 0) {
      return res.status(400).json({ message: 'Food items array is required' });
    }
    
    const nutritionInfo = await calculateNutrition(foodItems);
    
    res.status(200).json(nutritionInfo);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getMenuCaloriesByDate,
  getWeekMenuCalories,
  getFoodSuggestions,
  calculateCustomMealNutrition
};