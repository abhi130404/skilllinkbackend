const asyncHandler = require("express-async-handler");
const { Message } = require("../models/models");

const sendMessage = asyncHandler(async (req, res) => {
  const { receiverId, message } = req.body;
  if (!receiverId || !message) return res.status(400).json({ message: "receiverId and message required" });

  const msg = await Message.create({ senderId: req.user._id, receiverId, message });
  res.json(msg);
});

const getConversation = asyncHandler(async (req, res) => {
  const { userId } = req.params; // conversation with userId
  const conv = await Message.find({
    $or: [
      { senderId: req.user._id, receiverId: userId },
      { senderId: userId, receiverId: req.user._id }
    ]
  }).sort({ createdAt: 1 });
  res.json(conv);
});

module.exports = { sendMessage, getConversation };
