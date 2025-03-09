const connectDB = require('../config/db'); // Adjust the path as needed
const FoodCalories = require('../models/FoodCalories');

// Sample data for common food items in the menu
const foodCaloriesData = [
  // Your food data array remains the same
  // ...
   // Breakfast items
   { name: 'Sweet dalia', calories: 150, category: 'breakfast', servingSize: '1 bowl', nutrients: { protein: 3, carbs: 30, fat: 2, fiber: 3 } },
   { name: 'Banana', calories: 105, category: 'breakfast', servingSize: '1 medium', nutrients: { protein: 1.3, carbs: 27, fat: 0.4, fiber: 3.1 } },
   { name: 'Bread', calories: 75, category: 'breakfast', servingSize: '1 slice', nutrients: { protein: 2.6, carbs: 13.8, fat: 1, fiber: 1.1 } },
   { name: 'Boiled Egg', calories: 78, category: 'breakfast', servingSize: '1 egg', nutrients: { protein: 6.3, carbs: 0.6, fat: 5.3, fiber: 0 } },
   { name: 'Butter', calories: 102, category: 'breakfast', servingSize: '1 tbsp', nutrients: { protein: 0.1, carbs: 0.1, fat: 11.5, fiber: 0 } },
   { name: 'Jam', calories: 56, category: 'breakfast', servingSize: '1 tbsp', nutrients: { protein: 0.1, carbs: 13.8, fat: 0.1, fiber: 0.2 } },
   { name: 'Tea', calories: 40, category: 'breakfast', servingSize: '1 cup', nutrients: { protein: 0.1, carbs: 10.6, fat: 0, fiber: 0 } },
   { name: 'Aloo Pyaaz Parantha', calories: 330, category: 'breakfast', servingSize: '1 parantha', nutrients: { protein: 7, carbs: 45, fat: 14, fiber: 3 } },
   { name: 'Plain Curd', calories: 98, category: 'breakfast', servingSize: '1 bowl', nutrients: { protein: 10, carbs: 4, fat: 4.3, fiber: 0 } },
   { name: 'Idli', calories: 80, category: 'breakfast', servingSize: '1 piece', nutrients: { protein: 2, carbs: 17, fat: 0.1, fiber: 0.8 } },
   { name: 'Bhature', calories: 300, category: 'breakfast', servingSize: '1 piece', nutrients: { protein: 6, carbs: 36, fat: 15, fiber: 1.5 } },
   { name: 'Chhole', calories: 280, category: 'breakfast', servingSize: '1 serving', nutrients: { protein: 10, carbs: 45, fat: 7, fiber: 12 } },
   { name: 'Poha', calories: 270, category: 'breakfast', servingSize: '1 bowl', nutrients: { protein: 3.5, carbs: 56, fat: 2, fiber: 3 } },
   { name: 'Bombay Sandwich', calories: 320, category: 'breakfast', servingSize: '1 sandwich', nutrients: { protein: 8, carbs: 38, fat: 15, fiber: 4 } },
   { name: 'Milk', calories: 150, category: 'breakfast', servingSize: '1 cup', nutrients: { protein: 8, carbs: 12, fat: 8, fiber: 0 } },
   { name: 'Besan Chilla', calories: 200, category: 'breakfast', servingSize: '1 piece', nutrients: { protein: 7, carbs: 17, fat: 12, fiber: 3 } },
   { name: 'Cornflakes', calories: 100, category: 'breakfast', servingSize: '1 bowl', nutrients: { protein: 2, carbs: 24, fat: 0, fiber: 1 } },
   
   // Lunch items
   { name: 'Panchmel Dal', calories: 250, category: 'lunch', servingSize: '1 bowl', nutrients: { protein: 14, carbs: 35, fat: 6, fiber: 8 } },
   { name: 'Aloo Gobhi', calories: 160, category: 'lunch', servingSize: '1 serving', nutrients: { protein: 3, carbs: 20, fat: 9, fiber: 5 } },
   { name: 'Chapati', calories: 120, category: 'lunch', servingSize: '1 piece', nutrients: { protein: 3, carbs: 20, fat: 3, fiber: 2 } },
   { name: 'Cucumber Raita', calories: 80, category: 'lunch', servingSize: '1 bowl', nutrients: { protein: 4, carbs: 6, fat: 5, fiber: 1 } },
   { name: 'Steamed Rice', calories: 190, category: 'lunch', servingSize: '1 bowl', nutrients: { protein: 4, carbs: 42, fat: 0.5, fiber: 0.6 } },
   { name: 'Green Salad', calories: 30, category: 'lunch', servingSize: '1 serving', nutrients: { protein: 1, carbs: 6, fat: 0, fiber: 2 } },
   { name: 'Mix Pickle', calories: 25, category: 'lunch', servingSize: '1 tbsp', nutrients: { protein: 0.5, carbs: 5, fat: 0.5, fiber: 0.5 } },
   { name: 'Rajma Masala', calories: 280, category: 'lunch', servingSize: '1 bowl', nutrients: { protein: 15, carbs: 45, fat: 2, fiber: 15 } },
   { name: 'Sev Tamatar', calories: 200, category: 'lunch', servingSize: '1 serving', nutrients: { protein: 5, carbs: 22, fat: 12, fiber: 3 } },
   { name: 'Boondi Raita', calories: 120, category: 'lunch', servingSize: '1 bowl', nutrients: { protein: 5, carbs: 17, fat: 4, fiber: 0.5 } },
   { name: 'Veg Biryani', calories: 350, category: 'lunch', servingSize: '1 plate', nutrients: { protein: 6, carbs: 55, fat: 12, fiber: 4 } },
   { name: 'Veg Kofta Curry', calories: 300, category: 'lunch', servingSize: '1 serving', nutrients: { protein: 6, carbs: 15, fat: 24, fiber: 3 } },
   
   // Snacks items
   { name: 'Namkeen', calories: 180, category: 'snacks', servingSize: '1 serving', nutrients: { protein: 4, carbs: 18, fat: 10, fiber: 1 } },
   { name: 'Matthi', calories: 160, category: 'snacks', servingSize: '2 pieces', nutrients: { protein: 2, carbs: 16, fat: 10, fiber: 0.5 } },
   { name: 'Biscuit', calories: 90, category: 'snacks', servingSize: '2 pieces', nutrients: { protein: 1, carbs: 14, fat: 3.5, fiber: 0.5 } },
   { name: 'Samosa', calories: 250, category: 'snacks', servingSize: '1 piece', nutrients: { protein: 4, carbs: 28, fat: 14, fiber: 2 } },
   { name: 'Chips', calories: 160, category: 'snacks', servingSize: '1 small pack', nutrients: { protein: 2, carbs: 15, fat: 10, fiber: 1 } },
   { name: 'Sweet Roll', calories: 220, category: 'snacks', servingSize: '1 piece', nutrients: { protein: 4, carbs: 42, fat: 4, fiber: 1 } },
   { name: 'Cake', calories: 280, category: 'snacks', servingSize: '1 slice', nutrients: { protein: 3, carbs: 40, fat: 12, fiber: 0.5 } },
   { name: 'Mix-Pakora', calories: 300, category: 'snacks', servingSize: '4 pieces', nutrients: { protein: 5, carbs: 22, fat: 18, fiber: 2 } },
   
   // Dinner items
   { name: 'Dal Makhani', calories: 270, category: 'dinner', servingSize: '1 bowl', nutrients: { protein: 12, carbs: 36, fat: 8, fiber: 8 } },
   { name: 'Veg Jalfrezi', calories: 180, category: 'dinner', servingSize: '1 serving', nutrients: { protein: 4, carbs: 20, fat: 10, fiber: 5 } },
   { name: 'Sirca Onion', calories: 40, category: 'dinner', servingSize: '1 serving', nutrients: { protein: 1, carbs: 9, fat: 0, fiber: 1.5 } },
   { name: 'Fruit Custard', calories: 200, category: 'dinner', servingSize: '1 bowl', nutrients: { protein: 5, carbs: 40, fat: 4, fiber: 2 } },
   { name: 'Kung pao soya', calories: 240, category: 'dinner', servingSize: '1 serving', nutrients: { protein: 18, carbs: 12, fat: 14, fiber: 3 } },
   { name: 'Garlic Fried Rice', calories: 280, category: 'dinner', servingSize: '1 bowl', nutrients: { protein: 5, carbs: 54, fat: 5, fiber: 1 } },
   { name: 'Kadai Paneer', calories: 350, category: 'dinner', servingSize: '1 serving', nutrients: { protein: 16, carbs: 11, fat: 28, fiber: 3 } },
   { name: 'Chicken Curry', calories: 320, category: 'dinner', servingSize: '1 serving', nutrients: { protein: 26, carbs: 10, fat: 20, fiber: 2 } },
   { name: 'Mint-Onion Pulao', calories: 260, category: 'dinner', servingSize: '1 bowl', nutrients: { protein: 4, carbs: 48, fat: 6, fiber: 3 } }
];

// Function to seed data
const seedData = async () => {
  try {
    // Connect to database using your connection function
    await connectDB();
    
    // Clear existing data
    await FoodCalories.deleteMany({});
    
    // Insert new data
    await FoodCalories.insertMany(foodCaloriesData);
    
    console.log('Food calories data seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

// Run the seeding function
seedData();