const User = require("../User/User");
const bcrypt = require("bcryptjs");
const { ApiError } = require("../../errors/errorHandler");
const Book = require("../Book/Book");
const Ebook = require("../Ebook/Ebook");
const AudioBook = require("../AudioBook/AudioBook");

exports.getUserById = async (userId) => {
  const user = await User.findById(userId).select("-password").select("-verificationCode").select("-isVerified").select("-passwordResetCode");
  if (!user) throw new ApiError("User not found", 404);
  return user;
};

exports.updateUserProfile = async (userId, updateData) => {
  const user = await User.findById(userId).select("-password").select("-verificationCode").select("-isVerified").select("-passwordResetCode");
  if (!user) throw new ApiError("User not found", 404);

  if (typeof updateData.firstName !== "undefined") user.firstName = updateData.firstName;
  if (typeof updateData.lastName !== "undefined") user.lastName = updateData.lastName;
  if (typeof updateData.phone !== "undefined") user.phone = updateData.phone;
  if (typeof updateData.profilePicture !== "undefined") user.profilePicture = updateData.profilePicture;
   
  await user.save();
  return user;
};

exports.changeUserPassword = async (userId, currentPassword, newPassword, confirmPassword) => {
  const user = await User.findById(userId).select("+password");
//   console.log(user);
 
  if (!user) throw new ApiError("User not found", 404);

  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) throw new ApiError("Current password is incorrect", 400);

  if (newPassword !== confirmPassword)
    throw new ApiError("New password and confirm password do not match", 400);

  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();

  return true;
};


exports.toggleSaveBook = async (userId, bookId, contentType) => {
  const user = await User.findById(userId).select("-password -verificationCode -isVerified -passwordResetCode");
  if (!user) throw new ApiError("User not found", 404);

  const existingIndex = user.savedItems.findIndex(
    item => item.contentId.toString() === bookId && item.contentType === contentType
  );

  let updatedUser;
  
  if (existingIndex !== -1) {
    // already saved → remove it using $pull
    console.log("Removing item from savedItems");
    updatedUser = await User.findByIdAndUpdate(
      userId,
      { 
        $pull: { 
          savedItems: { 
            contentId: bookId, 
            contentType: contentType 
          } 
        } 
      },
      { new: true, select: "-password -verificationCode -isVerified -passwordResetCode" }
    );
  } else {
    // not saved → add it using $push
    console.log("Adding item to savedItems");
    updatedUser = await User.findByIdAndUpdate(
      userId,
      { 
        $push: { 
          savedItems: { 
            contentId: bookId, 
            contentType: contentType 
          } 
        } 
      },
      { new: true, select: "-password -verificationCode -isVerified -passwordResetCode" }
    );
  }

  console.log("Updated savedItems:", updatedUser.savedItems);
  
  // Verify by fetching fresh from DB
  const verification = await User.findById(userId).select("savedItems");
  console.log("Verification from DB:", verification.savedItems);
  
  return updatedUser;
};


exports.allSavedItems = async (userId) => {
  const user = await User.findById(userId).select("-password").select("-verificationCode").select("-isVerified").select("-passwordResetCode");
  if (!user) throw new ApiError("User not found", 404);
  
  console.log("User ID:", userId);
  console.log("Full user object keys:", Object.keys(user.toObject()));
  console.log("Saved items length:", user.savedItems?.length);
  console.log("Saved items:", JSON.stringify(user.savedItems, null, 2));
  
  return user.savedItems;
};

exports.deleteUserAccount = async (userId) => {
  const user = await User.findByIdAndDelete(userId);
  if (!user) throw new ApiError("User not found", 404);
  
  // Here you can add any cleanup logic needed when a user deletes their account
  // For example, removing user's data from other collections
  
  return { success: true, message: "Account deleted successfully" };
};

exports.clearUserInformation = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new ApiError("User not found", 404);

  // Reset all fields except email and password
  user.firstName = "User";
  user.lastName = "";
  user.profilePicture = null;
  user.bio = null;
  user.phone = null;
  user.savedItems = [];
  user.verificationCode = { code: null, expiresAt: null };
  user.passwordResetCode = { code: null, expiresAt: null };
  user.isVerified = false;
  user.isBlocked = false;

  await user.save();
  
  // Return the updated user without sensitive data
  const { password, ...userWithoutPassword } = user.toObject();
  return userWithoutPassword;
};
