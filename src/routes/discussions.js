const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const ctrl = require("../controllers/discussionController");

router.post("/", protect, ctrl.postDiscussion);
router.get("/:listingId", ctrl.getDiscussions);

module.exports = router;
