const Admin = require("../Admin/Admin");
const bcrypt = require("bcryptjs");
const { ApiError } = require("../../errors/errorHandler");  

exports.getAdminById = async (adminId) => {
  const admin = await Admin.findById(adminId).select("-password");
  if (!admin) throw new ApiError("Admin not found", 404);
  return admin;
};

exports.getAllAdmins = async () => {
  const admins = await Admin.find({ role: { $ne: "SUPER_ADMIN" } }).lean();
  return admins;
};

exports.updateAdminProfile = async (adminId, updateData) => {
    const admin = await Admin.findById(adminId).select("-password").select("-verificationCode").select("-isVerified").select("-passwordResetCode");
    if (!admin) throw new ApiError("Admin not found", 404);
  
    if (typeof updateData.name !== "undefined") admin.name = updateData.name;
    if (typeof updateData.phone !== "undefined") admin.phone = updateData.phone;
    if (typeof updateData.profilePicture !== "undefined") admin.profilePicture = updateData.profilePicture;
    
    // if (updateData.profilePicture && admin.profilePicture) deleteFile(admin.profilePicture);
    await admin.save();
    return admin;
  };
  

exports.changeAdminPassword = async (adminId, currentPassword, newPassword, confirmPassword) => {
  const admin = await Admin.findById(adminId);
  if (!admin) throw new ApiError("Admin not found", 404);

  const isMatch = await bcrypt.compare(currentPassword, admin.password);
  if (!isMatch) throw new ApiError("Current password is incorrect", 400);

  if (newPassword !== confirmPassword)
    throw new ApiError("New password and confirm password do not match", 400);

  admin.password = await bcrypt.hash(newPassword, 10);
  await admin.save();

  return true;
};


exports.deleteAdmin = async (adminId) => {
    const admin = await Admin.findByIdAndDelete(adminId);
    if (!admin) throw new ApiError("Admin not found", 404);
    return admin;
};