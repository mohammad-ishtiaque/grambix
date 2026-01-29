const AudioBook = require('./AudioBook');
const { ApiError } = require('../../errors/errorHandler');
const fs = require('fs');
const path = require('path');
const Book = require('../Book/Book');

const deleteFile = (filePath) => {
  if (filePath && fs.existsSync(path.resolve(filePath))) {
    fs.unlinkSync(path.resolve(filePath));
  }
};

exports.createAudioBook = async (data, user) => {
  if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
    throw new ApiError('Only admins or super admins can create audiobooks', 403);
  }

  const audioBook = await AudioBook.create({
    ...data,
    createdBy: user.id,  // add if your schema has createdBy, else remove
  });
  return audioBook;
};



exports.getAllAudioBooks = async (query) => {
  const { limit, page, search, categoryName } = query;

  const filter = {};
  if (search) filter.bookName = { $regex: search, $options: "i" };
  if (categoryName) filter.categoryName = { $regex: `^${categoryName}$`, $options: "i" };

  // Book specific filter
  const bookFilter = { ...filter, isAudioBook: true, isBook: true };

  const [audioBooks, books] = await Promise.all([
    AudioBook.find(filter).populate('category', 'name').sort({ createdAt: -1 }).lean(),
    Book.find(bookFilter).populate('category', 'name').sort({ createdAt: -1 }).lean()
  ]);

  let allItems = [...audioBooks, ...books];

  // Sort combined results by createdAt desc
  allItems.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const total = allItems.length;

  if (page && limit) {
    const limitParsed = parseInt(limit);
    const pageParsed = parseInt(page);
    const skip = (pageParsed - 1) * limitParsed;
    const paginatedItems = allItems.slice(skip, skip + limitParsed);

    return {
      audioBooks: paginatedItems,
      pagination: {
        total,
        page: pageParsed,
        pages: Math.ceil(total / limitParsed),
      },
    };
  }

  return {
    audioBooks: allItems,
    total,
  };
};

exports.getAudioBookById = async (id) => {
  const audioBook = await AudioBook.findById(id).populate('category', 'name');
  if (!audioBook) throw new ApiError('AudioBook not found', 404);
  return audioBook;
};

exports.updateAudioBook = async (id, data, user) => {
  if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
    throw new ApiError('Only admins or super admins can update audiobooks', 403);
  }

  const audioBook = await AudioBook.findById(id);
  if (!audioBook) throw new ApiError('AudioBook not found', 404);

  // If updating files stored locally, delete old ones before updating
  if (data.bookCover && audioBook.bookCover) deleteFile(audioBook.bookCover);
  if (data.audioFile && audioBook.audioFile) deleteFile(audioBook.audioFile);

  const updated = await AudioBook.findByIdAndUpdate(
    id,
    { $set: data },
    { new: true, runValidators: false } // disable required validation for partial update
  );

  return updated;
};

exports.deleteAudioBook = async (id, user) => {
  if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
    throw new ApiError('Only admins or super admins can delete audiobooks', 403);
  }

  const audioBook = await AudioBook.findByIdAndDelete(id);
  if (!audioBook) throw new ApiError('AudioBook not found', 404);

  deleteFile(audioBook.bookCover);
  deleteFile(audioBook.audioFile);

  return audioBook;
};

exports.incrementViewCount = async (id) => {
  await AudioBook.findByIdAndUpdate(id, { $inc: { viewCount: 1 } });
};
