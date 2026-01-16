const mongoose = require("mongoose");

const ebookSchema = new mongoose.Schema(
  {
    bookCover: {
      type: String, // URL or path of the image (can be stored in S3, local storage, etc.)
      required: true,
    },
    bookName: {
      type: String,
      required: true,
      trim: true,
    },
    synopsis: {
      type: String,
      required: true,
      trim: true,
    },
    pdfFile: {
      type: String, // URL/path to the uploaded PDF file
      required: true,
    },
    totalPages: {
      type: Number,
      required: true,
      min: 1,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId, // Reference to admin user who created it
      ref: "Admin",
    },
    category: {
      type: mongoose.Schema.Types.ObjectId, // Reference to category
      ref: "BookCategory",
      required: true,
    },
    categoryName: {
      type: String,
      required: true,
    },
    tags: {
      type: [String],
    },
    isSaved: {
      type: Boolean,
      default: false
    },
    isAudioBook: {
      type: Boolean,
      default: false
    },
    isEbook: {
      type: Boolean,
      default: true
    },
    isBook: {
      type: Boolean,
      default: false
    },
    viewCount: {
      type: Number,
      default: 0
    },
  },
  { timestamps: true }
);

const Ebook = mongoose.model("Ebook", ebookSchema);

module.exports = Ebook;