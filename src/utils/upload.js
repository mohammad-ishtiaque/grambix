const multer = require("multer");
const path = require("path");
const { ApiError } = require("../errors/errorHandler");

// Storage engine with folders for images, pdfs, and audios
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, "uploads/images"); // For book covers
    } else if (file.mimetype === "application/pdf") {
      cb(null, "uploads/pdfs"); // For ebook PDFs
    } else if (file.mimetype.startsWith("audio/")) {
      cb(null, "uploads/audios"); // For audio files
    } else {
      cb(new ApiError("Invalid file type", 400), false);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// Allowed mimetypes including audio
const allowedImageTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
const allowedAudioTypes = ["audio/mpeg", "audio/mp3", "audio/wav", "audio/x-wav", "audio/ogg"];
const allowedPdfTypes = ["application/pdf"];

const fileFilter = (req, file, cb) => {
  if (
    allowedImageTypes.includes(file.mimetype) ||
    allowedPdfTypes.includes(file.mimetype) ||
    allowedAudioTypes.includes(file.mimetype)
  ) {
    cb(null, true);
  } else {
    cb(new ApiError("Only image (jpg, png, webp), PDF, and audio files are allowed", 400), false);
  }
};

// File size limit, you can customize or use different limits per file type if needed
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 3 * 1024 * 1024 * 1024 }, // 3GB max (adjust as you want)
});

module.exports = upload;
