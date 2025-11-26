const asyncHandler = require("express-async-handler");
const { Discussion } = require("../models/models");

const postDiscussion = asyncHandler(async (req, res) => {
  const { listingId, message, parentId } = req.body;
  if (!listingId || !message) return res.status(400).json({ message: "listingId and message required" });
  const doc = await Discussion.create({ listingId, userId: req.user._id, message, parentId });
  res.json(doc);
});

const getDiscussions = asyncHandler(async (req, res) => {
  const { listingId } = req.params;
  const items = await Discussion.find({ listingId }).sort({ createdAt: -1 });
  res.json(items);
});

module.exports = { postDiscussion, getDiscussions };
