const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const ctrl = require("../controllers/listingController");

router.get("/instructor",protect, ctrl.getAllListingForInstructor);
router.get("/user", ctrl.getAllListingForUser);
router.get("/:id", ctrl.getListing);
router.post("/", protect, ctrl.createListing);
router.put("/:id", protect, ctrl.updateListing);
router.delete("/:id", protect, ctrl.deleteListing);

module.exports = router;
