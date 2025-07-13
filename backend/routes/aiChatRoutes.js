const express = require('express');
const router = express.Router();
const chatController = require('../controllers/aiAgentController');
const { protect } = require('../middlewares/authMiddleware');

// Defines the POST route for handling chat messages
router.post('/query', protect, chatController.handleChat);
router.get('/history:conversationId', protect, chatController.getHistory);

module.exports = router;