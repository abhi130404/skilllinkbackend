const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const ctrl = require("../controllers/certificateController");

router.post("/issue", protect, ctrl.issueCertificate);

module.exports = router;
