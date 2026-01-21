const multer = require("multer");
const multerS3 = require("multer-s3");
const path = require("path");
const s3 = require("../config/s3"); // 👈 reuse your s3 config
const { ApiError } = require("../errors/errorHandler");
const dotenv = require("dotenv");

dotenv.config();

// Allowed mimetypes
const allowedImageTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp", "image/jfif"];
const allowedAudioTypes = ["audio/mpeg", "audio/mp3", "audio/wav", "audio/x-wav", "audio/ogg"];
const allowedPdfTypes = ["application/pdf"];

// File filter
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

// console.log(process.env.AWS_BUCKET_NAME)
// Multer-S3 storage
// const upload = multer({
//   storage: multerS3({
//     s3: s3,
//     bucket: process.env.AWS_BUCKET_NAME,
//     acl: "private", // 👈 use "private" if you want signed URLs, "public-read" for direct links
//     key: (req, file, cb) => {
//       let folder = "others";

//       if (file.mimetype.startsWith("image/")) {
//         folder = "images";
//       } else if (file.mimetype === "application/pdf") {
//         folder = "pdfs";
//       } else if (file.mimetype.startsWith("audio/")) {
//         folder = "audios";
//       }

//       const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
//       cb(null, `${folder}/${uniqueSuffix}${path.extname(file.originalname)}`);
//     },
//   }),
//   fileFilter,
//   limits: { fileSize: 3 * 1024 * 1024 * 1024 }, // 3GB max
// });
const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_BUCKET_NAME,
    acl: "private", // keep private, better security
    contentType: (req, file, cb) => {
      // Let S3 detect content type automatically
      cb(null, file.mimetype);
    },
    contentDisposition: (req, file, cb) => {
      if (file.mimetype === "application/pdf" || file.mimetype.startsWith("image/") || file.mimetype.startsWith("audio/")) {
        // Force browser to open PDFs inline
        cb(null, "inline");
      } else {
        cb(null, "attachment"); // others can download
      }
    },
    key: (req, file, cb) => {
      let folder = "others";

      if (file.mimetype.startsWith("image/")) {
        folder = "images";
      } else if (file.mimetype === "application/pdf") {
        folder = "pdfs";
      } else if (file.mimetype.startsWith("audio/")) {
        folder = "audios";
      }

      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, `${folder}/${uniqueSuffix}${path.extname(file.originalname)}`);
    },
  }),
  fileFilter,
  limits: { fileSize: 3 * 1024 * 1024 * 1024 }, // 3GB max
});


module.exports = upload;
