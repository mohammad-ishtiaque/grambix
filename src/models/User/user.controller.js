const asyncHandler = require("../../utils/asyncHandler");
const userService = require("./user.service");
const Book = require("../Book/Book");
const Ebook = require("../Ebook/Ebook");
const AudioBook = require("../AudioBook/AudioBook");
const { ApiError } = require("../../errors/errorHandler");

exports.getUserProfile = asyncHandler(async (req, res) => {
  const user = await userService.getUserById(req.user._id || req.user.id);
  res.json({ success: true, user });
});

exports.updateUserProfile = asyncHandler(async (req, res) => {
  const updatePayload = {
    firstName: req.body?.firstName,
    lastName: req.body?.lastName,
    phone: req.body?.phone,
    profilePicture: req.body?.profilePicture || req.file?.location, // will store file path if uploaded
  };

  // console.log(updatePayload);
  const updatedUser = await userService.updateUserProfile(
    req.user._id || req.user.id,
    updatePayload
  );

  res.json({ success: true, message: "Profile updated successfully", data: updatedUser });
});

exports.changeUserPassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;

  await userService.changeUserPassword(
    req.user._id || req.user.id,
    currentPassword,
    newPassword,
    confirmPassword
  );

  res.json({ success: true, message: "Password updated successfully" });
});


exports.toggleSaveBook = asyncHandler(async (req, res) => {
  const { id } = req.query;
  if (!id) throw new ApiError("Book ID is required", 400);

  let contentType = 'Book';
  let content = await Book.findById(id);

  if (!content) {
    content = await Ebook.findById(id);
    contentType = 'Ebook';
  }

  if (!content) {
    content = await AudioBook.findById(id);
    contentType = 'AudioBook';
  }

  if (!content) throw new ApiError("Content not found", 404);

  const updatedUser = await userService.toggleSaveBook(
    req.user._id || req.user.id,
    id,
    contentType
  );

  res.json({
    success: true,
    message: `Book ${updatedUser.savedItems.some(item => item.contentId.toString() === id) ? 'saved' : 'unsaved'} successfully`,
    data: updatedUser.savedItems
  });
});

exports.allSavedItems = asyncHandler(async (req, res) => {
  const books = await userService.allSavedItems(req.user._id || req.user.id);
  res.json({ success: true, books });
});

exports.clearUserInformation = asyncHandler(async (req, res) => {
  const user = await userService.clearUserInformation(req.user._id || req.user.id);
  res.json({
    success: true,
    message: "User information cleared successfully",
    data: user
  });
});

exports.deleteUserAccount = asyncHandler(async (req, res) => {
  const result = await userService.deleteUserAccount(req.user._id || req.user.id);
  // Clear the authentication cookie or token if using JWT in cookies
  res.clearCookie('token'); // Adjust cookie name if different
  res.json(result);
});
