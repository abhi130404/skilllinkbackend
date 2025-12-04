const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/instructor/instructorController");

// Register / enroll a user
router.get("/", ctrl.getInstructor);

module.exports = router;