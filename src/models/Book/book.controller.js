const asyncHandler = require("../../utils/asyncHandler");
const BookService = require("./book.service");
const BookCategory = require("../BookCategory/BookCategory");
const { ApiError } = require("../../errors/errorHandler");

/** Create Book */
exports.createBook = asyncHandler(async (req, res) => {
  const { bookName, synopsis, totalPages, duration, tags } = req.body;

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


  // Handle tags
  let tagsArray = [];
  if (typeof tags === "string") {
    tagsArray = tags.split(",").map((tag) => tag.trim());
  } else if (Array.isArray(tags)) {
    tagsArray = tags;
  }

  // Log files for debugging
  // console.log('Uploaded files:', req.files);

  const data = {
    bookName,
    synopsis,
    category,
    categoryName,
    bookCover: req.body.bookCover || req.files?.bookCover?.[0]?.location || null,
    tags: tagsArray,
    pdfFile: req.body.pdfFile || req.files?.pdfFile?.[0]?.location || null,
    totalPages: totalPages || null,
    audioFile: req.body.audioFile || req.files?.audioFile?.[0]?.location || null,
    duration: duration || null,
    isBook: true,
    isEbook: true,
    isAudioBook: true
  };

  if (!data.pdfFile || !data.audioFile) {
    throw new ApiError("Both PDF and Audio files are required to create a verified Book", 400);
  }

  const book = await BookService.createBook(data, req.admin);
  res.status(201).json({ success: true, message: "Book created successfully", data: book });
});

/** Get All Books */
exports.getAllBooks = asyncHandler(async (req, res) => {
  const result = await BookService.getAllBooks(req.query);
  res.status(200).json({ success: true, ...result });
});

/** Get Books by Category ID */
exports.getBooksByCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await BookService.getBooksByCategoryId(id, req.query);
  res.status(200).json({ success: true, ...result });
});

/** Get Book by ID */
exports.getBookById = asyncHandler(async (req, res) => {
  const book = await BookService.getBookById(req.params.id);
  // Increment view count asynchronously
  BookService.incrementViewCount(req.params.id);
  res.status(200).json({ success: true, data: book });
});

/** Update Book */
exports.updateBook = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { bookName, synopsis, totalPages, duration, tags, category } = req.body;

  // Handle category if provided
  let categoryData;
  let categoryName;

  if (category) {
    categoryData = await BookCategory.findById(category);
    if (!categoryData) {
      throw new ApiError("Category not found", 404);
    }
    categoryName = categoryData.name;
  }

  // Handle tags
  let tagsArray = [];
  if (tags) {
    if (typeof tags === "string") {
      tagsArray = tags.split(",").map((tag) => tag.trim());
    } else if (Array.isArray(tags)) {
      tagsArray = tags;
    }
  }

  // Log files for debugging
  // console.log('Uploaded files for update:', req.files);

  // Prepare update data
  const updateData = { ...req.body };

  // Only update fields that are provided
  if (bookName !== undefined) updateData.bookName = bookName;
  if (synopsis !== undefined) updateData.synopsis = synopsis;
  if (categoryData) updateData.category = categoryData._id;
  if (categoryName) updateData.categoryName = categoryName;
  if (tagsArray.length > 0) updateData.tags = tagsArray;

  // Handle file uploads
  if (req.files?.bookCover) {
    updateData.bookCover = req.files.bookCover[0].location;
  }

  // Handle PDF file
  if (req.files?.pdfFile || totalPages !== undefined) {
    if (req.files?.pdfFile) {
      updateData.pdfFile = req.files.pdfFile[0].location;
    }
    if (totalPages !== undefined) {
      updateData.totalPages = totalPages;
    }
  }

  // Handle audio file
  if (req.files?.audioFile || duration !== undefined) {
    if (req.files?.audioFile) {
      updateData.audioFile = req.files.audioFile[0].location;
    }
    if (duration !== undefined) {
      updateData.duration = duration;
    }
  }

  const book = await BookService.updateBook(id, updateData, req.admin);
  res.status(200).json({ success: true, message: "Book updated successfully", data: book });
});

/** Delete Book */
exports.deleteBook = asyncHandler(async (req, res) => {
  await BookService.deleteBook(req.params.id, req.admin);
  res.status(200).json({ success: true, message: "Book deleted successfully" });
});
