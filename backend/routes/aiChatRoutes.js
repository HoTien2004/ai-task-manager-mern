const express = require('express');
const router = express.Router();
const aiAgentController = require('../controllers/aiAgentController');
const { protect } = require('../middlewares/authMiddleware');

/**
 * @
 */
router.post('/query', protect, aiAgentController.handleChat);
router.get('/history', protect, aiAgentController.getHistory);
router.get('/conversation-list', protect, aiAgentController.getAllConversationsForUser);
router.get('/new-chat', protect, aiAgentController.startNewConversation);
router.delete('/conversations/:conversationId', protect, aiAgentController.deleteConversation);

module.exports = router;