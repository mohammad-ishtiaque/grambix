const Book = require("./Book");
const { ApiError } = require("../../errors/errorHandler");
const fs = require("fs");
const path = require("path");

/** File Delete Helper */
const deleteFile = (filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    fs.unlinkSync(path.resolve(filePath));
  }
};

/** Create Book (supports ebook, audiobook, or both) */
exports.createBook = async (data, user) => {
  if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")
    throw new ApiError("Only admins or super admins can create books", 403);

  const book = await Book.create({
    ...data,
    createdBy: user.id,
  });

  return book;
};

/** Get All Books (search + filter + pagination) */
exports.getAllBooks = async (query) => {
  const { search, categoryName, page = 1, limit = 1000 } = query;
  const filter = {};

  if (search) filter.bookName = { $regex: search, $options: "i" };
  if (categoryName) filter.categoryName = { $regex: `^${categoryName}$`, $options: "i" };

  let booksQuery = Book.find(filter)
    .populate("createdBy", "name email")
    .populate("category", "name")
    .sort({ createdAt: -1 });

  const total = await Book.countDocuments(filter);

  if (page && limit) {
    const skip = (page - 1) * limit;
    booksQuery = booksQuery.skip(skip).limit(parseInt(limit));

    const books = await booksQuery;

    return {
      books,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        limit: parseInt(limit),
      },
    };
  }

  const books = await booksQuery;
  return {
    books,
    total,
  };
};

/** Get Books by Category ID with Pagination */
exports.getBooksByCategoryId = async (categoryId, query) => {
  const { page, limit } = query;
  const filter = { category: categoryId };

  let booksQuery = Book.find(filter)
    .populate("createdBy", "name email")
    .populate("category", "name")
    .sort({ createdAt: -1 });

  const total = await Book.countDocuments(filter);

  if (page && limit) {
    const skip = (page - 1) * limit;
    booksQuery = booksQuery.skip(skip).limit(parseInt(limit));

    const books = await booksQuery;

    return {
      books,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
      },
    };
  }

  const books = await booksQuery;
  return {
    books,
    total,
  };
};

/** Get Book by ID */
exports.getBookById = async (id) => {
  const book = await Book.findById(id)
    .populate("createdBy", "name email")
    .populate("category", "name");
  if (!book) throw new ApiError("Book not found", 404);
  return book;
};

/** Update Book */
exports.updateBook = async (id, data, user) => {
  if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")
    throw new ApiError("Only admins or super admins can update books", 403);

  const book = await Book.findById(id);
  if (!book) throw new ApiError("Book not found", 404);

  // Delete old files if new ones uploaded
  if (data.bookCover && book.bookCover) deleteFile(book.bookCover);
  if (data.ebook?.pdfFile && book.ebook?.pdfFile) deleteFile(book.ebook.pdfFile);
  if (data.audiobook?.audioFile && book.audiobook?.audioFile) deleteFile(book.audiobook.audioFile);

  const updated = await Book.findByIdAndUpdate(
    id,
    { $set: data },
    { new: true, runValidators: false }
  );

  return updated;
};

/** Delete Book */
exports.deleteBook = async (id, user) => {
  if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")
    throw new ApiError("Only admins or super admins can delete books", 403);

  const book = await Book.findById(id);
  if (!book) throw new ApiError("Book not found", 404);

  // Delete files
  deleteFile(book.bookCover);
  deleteFile(book.ebook?.pdfFile);
  deleteFile(book.audiobook?.audioFile);

  await book.deleteOne();
  return true;
};

/** Increment View Count */
exports.incrementViewCount = async (id) => {
  await Book.findByIdAndUpdate(id, { $inc: { viewCount: 1 } });
};