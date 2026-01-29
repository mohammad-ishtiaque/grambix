const Ebook = require("./Ebook");
const { ApiError } = require("../../errors/errorHandler");
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const Book = require('../Book/Book');

/** Delete file helper */
const deleteFile = (filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    fs.unlinkSync(path.resolve(filePath));
  }
};

/**
 * Create ebook (Admin only)
 */
exports.createEbook = async (data, user) => {
  if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") throw new ApiError("Only admins or super admins can create ebooks", 403);

  const ebook = await Ebook.create({
    ...data,
    createdBy: user.id,
  });
  return ebook;
};

/**
 * Get all ebooks with search & pagination
 */


exports.getAllEbooks = async (query) => {
  const { search, categoryName, page = 1, limit = 1000 } = query;

  const filter = {};
  if (search) filter.bookName = { $regex: search, $options: "i" };
  if (categoryName) filter.categoryName = { $regex: `^${categoryName}$`, $options: "i" };

  const bookFilter = { ...filter, isEbook: true };

  const [ebooks, books] = await Promise.all([
    Ebook.find(filter)
      .populate("createdBy", "name email")
      .populate("category", "name")
      .sort({ createdAt: -1 })
      .lean(),
    Book.find(bookFilter)
      .populate("createdBy", "name email") // Book also references 'createdBy' as Admin usually
      .populate("category", "name")
      .sort({ createdAt: -1 })
      .lean()
  ]);

  let allItems = [...ebooks, ...books];

  // Sort combined results by createdAt desc
  allItems.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const total = allItems.length;

  if (page && limit) {
    const limitParsed = parseInt(limit);
    const pageParsed = parseInt(page);
    const skip = (pageParsed - 1) * limitParsed;
    const paginatedItems = allItems.slice(skip, skip + limitParsed);

    return {
      ebooks: paginatedItems,
      pagination: {
        total,
        page: pageParsed,
        pages: Math.ceil(total / limitParsed),
        limit: limitParsed,
      },
    };
  }

  return {
    ebooks: allItems,
    total,
  };
};

/**
 * Get single ebook
 */
exports.getEbookById = async (id) => {
  const ebook = await Ebook.findById(id)
    .populate("createdBy", "name email")
    .populate("category", "name");
  if (!ebook) throw new ApiError("Ebook not found", 404);
  return ebook;
};

/**
 * Update ebook (Admin only)
 */
exports.updateEbook = async (id, data, user) => {
  if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") throw new ApiError("Only admins or super admins can update ebooks", 403);

  const ebook = await Ebook.findById(id);
  if (!ebook) throw new ApiError("Ebook not found", 404);

  // Delete old files if new ones are uploaded
  if (data.bookCover && ebook.bookCover) deleteFile(ebook.bookCover);
  if (data.pdfFile && ebook.pdfFile) deleteFile(ebook.pdfFile);


  const updated = await Ebook.findByIdAndUpdate(
    id,
    { $set: data },
    { new: true, runValidators: false } // disable required validation for partial update
  );

  return updated;
};

/**
 * Delete ebook (Admin only)
*/

exports.deleteEbook = async (id, user) => {
  if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") throw new ApiError("Only admins or super admins can delete ebooks", 403);

  const ebook = await Ebook.findById(id);
  if (!ebook) throw new ApiError("Ebook not found", 404);

  // Delete files
  deleteFile(ebook.bookCover);
  deleteFile(ebook.pdfFile);

  await ebook.deleteOne();
  return true;
};

/** Increment View Count */
exports.incrementViewCount = async (id) => {
  await Ebook.findByIdAndUpdate(id, { $inc: { viewCount: 1 } });
};
