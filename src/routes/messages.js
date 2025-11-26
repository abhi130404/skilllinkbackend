const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const ctrl = require("../controllers/messageController");

router.post("/", protect, ctrl.sendMessage);
router.get("/conversation/:userId", protect, ctrl.getConversation);

module.exports = router;
