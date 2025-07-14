const { GoogleGenerativeAI } = require('@google/generative-ai');
const Conversation = require('../models/aiAgentQuery/DataSheetForAIAgent');

// Initialize the Google Generative AI client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

/**
 * Handles incoming chat requests, interacts with Gemini API, and saves the conversation.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 */
exports.handleChat = async (req, res) => {
  try {
    const { message } = req.body;
    // 1. Lấy userId từ người dùng đã được xác thực
    const userId = req.user.id;

    if (!message) {
      return res.status(400).json({ error: 'Message is required.' });
    }

    // 2. Tìm cuộc trò chuyện GẦN NHẤT chỉ dựa vào userId
    let conversation = await Conversation.findOne({ userId }).sort({ updatedAt: -1 });

    // 3. Nếu không có, tạo mới với userId đó
    if (!conversation) {
      conversation = new Conversation({ userId, history: [] });
    }

    // Prepare the history for the Gemini API
    const history = conversation.history.map(msg => ({
      role: msg.role,
      parts: msg.parts.map(part => ({ text: part.text })),
    }));

    const chat = model.startChat({
      history: history,
      generationConfig: {
        maxOutputTokens: 1000,
      },
    });

    const result = await chat.sendMessage(message);
    const response = await result.response;
    const modelResponseText = response.text();

    // Save the new user message and model response to the database
    conversation.history.push({ role: 'user', parts: [{ text: message }] });
    conversation.history.push({ role: 'model', parts: [{ text: modelResponseText }] });

    await conversation.save();

    // Send the response back to the client
    res.status(200).json({
      response: modelResponseText,
      conversationId: conversation._id,
    });

  } catch (error) {
    console.error('Error in handleChat:', error);
    res.status(500).json({ error: 'An internal server error occurred.' });
  }
};

/**
 * Retrieves the message history for a given conversation with pagination.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 */
exports.getHistory = async (req, res) => {
  try {
    const userId = req.user.id; // Get user ID from the authenticated user

    // Set up pagination variables
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    // Find the most recent conversation for this user
    const conversation = await Conversation.findOne({ userId }).sort({ updatedAt: -1 });

    // If the user has no conversations at all
    if (!conversation) {
      return res.status(200).json({
        history: [],
        currentPage: 1,
        totalPages: 0,
        totalMessages: 0,
      });
    }

    // Get the total number of messages for calculating total pages
    const totalMessages = conversation.history.length;
    const totalPages = Math.ceil(totalMessages / limit);

    // Slice the history array to get only the messages for the current page
    const paginatedHistory = conversation.history.slice(skip, skip + limit);

    res.status(200).json({
      conversationId: conversation._id,
      currentPage: page,
      totalPages: totalPages,
      totalMessages: totalMessages,
      history: paginatedHistory,
    });

  } catch (error) {
    console.error('Error in getHistory:', error);
    res.status(500).json({ error: 'An internal server error occurred.' });
  }
};