const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const ctrl = require("../controllers/userController");

router.get("/currentuser", protect, ctrl.getProfile);
router.put("/updateuser/:id", protect, ctrl.updateProfile);

module.exports = router;
