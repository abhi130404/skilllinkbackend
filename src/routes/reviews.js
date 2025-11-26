const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const ctrl = require("../controllers/reviewController");

router.post("/", protect, ctrl.addReview);
router.get("/:listingId", ctrl.getReviews);

module.exports = router;
