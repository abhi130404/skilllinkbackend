const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const ctrl = require("../controllers/enrollmentController");

// Register / enroll a user
router.post("/", protect, ctrl.enroll);

// Get all enrollments of logged-in user
router.get("/", protect, ctrl.getEnrollments);

// Update progress of one enrollment
router.put("/:id", protect, ctrl.updateProgress);

// Cancel enrollment (optional but recommended)
router.delete("/:id", protect, ctrl.cancelEnrollment);

module.exports = router;
