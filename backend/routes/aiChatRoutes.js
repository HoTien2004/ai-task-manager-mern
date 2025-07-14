const express = require('express');
const router = express.Router();
const chatController = require('../controllers/aiAgentController');
const { protect } = require('../middlewares/authMiddleware');

/**
 * @
 */
router.post('/query', protect, chatController.handleChat);
router.get('/history', protect, chatController.getHistory);

module.exports = router;