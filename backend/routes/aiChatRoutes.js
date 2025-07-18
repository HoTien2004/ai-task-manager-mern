const express = require('express');
const router = express.Router();
const chatController = require('../controllers/aiAgentController');
const { protect } = require('../middlewares/authMiddleware');

/**
 * @
 */
router.post('/query', protect, chatController.handleChat);
router.get('/history', protect, chatController.getHistory);
router.get('/conversation-list', protect, chatController.getAllConversationsForUser);
router.get('/new-chat', protect, chatController.startNewConversation);

module.exports = router;