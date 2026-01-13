const UserProgressService = require('./userProgress.service');
const sendResponse = require('../../utils/sendResponse');

class UserProgressController {
  // Update reading/listening progress
  static updateProgress = async (req, res) => {
    const { id: userId } = req.user;
    const { contentId, contentType } = req.params;
    const progressData = req.body;
    // console.log(progressData)

    const result = await UserProgressService.updateProgress(
      userId,
      contentId,
      contentType,
      progressData
    );

    console.log(result)

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Progress updated successfully',
      data: result
    });
  };

  // Get continue reading/listening items
  static getContinueItems = async (req, res) => {
    const { id: userId } = req.user;
    const { limit = 10 } = req.query;

    const result = await UserProgressService.getContinueItems(userId, parseInt(limit));
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Continue items retrieved successfully',
      data: result
    });
  };

  // Get user's reading/listening history
  static getHistory = async (req, res) => {
    const { id: userId } = req.user;
    const { page = 1, limit = 20, contentType } = req.query;

    const result = await UserProgressService.getHistory(
      userId,
      contentType,
      parseInt(page),
      parseInt(limit)
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'History retrieved successfully',
      data: result
    });
  };

  // Get user's bookmarked items
  static getBookmarks = async (req, res) => {
    const { id: userId } = req.user;
    console.log(userId)
    const { page = 1, limit = 20 } = req.query;

    const result = await UserProgressService.getBookmarks(
      userId,
      parseInt(page),
      parseInt(limit)
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Bookmarks retrieved successfully',
      data: result
    });
  };

  // Get user's activity statistics
  static getActivityStats = async (req, res) => {
    const { id: userId } = req.user;
    const { period = 'week' } = req.query;

    const result = await UserProgressService.getActivityStats(userId, period);
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Activity stats retrieved successfully',
      data: result
    });
  };

  // Get progress for specific content
  static getContentProgress = async (req, res) => {
    const { id: userId } = req.user;
    const { contentId, contentType } = req.query;

    const result = await UserProgressService.getContentProgress(
      userId,
      contentId,
      contentType
    );

    if (!result) {
      return sendResponse(res, {
        statusCode: 404,
        success: false,
        message: 'Progress not found',
        data: null
      });
    }

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Progress retrieved successfully',
      data: result
    });
  };

  // Toggle bookmark status
  static toggleBookmark = async (req, res) => {
    const { id: userId } = req.user;
    const { contentId } = req.query;

    const result = await UserProgressService.toggleBookmark(
      userId,
      contentId
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Bookmark status updated successfully',
      data: result
    });
  };

  // Get user's dashboard data (continue items + activity stats)
  static getDashboard = async (req, res) => {
    const { id: userId } = req.user;
    const { period = 'week' } = req.query;

    try {
      // Get both continue items and activity stats in parallel
      const [continueItems, activityStats] = await Promise.all([
        UserProgressService.getContinueItems(userId, 10),
        UserProgressService.getActivityStats(userId, period)
      ]);

      const dashboardData = {
        continueItems,
        activityStats,
        summary: {
          totalReadingTime: activityStats.totals.readingMinutes,
          totalListeningTime: activityStats.totals.listeningMinutes,
          totalPagesRead: activityStats.totals.pagesRead,
          totalTimeListened: activityStats.totals.timeListened,
          activeBooks: continueItems.continueReading.length + continueItems.continueListening.length
        }
      };

      sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'Dashboard data retrieved successfully',
        data: dashboardData
      });
    } catch (error) {
      sendResponse(res, {
        statusCode: 500,
        success: false,
        message: 'Error retrieving dashboard data',
        data: null
      });
    }
  };
}

module.exports = UserProgressController; 