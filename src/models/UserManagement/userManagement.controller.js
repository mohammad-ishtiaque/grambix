const User = require("../User/User");
const asyncHandler = require("../../utils/asyncHandler");
const userService = require("../User/user.service");
const Book = require("../Book/Book");
const AudioBook = require("../AudioBook/AudioBook");
const Ebook = require("../Ebook/Ebook");

exports.getAllUsers = asyncHandler(async (req, res) => {
  //pagination , search by user name
  const { page = 1, limit = 10, searchTerm } = req.query;

  const query = {};

  if (searchTerm) {
    query.$or = [
      { firstName: { $regex: searchTerm, $options: "i" } },
      { lastName: { $regex: searchTerm, $options: "i" } }
    ];
  }

  const skip = (page - 1) * limit;

  const users = await User.find(query)
    .select("-password")
    .select("-role")
    .select("-verificationCode")
    .select("-passwordResetCode")
    .skip(skip)
    .limit(parseInt(limit))
    .sort({ createdAt: -1 });

  const totalUsersCount = await User.countDocuments(query);
  const totalPages = Math.ceil(totalUsersCount / limit);

  const total = await User.countDocuments();
  const blocked = await User.countDocuments({ isBlocked: true });
  const verified = await User.countDocuments({ isVerified: true });
  const unverified = await User.countDocuments({ isVerified: false });
  const totalBooks = await Book.countDocuments();
  const totalAudioBooks = await AudioBook.countDocuments();
  const totalEbooks = await Ebook.countDocuments();

  const sumOfBooks = totalBooks + totalAudioBooks + totalEbooks;

  res.json({
    success: true,
    meta: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: totalUsersCount,
      totalPages
    },
    users,
    total,
    blocked,
    verified,
    unverified,
    sumOfBooks
  });
});

exports.getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.query.id).select("-password").select("-role").select("-verificationCode").select("-passwordResetCode");
  if (!user) throw new ApiError("User not found", 404);
  res.json({ success: true, user });
});

exports.blockUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.query.id).select("-password").select("-role").select("-verificationCode").select("-passwordResetCode");
  if (!user) throw new ApiError("User not found", 404);
  user.isBlocked = true;
  await user.save();
  res.json({ success: true, user });
});

exports.unblockUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.query.id).select("-password").select("-role").select("-verificationCode").select("-passwordResetCode");
  if (!user) throw new ApiError("User not found", 404);
  user.isBlocked = false;
  await user.save();
  res.json({ success: true, user });
});




exports.getUserGrowth = async (req, res, next) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();

    // Mongo aggregation: group users by month
    const monthlyGrowth = await User.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(`${year}-01-01`),
            $lt: new Date(`${year + 1}-01-01`)
          }
        }
      },
      {
        $group: {
          _id: { $month: "$createdAt" },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    // Month names
    const monthNames = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];

    // Initialize with all months = 0
    const result = monthNames.map((m, i) => ({
      month: m,
      count: 0
    }));

    // Fill in actual counts
    monthlyGrowth.forEach(m => {
      result[m._id - 1].count = m.count;
    });

    res.json({
      year,
      monthlyGrowth: result,  // e.g. [{month: "Jan", count: 5}, ...]
      totalUsers: result.reduce((a, b) => a + b.count, 0)
    });

  } catch (err) {
    next(err);
  }
};