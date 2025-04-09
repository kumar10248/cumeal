const express = require('express');
const mongoose = require('mongoose');
const Feedback = require('./models/Feedback');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const menuRoutes = require('./routes/menuRoutes');

// Load environment variables
dotenv.config();

// Initialize Express
const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/menu', menuRoutes);
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/calories', require('./routes/calorieRoutes'));

app.post('/api/feedback', async (req, res) => {
  try {
    const { name, message, wantsMobileApp, deviceId } = req.body;
    
    // Validate required fields
    if (!name || wantsMobileApp === null || wantsMobileApp === undefined) {
      return res.status(400).json({ error: 'Please fill out all required fields' });
    }
    
    // Create new feedback entry
    const feedback = new Feedback({
      name,
      message: message || '',
      wantsMobileApp,
      deviceId: deviceId || 'unknown',
      timestamp: new Date()
    });
    
    // Save to database
    await feedback.save();
    
    // Return success
    res.status(201).json({ 
      success: true, 
      message: 'Feedback submitted successfully',
      feedbackId: feedback._id
    });
    
  } catch (error) {
    console.error('Error saving feedback:', error);
    res.status(500).json({ error: 'Failed to submit feedback. Please try again.' });
  }
});


app.get('/api/feedback', async (req, res) => {
  try {
    const allFeedback = await Feedback.find().sort({ timestamp: -1 });
    res.status(200).json(allFeedback);
  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({ error: 'Failed to fetch feedback data' });
  }
});

// Statistics endpoint
app.get('/api/feedback/stats', async (req, res) => {
  try {
    const totalCount = await Feedback.countDocuments();
    const wantAppCount = await Feedback.countDocuments({ wantsMobileApp: true });
    const dontWantAppCount = await Feedback.countDocuments({ wantsMobileApp: false });
    
    res.status(200).json({
      total: totalCount,
      wantApp: wantAppCount,
      dontWantApp: dontWantAppCount,
      wantAppPercentage: totalCount > 0 ? (wantAppCount / totalCount) * 100 : 0
    });
  } catch (error) {
    console.error('Error fetching feedback stats:', error);
    res.status(500).json({ error: 'Failed to fetch feedback statistics' });
  }
});

// Default route
app.get('/', (req, res) => {
  res.send('Meal Menu API is running...');
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});