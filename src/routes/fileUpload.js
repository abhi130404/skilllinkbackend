const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/fileUploadController");
const upload = require("../storage/multer/upload");

router.post("/single",upload.single("file"), ctrl.uploadSingle);

module.exports = router;

