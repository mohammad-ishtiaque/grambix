const BookCategory = require('./BookCategory');
const AudioBook = require('../AudioBook/AudioBook');
const Ebook = require('../Ebook/Ebook');
const Book = require('../Book/Book');
const asyncHandler = require('../../utils/asyncHandler');

// @desc    Get all categories with book counts
// @route   GET /api/categories
// @access  Public
const getCategoriesWithCounts = asyncHandler(async (req, res) => {
    // Get all categories
    const categories = await BookCategory.find().lean();

    // Get counts for each category in parallel
    const categoriesWithCounts = await Promise.all(
        categories.map(async (category) => {
            const [audioBookCount, ebookCount] = await Promise.all([
                AudioBook.countDocuments({ category: category._id }),
                Ebook.countDocuments({ category: category._id })
            ]);

            return {
                ...category,
                totalBooks: audioBookCount + ebookCount,
                audioBookCount,
                ebookCount
            };
        })
    );
    res.json({
        success: true,
        data: categoriesWithCounts
    });
});

// @desc    Get books by category
// @route   GET /api/categories/books/:categoryId
// @access  Public
const getBooksByCategory = asyncHandler(async (req, res) => {
    const { type = 'all', page = 1, limit = 1000, categoryId } = req.query;

    // Check if category exists
    const category = await BookCategory.findById(categoryId);
    if (!category) {
        return res.status(404).json({
            success: false,
            message: 'Category not found'
        });
    }

    // Common query for both types
    const baseQuery = { category: categoryId };

    // Select fields
    const selectFields = 'bookCover bookName synopsis';

    // Get books based on type
    let audioBooks = [];
    let ebooks = [];
    let genericBooks = [];

    let totalAudioBooks = 0;
    let totalEbooks = 0;
    let totalGenericBooks = 0;

    const promises = [];

    // AudioBooks
    if (type === 'all' || type === 'audio' || type === 'book') {
        const p = Promise.all([
            AudioBook.find(baseQuery).select(selectFields).sort({ createdAt: -1 }).lean(),
            AudioBook.countDocuments(baseQuery)
        ]).then(([docs, count]) => {
            audioBooks = docs;
            totalAudioBooks = count;
        });
        promises.push(p);
    }

    // Ebooks
    if (type === 'all' || type === 'ebook' || type === 'book') {
        const p = Promise.all([
            Ebook.find(baseQuery).select(selectFields).sort({ createdAt: -1 }).lean(),
            Ebook.countDocuments(baseQuery)
        ]).then(([docs, count]) => {
            ebooks = docs;
            totalEbooks = count;
        });
        promises.push(p);
    }

    // Generic Books (Book Model)
    if (type === 'all' || type === 'book') {
        const p = Promise.all([
            Book.find(baseQuery).select(selectFields).sort({ createdAt: -1 }).lean(),
            Book.countDocuments(baseQuery)
        ]).then(([docs, count]) => {
            genericBooks = docs;
            totalGenericBooks = count;
        });
        promises.push(p);
    }

    await Promise.all(promises);

    let allBooks = [...audioBooks, ...ebooks, ...genericBooks];

    // Sort combined results by createdAt desc (if available) or insertion order
    allBooks.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
        const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
        return dateB - dateA;
    });

    const totalBooks = allBooks.length;
    let paginatedBooks = allBooks;
    let pageParsed = 1;
    let limitParsed = totalBooks > 0 ? totalBooks : 1;
    let totalPages = 1;

    if (page && limit) {
        pageParsed = parseInt(page);
        limitParsed = parseInt(limit);
        const skip = (pageParsed - 1) * limitParsed;
        totalPages = Math.ceil(totalBooks / limitParsed);

        paginatedBooks = allBooks.slice(skip, skip + limitParsed);
    }

    const paginationInfo = {
        total: totalBooks,
        totalAudioBooks,
        totalEbooks,
        page: pageParsed,
        totalPages,
        hasNextPage: pageParsed < totalPages,
        hasPreviousPage: pageParsed > 1
    };

    res.json({
        success: true,
        data: {
            category: {
                _id: category._id,
                name: category.name,
                image: category.image
            },
            books: paginatedBooks,
            pagination: paginationInfo
        }
    });
});

module.exports = {
    getCategoriesWithCounts,
    getBooksByCategory
};
