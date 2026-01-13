const AudioBook = require('../AudioBook/AudioBook');
const Ebook = require('../Ebook/Ebook');
const asyncHandler = require('../../utils/asyncHandler');
const { ApiError } = require('../../errors/errorHandler');
const Book = require('../Book/Book');


// Common fields to select for both AudioBooks and Ebooks
const commonSelectFields = 'bookCover bookName categoryName synopsis';

// @desc    Get home page data
// @route   GET /api/home
// @access  Public
const getHomePageData = asyncHandler(async (req, res) => {
    // Run all queries in parallel for better performance
    const [
        recommendedAudioBooks,
        newAudioBooks,
        trendingAudioBooks,
        recommendedEbooks,
        newEbooks,
        trendingEbooks,
        recommendedBooks,
        newBooks,
        trendingBooks
    ] = await Promise.all([
        // AudioBooks
        AudioBook.find({ tags: { $in: ['recommended'] } })
            .sort({ createdAt: -1 })
            .limit(5)
            .select(commonSelectFields)
            .lean(),

        AudioBook.find({
            createdAt: {
                $gte: new Date(new Date().setDate(new Date().getDate() - 30))
            }
        })
            .sort({ createdAt: -1 })
            .limit(5)
            .select(commonSelectFields)
            .lean(),

        AudioBook.find()
            .sort({ viewCount: -1 })
            .limit(5)
            .select(commonSelectFields)
            .lean(),



        // Ebooks
        Ebook.find({ tags: { $in: ['recommended'] } })
            .sort({ createdAt: -1 })
            .limit(5)
            .select(commonSelectFields)
            .lean(),

        Ebook.find({
            createdAt: {
                $gte: new Date(new Date().setDate(new Date().getDate() - 30))
            }
        })
            .sort({ createdAt: -1 })
            .limit(5)
            .select(commonSelectFields)
            .lean(),

        Ebook.find()
            .sort({ viewCount: -1 })
            .limit(5)
            .select(commonSelectFields)
            .lean(),



        // Books
        Book.find({ tags: { $in: ['recommended'] } })
            .sort({ createdAt: -1 })
            .limit(5)
            .select(commonSelectFields)
            .lean(),

        Book.find({
            createdAt: {
                $gte: new Date(new Date().setDate(new Date().getDate() - 30))
            }
        })
            .sort({ createdAt: -1 })
            .limit(5)
            .select(commonSelectFields)
            .lean(),

        Book.find()
            .sort({ viewCount: -1 })
            .limit(5)
            .select(commonSelectFields)
            .lean(),

    ]);

    // Add type flags to each item
    const addTypeFlags = (items, isAudioBook, isEbook, isBook) => {
        return items.map(item => ({
            ...item,
            isAudioBook,
            isEbook,
            isBook
        }));
    };

    // Structure the response
    res.json({
        success: true,
        data: {
            recommended: [
                ...addTypeFlags(recommendedAudioBooks, true, false, false),
                ...addTypeFlags(recommendedEbooks, false, true, false),
                ...addTypeFlags(recommendedBooks, false, false, true)
            ],
            newReleases: [
                ...addTypeFlags(newAudioBooks, true, false, false),
                ...addTypeFlags(newEbooks, false, true, false),
                ...addTypeFlags(newBooks, false, false, true)
            ],
            trending: [
                ...addTypeFlags(trendingAudioBooks, true, false, false),
                ...addTypeFlags(trendingEbooks, false, true, false),
                ...addTypeFlags(trendingBooks, false, false, true)
            ]
        }
    });
});

const getBooksById = asyncHandler(async (req, res) => {
    const { id } = req.query;
    const book = await Book.findById(id).lean();
    const audioBook = await AudioBook.findById(id).lean();
    const ebook = await Ebook.findById(id).lean();

    if (!book && !audioBook && !ebook) throw new ApiError("Book not found", 404);
    res.json({ success: true, data: book || audioBook || ebook });
});

const saveUnsaveBooks = asyncHandler(async (req, res) => {
    const { id } = req.query;
    const [book, audioBook, ebook] = await Promise.all([
        Book.findById(id),
        AudioBook.findById(id),
        Ebook.findById(id)
    ]);

    if (!book && !audioBook && !ebook) {
        throw new ApiError("Book not found", 404);
    }

    if (book) {
        book.isSaved = !book.isSaved;
        await book.save();
    }

    if (audioBook) {
        audioBook.isSaved = !audioBook.isSaved;
        await audioBook.save();
    }

    if (ebook) {
        ebook.isSaved = !ebook.isSaved;
        await ebook.save();
    }

    res.json({ success: true, data: book || audioBook || ebook });
});

const getSavedBooks = asyncHandler(async (req, res) => {
    const books = await Book.find({ isSaved: true }).lean();
    const audioBooks = await AudioBook.find({ isSaved: true }).lean();
    const ebooks = await Ebook.find({ isSaved: true }).lean();
    // console.log(books);
    // console.log(audioBooks);
    // console.log(ebooks);

    const allBooks = [
        ...books,
        ...audioBooks,
        ...ebooks
    ];

    res.json({ success: true, data: allBooks });
});

module.exports = {
    getHomePageData,
    getBooksById,
    saveUnsaveBooks,
    getSavedBooks
};