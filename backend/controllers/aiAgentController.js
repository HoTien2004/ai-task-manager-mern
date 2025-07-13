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
    const { message, conversationId } = req.body;

    // Basic validation
    if (!message) {
      return res.status(400).json({ error: 'Message is required.' });
    }

    let conversation;

    // Find existing conversation or create a new one
    if (conversationId) {
      conversation = await Conversation.findById(conversationId);
      if (!conversation) {
        // If an invalid ID is provided, create a new conversation
        conversation = new Conversation();
      }
    } else {
      conversation = new Conversation();
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
    const { conversationId } = req.params; // Get ID from URL parameter
    
    // Set up pagination variables from query string, with default values
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    if (!conversationId) {
      return res.status(400).json({ error: 'Conversation ID is required.' });
    }

    // Find the conversation by its ID
    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found.' });
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