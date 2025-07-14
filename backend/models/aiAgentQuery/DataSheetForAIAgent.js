const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'model'], // Role can only be 'user' or 'model' (Gemini)
    required: true,
  },
  parts: [{
    text: {
      type: String,
      required: true,
    }
  }],
}, { _id: false });

const conversationSchema = new mongoose.Schema({
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    history: [messageSchema], // An array of messages
}, { timestamps: true });

const Conversation = mongoose.model('Conversation', conversationSchema);

module.exports = Conversation;