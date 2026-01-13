const BookCategory = require('./BookCategory');
const AudioBook = require('../AudioBook/AudioBook');
const Ebook = require('../Ebook/Ebook');
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
    const { type = 'all', page = 1, limit = 10, categoryId } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    //console.log(req.query);
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
    let totalAudioBooks = 0;
    let totalEbooks = 0;

    if (type === 'all' || type === 'audio') {
        [audioBooks, totalAudioBooks] = await Promise.all([
            AudioBook.find(baseQuery)
                .select(selectFields)
                .skip(skip)
                .limit(limit)
                .lean(),
            AudioBook.countDocuments(baseQuery)
        ]);
    }

    if (type === 'all' || type === 'ebook') {
        [ebooks, totalEbooks] = await Promise.all([
            Ebook.find(baseQuery)
                .select(selectFields)
                .skip(skip)
                .limit(limit)
                .lean(),
            Ebook.countDocuments(baseQuery)
        ]);
    }

    const totalBooks = totalAudioBooks + totalEbooks;
    const totalPages = Math.ceil(totalBooks / limit);

    res.json({
        success: true,
        data: {
            category: {
                _id: category._id,
                name: category.name,
                image: category.image
            },
            books: [...audioBooks, ...ebooks],
            pagination: {
                total: totalBooks,
                totalAudioBooks,
                totalEbooks,
                page: Number(page),
                totalPages,
                hasNextPage: page < totalPages,
                hasPreviousPage: page > 1
            }
        }
    });
});

module.exports = {
    getCategoriesWithCounts,
    getBooksByCategory
};
