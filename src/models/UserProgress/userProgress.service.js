const UserProgress = require('./UserProgress');
const UserActivity = require('../UserActivity/UserActivity');
const asyncHandler = require('../../utils/asyncHandler');
const { ApiError } = require('../../errors/errorHandler');
const AudioBook = require('../AudioBook/AudioBook');
const Book = require('../Book/Book');
const Ebook = require('../Ebook/Ebook');
const mongoose = require('mongoose');

const mapContentTypeToModel = (type) => {
  switch (type) {
    case 'ebook': return 'Ebook';
    case 'audiobook': return 'AudioBook';
    case 'book': return 'Book';
    default: return null;
  }
};

class UserProgressService {
  // Update or create user progress
  static updateProgress = async (userId, contentId, contentType, progressData = {}) => {
    const {
      progress,
      currentPage,
      totalPages,
      currentTime,
      totalDuration,
      isCompleted = false,
      bookmarked
    } = progressData;

    // Validate contentType
    if (!['ebook', 'audiobook', 'book'].includes(contentType)) {
      throw new ApiError('Invalid contentType. Allowed: ebook, audiobook, book', 400);
    }

    // Ensure at least one updatable field is provided
    const hasAnyField = [progress, currentPage, totalPages, currentTime, totalDuration, isCompleted, bookmarked]
      .some(value => value !== undefined);
    if (!hasAnyField) {
      throw new ApiError('No progress fields provided to update', 400);
    }

    // Find existing progress or create new one
    let userProgress = await UserProgress.findOne({
      userId,
      contentId,
      contentType
    });

    if (!userProgress) {
      const contentModel = mapContentTypeToModel(contentType);
      if (!contentModel) {
        throw new ApiError('Invalid contentType. Allowed: ebook, audiobook, book', 400);
      }

      userProgress = new UserProgress({
        userId,
        contentId,
        contentType,
        contentModel,     // <- set this so refPath works
        startedAt: new Date()
      });
    }

    // Update progress fields
    if (progress !== undefined) userProgress.progress = progress;
    if (currentPage !== undefined) userProgress.currentPage = currentPage;
    if (totalPages !== undefined) userProgress.totalPages = totalPages;
    if (currentTime !== undefined) userProgress.currentTime = currentTime;
    if (totalDuration !== undefined) userProgress.totalDuration = totalDuration;
    if (isCompleted !== undefined) userProgress.isCompleted = isCompleted;
    if (bookmarked !== undefined) userProgress.bookmarked = bookmarked;

    // Update timestamps based on which fields were updated
    // For 'book' type, we can track BOTH reading and listening separately
    if (contentType === 'book') {
      // Update reading timestamp if page-related fields were updated
      if (currentPage !== undefined || totalPages !== undefined) {
        userProgress.lastReadAt = new Date();
      }
      // Update listening timestamp if time-related fields were updated
      if (currentTime !== undefined || totalDuration !== undefined) {
        userProgress.lastListenAt = new Date();
      }
    } else if (contentType === 'ebook') {
      userProgress.lastReadAt = new Date();
    } else if (contentType === 'audiobook') {
      userProgress.lastListenAt = new Date();
    }

    await userProgress.save();

    // Update daily activity
    await this.updateDailyActivity(userId, contentType, progressData);

    return userProgress;
  };

  // Get user's continue reading/listening items
  static getContinueItems = async (userId, limit = 10) => {
    const continueReading = await UserProgress.find({
      userId,
      contentType: { $in: ['ebook', 'book'] },
      isCompleted: false
    })
      .sort({ lastReadAt: -1 })
      .limit(limit)
      .populate('contentId', 'bookCover bookName categoryName synopsis isAudioBook isEbook isBook')
      .lean();

    const continueListening = await UserProgress.find({
      userId,
      contentType: { $in: ['audiobook', 'book'] },
      isCompleted: false
    })
      .sort({ lastListenAt: -1 })
      .limit(limit)
      .populate('contentId', 'bookCover bookName categoryName synopsis isAudioBook isEbook isBook')
      .lean();


    return {
      continueReading,
      continueListening
    };
  };

  // Get user's reading/listening history
  static getHistory = async (userId, contentType, page = 1, limit = 20) => {
    // Ensure page is at least 1
    page = Math.max(1, parseInt(page) || 1);
    limit = Math.max(1, parseInt(limit) || 20);
    const skip = (page - 1) * limit;

    const history = await UserProgress.find({
      userId,
      contentType
    })
      .sort({
        [contentType === 'audiobook' ? 'lastListenAt' : 'lastReadAt']: -1
      })
      .skip(skip)
      .limit(limit)
      .populate('contentId', 'bookName bookCover categoryName synopsis isAudioBook isEbook isBook');

    const total = await UserProgress.countDocuments({
      userId,
      contentType
    });

    return {
      history,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  };

  // Get user's bookmarked items
  static getBookmarks = async (userId, page = 1, limit = 20) => {
    // Ensure page is at least 1
    page = Math.max(1, parseInt(page) || 1);
    limit = Math.max(1, parseInt(limit) || 20);
    const skip = (page - 1) * limit;

    const bookmarks = await UserProgress.find({
      userId,
      bookmarked: true
    })
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('contentId', 'bookName bookCover categoryName synopsis isAudioBook isEbook isBook');

    const total = await UserProgress.countDocuments({
      userId,
      bookmarked: true
    });

    return {
      bookmarks,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  };

  // Update daily activity tracking
  static updateDailyActivity = async (userId, contentType, progressData) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let userActivity = await UserActivity.findOne({
      userId,
      date: today
    });

    if (!userActivity) {
      userActivity = new UserActivity({
        userId,
        date: today
      });
    }

    if (contentType === 'ebook' || contentType === 'book') {
      if (progressData.currentPage && progressData.currentPage > 0) {
        userActivity.pagesRead += 1;
      }
      userActivity.readingMinutes += 1; // Assuming 1 minute per update
      userActivity.ebooksRead = 1; // Count as 1 session
    } else if (contentType === 'audiobook') {
      if (progressData.currentTime && progressData.currentTime > 0) {
        userActivity.timeListened += 30; // Assuming 30 seconds per update
      }
      userActivity.listeningMinutes += 1;
      userActivity.audiobooksListened = 1;
    }

    await userActivity.save();
  };

  // Get user's weekly/monthly activity (calculated from UserProgress)
  static getActivityStats = async (userId, period = 'week') => {
    const now = new Date();
    let startDate;

    if (period === 'week') {
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
    } else if (period === 'month') {
      startDate = new Date(now);
      startDate.setMonth(now.getMonth() - 1);
    } else {
      // Default to week if invalid period
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
    }

    // Aggregate reading activity from UserProgress
    const readingStats = await UserProgress.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          contentType: { $in: ['ebook', 'book'] },
          lastReadAt: { $gte: startDate, $lte: now }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$lastReadAt' }
          },
          ebooksRead: { $sum: 1 },
          totalPages: { $sum: { $ifNull: ['$currentPage', 0] } }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Aggregate listening activity from UserProgress
    const listeningStats = await UserProgress.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          contentType: { $in: ['audiobook', 'book'] },
          lastListenAt: { $gte: startDate, $lte: now }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$lastListenAt' }
          },
          audiobooksListened: { $sum: 1 },
          totalTime: { $sum: { $ifNull: ['$currentTime', 0] } }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Calculate totals
    const totals = {
      ebooksRead: readingStats.reduce((sum, stat) => sum + stat.ebooksRead, 0),
      pagesRead: readingStats.reduce((sum, stat) => sum + stat.totalPages, 0),
      audiobooksListened: listeningStats.reduce((sum, stat) => sum + stat.audiobooksListened, 0),
      timeListened: listeningStats.reduce((sum, stat) => sum + stat.totalTime, 0),
      // Estimate minutes (very rough - you may want to track this differently)
      readingMinutes: readingStats.reduce((sum, stat) => sum + stat.totalPages, 0) * 2, // ~2 min per page
      listeningMinutes: Math.round(listeningStats.reduce((sum, stat) => sum + stat.totalTime, 0) / 60)
    };

    // Merge daily data for charts
    const dailyMap = new Map();

    readingStats.forEach(stat => {
      dailyMap.set(stat._id, {
        date: stat._id,
        ebooks: stat.ebooksRead,
        pagesRead: stat.totalPages,
        reading: stat.totalPages * 2, // Estimated minutes
        audiobooks: 0,
        listening: 0,
        timeListened: 0
      });
    });

    listeningStats.forEach(stat => {
      const existing = dailyMap.get(stat._id) || {
        date: stat._id,
        ebooks: 0,
        pagesRead: 0,
        reading: 0,
        audiobooks: 0,
        listening: 0,
        timeListened: 0
      };
      existing.audiobooks = stat.audiobooksListened;
      existing.timeListened = stat.totalTime;
      existing.listening = Math.round(stat.totalTime / 60);
      dailyMap.set(stat._id, existing);
    });

    const dailyBreakdown = Array.from(dailyMap.values()).sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    return {
      period,
      totals,
      dailyBreakdown
    };
  };

  // Get user's progress for a specific content
  static getContentProgress = async (userId, contentId, contentType) => {
    const progress = await UserProgress.findOne({
      userId,
      contentId,
      contentType
    });

    return progress;
  };

  // Toggle bookmark status
  static toggleBookmark = async (userId, contentId) => {
    const book = await Ebook.findOne(contentId) || await AudioBook.findOne(contentId) || await Book.findOne(contentId);

    const progress = await UserProgress.findOne({
      userId,
      contentId,
    });

    if (!progress) {
      throw new Error('Progress not found. Start reading/listening first.');
    }

    progress.bookmarked = !progress.bookmarked;
    await progress.save();

    return progress;
  };
}

module.exports = UserProgressService;