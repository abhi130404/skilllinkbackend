const asyncHandler = require("express-async-handler");
const { Review, Listing } = require("../models/models");

const addReview = asyncHandler(async (req, res) => {
  const { listingId, rating, review } = req.body;
  if (!listingId || !rating) return res.status(400).json({ message: "listingId and rating required" });

  const r = await Review.create({ userId: req.user._id, listingId, rating, review });
  // Update average rating on listing (simple approach)
  const reviews = await Review.find({ listingId });
  const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  await Listing.findByIdAndUpdate(listingId, { rating: avg });
  res.json(r);
});

const getReviews = asyncHandler(async (req, res) => {
  const { listingId } = req.params;
  const items = await Review.find({ listingId }).sort({ createdAt: -1 });
  res.json(items);
});

module.exports = { addReview, getReviews };
