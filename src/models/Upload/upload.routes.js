const express = require("express");
const router = express.Router();
const uploadController = require("./upload.controller");
const { authAdmin } = require("../../middleware/authMiddleware");

// Protected route to get presigned URL
router.post("/presigned", authAdmin, uploadController.getPresignedUrl);

module.exports = router;
