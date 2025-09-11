const asyncHandler = require("../../utils/asyncHandler");
const BookService = require("./book.service");
const BookCategory = require("../BookCategory/BookCategory");
const { ApiError } = require("../../errors/errorHandler");

/** Create Book */
exports.createBook = asyncHandler(async (req, res) => {
  const { bookName, synopsis, totalPages, duration, tags } = req.body;

  const category = await BookCategory.findById(req.body.category);
  if (!category) throw new ApiError("Category not found", 404);
  const categoryName = category.name;

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
    bookCover: req.files?.bookCover?.[0]?.location  || null,
    tags: tagsArray,
    pdfFile: req.files?.pdfFile?.[0]?.location  || null,
    totalPages: totalPages || null,
    audioFile: req.files?.audioFile?.[0]?.location  || null,
    duration: duration || null,
  };

  const book = await BookService.createBook(data, req.admin);
  res.status(201).json({ success: true, message: "Book created successfully", data: book });
});

/** Get All Books */
exports.getAllBooks = asyncHandler(async (req, res) => {
  const result = await BookService.getAllBooks(req.query);
  res.status(200).json({ success: true, ...result });
});

/** Get Book by ID */
exports.getBookById = asyncHandler(async (req, res) => {
  const book = await BookService.getBookById(req.params.id);
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
    const categoryDoc = await BookCategory.findById(category);
    if (!categoryDoc) throw new ApiError("Category not found", 404);
    categoryData = categoryDoc._id;
    categoryName = categoryDoc.name;
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
  if (categoryData) updateData.category = categoryData;
  if (categoryName) updateData.categoryName = categoryName;
  if (tagsArray.length > 0) updateData.tags = tagsArray;
  
  // Handle file uploads
  if (req.files?.bookCover) {
    updateData.bookCover = req.files.bookCover[0].location ;
  }
  
  // Handle PDF file
  if (req.files?.pdfFile || totalPages !== undefined) {
    if (req.files?.pdfFile) {
      updateData.pdfFile = req.files.pdfFile[0].location ;
    }
    if (totalPages !== undefined) {
      updateData.totalPages = totalPages;
    }
  }
  
  // Handle audio file
  if (req.files?.audioFile || duration !== undefined) {
    if (req.files?.audioFile) {
      updateData.audioFile = req.files.audioFile[0].location ;
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
