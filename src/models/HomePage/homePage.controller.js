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
const UserProgress = require('../UserProgress/UserProgress');

// Helper to get personalized recommendations
const getPersonalizedRecommendations = async (userId) => {
    try {
        // 1. Get user's recent history
        const userHistory = await UserProgress.find({ userId })
            .sort({ lastReadAt: -1, lastListenAt: -1 })
            .limit(20)
            .populate('contentId');

        // 2. Extract unique categories and tags from history
        const interestedCategoryIds = new Set();
        const interestedTags = new Set();
        const seenContentIds = new Set();

        userHistory.forEach(history => {
            if (history.contentId) {
                seenContentIds.add(history.contentId._id.toString());

                // Collect Categories
                if (history.contentId.category) {
                    interestedCategoryIds.add(history.contentId.category.toString());
                }

                // Collect Tags
                if (history.contentId.tags && Array.isArray(history.contentId.tags)) {
                    history.contentId.tags.forEach(tag => interestedTags.add(tag));
                }
            }
        });

        const categoryIds = Array.from(interestedCategoryIds);
        const tags = Array.from(interestedTags);

        // 3. If no history, return empty (will fallback to general recommended)
        if (categoryIds.length === 0 && tags.length === 0) return [];

        // 4. Query for similar content (match category OR tags)
        const query = {
            $or: [
                { category: { $in: categoryIds } },
                { tags: { $in: tags } }
            ],
            _id: { $nin: Array.from(seenContentIds) }
        };

        const [audioBooks, ebooks, books] = await Promise.all([
            AudioBook.find(query).limit(10).lean(),
            Ebook.find(query).limit(10).lean(),
            Book.find(query).limit(10).lean()
        ]);

        // 5. Merge and shuffle/sort
        const combined = [
            ...audioBooks.map(i => ({ ...i, isAudioBook: true })),
            ...ebooks.map(i => ({ ...i, isEbook: true })),
            ...books.map(i => ({ ...i, isBook: true }))
        ];

        // Randomize for variety
        return combined.sort(() => 0.5 - Math.random()).slice(0, 10);

    } catch (error) {
        // console.error("Error generating recommendations:", error);
        return [];
    }
};

// @desc    Get home page data
// @route   GET /api/home
// @access  Public (but needs user ID for 'For You')
const getHomePageData = asyncHandler(async (req, res) => {
    const userId = req.user?._id || req.query.userId; // Support auth middleware or query param for now

    // Run personalized query if user exists
    const forYouPromise = userId ? getPersonalizedRecommendations(userId) : Promise.resolve([]);

    // Run all other queries in parallel
    const [
        forYouData,
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
        forYouPromise,

        // Recommended (Tagged 'recommended' OR popular)
        AudioBook.find({ $or: [{ tags: 'recommended' }, { viewCount: { $gt: 100 } }] }).sort({ viewCount: -1 }).limit(5).select(commonSelectFields).lean(),
        AudioBook.find().sort({ createdAt: -1 }).limit(5).select(commonSelectFields).lean(),
        AudioBook.find().sort({ viewCount: -1 }).limit(5).select(commonSelectFields).lean(),

        // Ebooks
        Ebook.find({ $or: [{ tags: 'recommended' }, { viewCount: { $gt: 100 } }] }).sort({ viewCount: -1 }).limit(5).select(commonSelectFields).lean(),
        Ebook.find().sort({ createdAt: -1 }).limit(5).select(commonSelectFields).lean(),
        Ebook.find().sort({ viewCount: -1 }).limit(5).select(commonSelectFields).lean(),

        // Books
        Book.find({ $or: [{ tags: 'recommended' }, { viewCount: { $gt: 100 } }] }).sort({ viewCount: -1 }).limit(5).select(commonSelectFields).lean(),
        Book.find().sort({ createdAt: -1 }).limit(5).select(commonSelectFields).lean(),
        Book.find().sort({ viewCount: -1 }).limit(5).select(commonSelectFields).lean(),
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
            forYou: forYouData,
            recommended: [
                ...addTypeFlags(recommendedAudioBooks, true, false, false),
                ...addTypeFlags(recommendedEbooks, false, true, false),
                ...addTypeFlags(recommendedBooks, false, false, true)
            ].sort(() => 0.5 - Math.random()).slice(0, 10), // Shuffle and limit

            newReleases: [
                ...addTypeFlags(newAudioBooks, true, false, false),
                ...addTypeFlags(newEbooks, false, true, false),
                ...addTypeFlags(newBooks, false, false, true)
            ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 10),

            trending: [
                ...addTypeFlags(trendingAudioBooks, true, false, false),
                ...addTypeFlags(trendingEbooks, false, true, false),
                ...addTypeFlags(trendingBooks, false, false, true)
            ].sort((a, b) => b.viewCount - a.viewCount).slice(0, 10)
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