const audioBookService = require('./audioBook.service');
const asyncHandler = require('../../utils/asyncHandler');
const BookCategory = require('../BookCategory/BookCategory');
const { ApiError } = require('../../errors/errorHandler');

exports.createAudioBook = asyncHandler(async (req, res) => {
  const { bookName, synopsis, tags } = req.body;

  // validate category
  const category = await BookCategory.findById(req.body.category);
  if (!category) throw new ApiError("Category not found", 404);
  const categoryName = category.name;

  // handle file uploads
  const bookCoverPath = req.files?.bookCover?.[0]?.location  || undefined;
  const audioFilePath = req.files?.audioFile?.[0]?.location  || undefined;

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
    category: category._id,
    categoryName,
    tags: tagsArray,
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
  res.json({ success: true, message: 'AudioBook fetched successfully', data: audioBook });
});

exports.updateAudioBook = asyncHandler(async (req, res) => {
 
    const audioBook = await audioBookService.updateAudioBook(
      req.params.id, 
      {
        ...req.body,
        bookCover: req.files?.bookCover?.[0]?.location  || undefined,
        audioFile: req.files?.audioFile?.[0]?.location  || undefined,
        tags: req.body.tags ? req.body.tags.split(",").map((tag) => tag.trim()) : [],
      }, 
      req.admin
    );
    res.json({ success: true, message: 'AudioBook updated successfully', data: audioBook });
});

exports.deleteAudioBook = asyncHandler(async (req, res) => {
  const audioBook = await audioBookService.deleteAudioBook(req.params.id, req.admin);
  res.json({ success: true, message: 'AudioBook deleted successfully', data: audioBook });
});
