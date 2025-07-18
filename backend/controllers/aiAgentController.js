const { GoogleGenerativeAI } = require('@google/generative-ai');
const Conversation = require('../models/aiAgentQuery/DataSheetForAIAgent');
const Task = require('../models/Task');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const aimodel = 'gemini-2.5-flash';
// const systemInstruction = `Bạn là một Trợ lý Quản lý Công việc Thông minh. Bạn hãy giúp tôi trả lời các câu hỏi liên quan đến quản lý công việc.`;
const systemInstruction = '';

const getTaskObjectById = async (taskId, userId) => {
  return await Task.findOne({
    _id: taskId,
    $or: [{ createdBy: userId }, { assignedTo: userId }]
  }).lean();
};

const createPromptForTaskSupport = (task) => {
  const taskString = JSON.stringify(task, null, 2);
  return `Hãy hoạt động như một trợ lý chuyên gia. Dưới đây là thông tin chi tiết về một công việc (task) mà tôi cần hỗ trợ.
---
### DỮ LIỆU TASK (JSON):
${taskString}
---
### YÊU CẦU CỦA TÔI:
"${userMessage}"`;
};

/**
 * Creates a new, empty conversation and returns its ID and title.
 */
exports.startNewConversation = async (req, res) => {
  try {
    const userId = req.user.id;
    const newConversation = new Conversation({
      userId,
      title: `Cuộc trò chuyện mới lúc ${(() => {
        // [INSTRUCTION_B]
        // This is an Immediately Invoked Function Expression (IIFE).
        // The entire function is defined and then executed immediately
        // by the final parentheses (). This allows us to write multi-line
        // logic directly inside a template literal.
        // [INSTRUCTION_E]
        const d = new Date();

        // Get all parts and pad them with a leading zero if needed
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        const seconds = String(d.getSeconds()).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0'); // Add 1 to month
        const year = d.getFullYear();

        // Return the final formatted string
        return `${hours}:${minutes}:${seconds} ${day}-${month}-${year}`;
      })()}`
    });
    await newConversation.save();
    res.status(201).json({
      conversationId: newConversation._id,
      title: newConversation.title
    });
  } catch (error) {
    console.error('Error starting new conversation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Handles incoming chat messages, including specialized requests for task support.
 */
exports.handleChat = async (req, res) => {
  try {
    let { conversationId } = req.query;
    let { message } = req.body;
    const userId = req.user.id;

    if (!message || !conversationId) {
      return res.status(400).json({ error: 'message and conversationId are required.' });
    }

    // if (isSupportForTask === true && taskId) {
    //   const task = await getTaskObjectById(taskId, userId);
    //   if (!task) {
    //     return res.status(404).json({ error: 'Task not found or permission denied.' });
    //   }
    //   message = createPromptForTaskSupport(task);
    // }

    const model = genAI.getGenerativeModel({
      model: aimodel,
      systemInstruction: systemInstruction
    });

    const conversation = await Conversation.findOne({ _id: conversationId, userId });
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found or permission denied.' });
    }

    const history = conversation.history.map(msg => ({
      role: msg.role,
      parts: msg.parts.map(part => ({ text: part.text })),
    }));

    const chat = model.startChat({
      history: history,
      generationConfig: { maxOutputTokens: 10000 },
    });

    const result = await chat.sendMessage(message);
    const modelResponseText = result.response.text();

    conversation.history.push({ role: 'user', parts: [{ text: message }] });
    conversation.history.push({ role: 'model', parts: [{ text: modelResponseText }] });
    await conversation.save();

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
 * Retrieves details for a specific task.
 */
exports.getTaskDetails = async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.id;
    const task = await getTaskObjectById(taskId, userId);

    if (!task) {
      return res.status(404).json({ error: 'Task not found or you do not have permission.' });
    }
    res.status(200).json(task);
  } catch (error) {
    console.error('Error getting task details:', error);
    res.status(500).json({ error: 'An internal server error occurred.' });
  }
};


exports.getHistory = async (req, res) => {
  try {
    const userId = req.user.id; // Get user ID from the authenticated user
    const { conversationId } = req.query;

    // Set up pagination variables
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    // Find the most recent conversation for this user
    const conversation = await Conversation.findOne({
      _id: conversationId,
      userId: userId
    }).sort({ updatedAt: -1 });

    if (!conversation) {
      return res.status(200).json({
        history: [],
        currentPage: 1,
        totalPages: 0,
        totalMessages: 0,
      });
    }


    const totalMessages = conversation.history.length;
    const totalPages = Math.ceil(totalMessages / limit);


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

/**
 * Retrieves a list of all conversations for the logged-in user, with pagination.
 */
exports.getAllConversationsForUser = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 15;
    const skip = (page - 1) * limit;

    const conversations = await Conversation.find({ userId })
      .sort({ updatedAt: -1 })
      .select('_id title updatedAt') // Select only needed fields
      .skip(skip)
      .limit(limit)
      .lean();

    const totalConversations = await Conversation.countDocuments({ userId });

    res.status(200).json({
      currentPage: page,
      totalPages: Math.ceil(totalConversations / limit),
      conversations,
    });

  } catch (error) {
    console.error('Error getting all conversations:', error);
    res.status(500).json({ error: 'An internal server error occurred.' });
  }
};

/**
 * Deletes a specific conversation by its ID,
 * ensuring it belongs to the logged-in user.
 */
exports.deleteConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    // Find and delete the document that matches both the conversationId and userId
    const result = await Conversation.findOneAndDelete({
      _id: conversationId,
      userId: userId,
    });

    // If no document was found and deleted, it means it either didn't exist
    // or the user does not have permission.
    if (!result) {
      return res.status(404).json({
        error: 'Conversation not found or you do not have permission to delete it.',
      });
    }

    // If deletion was successful, send a success response.
    res.status(200).json({ message: 'Đã xoá cuộc trò chuyện thành công.' });

  } catch (error) {
    console.error('Error deleting conversation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// exports.createPromptForTaskSupport
