const audioBookService = require('./audioBook.service');
const asyncHandler = require('../../utils/asyncHandler');
const BookCategory = require('../BookCategory/BookCategory');
const { ApiError } = require('../../errors/errorHandler');

exports.createAudioBook = asyncHandler(async (req, res) => {
  const { bookName, synopsis, tags, duration } = req.body;

  // validate category
  let categoryData;
  if (req.body.category) {
    categoryData = await BookCategory.findById(req.body.category);
    if (!categoryData) {
      throw new ApiError("Category not found", 404);
    }
  } else {
    throw new ApiError("Category is required", 400);
  }

  const categoryName = categoryData.name;
  const category = categoryData._id;


  // handle file uploads or urls
  const bookCoverPath = req.body.bookCover || req.files?.bookCover?.[0]?.location || undefined;
  const audioFilePath = req.body.audioFile || req.files?.audioFile?.[0]?.location || undefined;

  // handle tags (convert comma-separated string → array)
  let tagsArray = [];
  if (typeof tags === "string") {
    tagsArray = tags.split(",").map((tag) => tag.trim());
  } else if (Array.isArray(tags)) {
    tagsArray = tags;
  }

  const data = {
    bookCover: bookCoverPath,
    audioFile: audioFilePath,
    bookName,
    synopsis,
    category,
    categoryName,
    tags: tagsArray,
    duration: duration,
  };

  const audioBook = await audioBookService.createAudioBook(data, req.admin);

  res.status(201).json({
    success: true,
    message: "AudioBook created successfully",
    data: audioBook,
  });
});

exports.getAllAudioBooks = asyncHandler(async (req, res) => {
  const audioBooks = await audioBookService.getAllAudioBooks(req.query);
  res.json({ success: true, message: 'AudioBooks fetched successfully', data: audioBooks });
});

exports.getAudioBookById = asyncHandler(async (req, res) => {
  const audioBook = await audioBookService.getAudioBookById(req.params.id);
  audioBookService.incrementViewCount(req.params.id);
  res.json({ success: true, message: 'AudioBook fetched successfully', data: audioBook });
});

exports.updateAudioBook = asyncHandler(async (req, res) => {
  const updateData = { ...req.body };

  if (req.body.category) {
    const categoryData = await BookCategory.findById(req.body.category);
    if (!categoryData) {
      throw new ApiError("Category not found", 404);
    }
    updateData.category = categoryData._id;
    updateData.categoryName = categoryData.name;
  }

  if (req.body.tags) {
    updateData.tags = typeof req.body.tags === "string"
      ? req.body.tags.split(",").map((tag) => tag.trim())
      : req.body.tags;
  }

  if (req.files?.bookCover) {
    updateData.bookCover = req.files.bookCover[0].location;
  }
  if (req.files?.audioFile) {
    updateData.audioFile = req.files.audioFile[0].location;
  }

  const audioBook = await audioBookService.updateAudioBook(
    req.params.id,
    updateData,
    req.admin
  );
  res.json({ success: true, message: 'AudioBook updated successfully', data: audioBook });
});

exports.deleteAudioBook = asyncHandler(async (req, res) => {
  const audioBook = await audioBookService.deleteAudioBook(req.params.id, req.admin);
  res.json({ success: true, message: 'AudioBook deleted successfully', data: audioBook });
});
