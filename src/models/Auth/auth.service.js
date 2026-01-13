const bcrypt = require("bcryptjs");
const User = require("../User/User");
const emailService = require("../../utils/emailService");
const tokenService = require("../../utils/tokenService");
const { ApiError } = require("../../errors/errorHandler");
const Admin = require("../Admin/Admin");
const RefreshToken = require("../RefreshToken/RefreshToken");

class AuthService {
  /**
   * Register a new user (with email verification).
   * If user exists but unverified and expired → delete and re-register.
   * If user exists but unverified and still valid → resend verification.
   */
  async registerUser({ firstName, lastName, email, password, country }) {
    const existing = await User.findOne({ email });

    if (existing) {
      // If user exists but is not verified
      if (!existing.isVerified) {
        const isExpired =
          !existing.verificationCode.expiresAt || Date.now() > existing.verificationCode.expiresAt;

        if (isExpired) {
          // Delete old unverified account
          await User.deleteOne({ email });
        } else {
          // Resend code if still valid
          await emailService.sendVerificationCode(email, existing.verificationCode.code);
          throw new ApiError(
            "Email already registered but not verified. A verification code has been resent.",
            400
          );
        }
      } else {
        // Verified user exists
        throw new ApiError("Email already in use", 400);
      }
    }

    // Register new user
    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationCode = tokenService.generateVerificationCode();

    const user = await User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      country,
      verificationCode: {
        code: verificationCode,
        expiresAt: Date.now() + 10 * 60 * 1000, // 10 mins
      },
    });

    await emailService.sendVerificationCode(email, verificationCode);
    return { message: "User registered successfully. Check email for verification code." };
  }

  /**
   * Verify user's email using code
   */
  async verifyEmail(email, code) {
    const user = await User.findOne({ email });
    if (!user) throw new ApiError("User not found", 404);

    if (!user.verificationCode || user.verificationCode.code !== code) {
      throw new ApiError("Invalid verification code", 400);
    }

    if (Date.now() > user.verificationCode.expiresAt) {
      throw new ApiError("Verification code expired. Please register again.", 400);
    }

    user.isVerified = true;
    user.verificationCode = { code: null, expiresAt: null };
    await user.save();

    await emailService.sendWelcomeEmail(email, user.firstName, user.role);

    return { message: "Email verified successfully. You can now log in." };
  }

  /**
   * Login (works for User/Admin/Super Admin)
   */
  async login(email, password) {
    const user = await User.findOne({ email }).select("+password");
    if (!user) throw new ApiError("User not found", 404);

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) throw new ApiError("Invalid credentials", 401);

    if (!user.isVerified && user.role === "USER")
      throw new ApiError("Email not verified. Please verify before logging in.", 403);

    const accessToken = tokenService.generateAccessToken({
      id: user._id,
      role: user.role,
    });

    // console.log("Access Token: ", accessToken);

    const refreshToken = tokenService.generateRefreshToken({
      id: user._id,
      role: user.role,
      email: user.email,
    });
    // console.log("Refresh Token: ", refreshToken);

    await RefreshToken.create({
      user: user._id, // if it's user
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });

    return {
      accessToken,
      refreshToken,
      user: { id: user._id, role: user.role, email: user.email },
    };
  }



  /**
   * Forgot Password: Send reset code
   */
  async forgotPassword(email) {
    email = email.toLowerCase().trim();

    const user = await User.findOne({ email });
    // console.log(user);
    if (user) {
      const resetCode = tokenService.generateVerificationCode();
      user.passwordResetCode = {
        code: resetCode,
        expiresAt: Date.now() + 10 * 60 * 1000,
      };
      await user.save();
      await emailService.sendPasswordResetCode(email, resetCode);
      return { message: "Password reset code sent to email." };
    }

    const admin = await Admin.findOne({ email });

    // console.log(admin);
    if (!admin) {
      throw new ApiError("No user or admin found with this email", 404);
    }

    const resetCode = tokenService.generateVerificationCode();
    admin.passwordResetCode = resetCode;
    await admin.save();
    await emailService.sendPasswordResetCode(email, resetCode);

    return { message: "Password reset code sent to email." };
  }


  /**
   * Reset Password with code
   */
  async resetPassword(email, code, newPassword) {
    // Try resetting for regular user first
    const user = await User.findOne({ email });
    if (user) {
      if (
        !user.passwordResetCode ||
        user.passwordResetCode.code !== code ||
        Date.now() > user.passwordResetCode.expiresAt
      ) {
        throw new ApiError("Invalid or expired reset code.", 400);
      }

      user.password = await bcrypt.hash(newPassword, 10);
      user.passwordResetCode = { code: null, expiresAt: null };
      await user.save();

      return { message: "Password reset successfully. You can now log in." };
    }

    // If not a user, try admin
    const admin = await Admin.findOne({ email });
    if (!admin) throw new ApiError("User not found", 404);

    if (!admin.passwordResetCode || Number(admin.passwordResetCode) !== Number(code)) {
      throw new ApiError("Invalid or expired reset code.", 400);
    }

    admin.password = await bcrypt.hash(newPassword, 10);
    // console.log("Resetting admin password" + admin.password);
    admin.passwordResetCode = null;
    await admin.save();

    return { message: "Password reset successfully. You can now log in." };
  }


  /**
 * Resend verification code for unverified users
 */
  async resendVerification(email) {
    const user = await User.findOne({ email });

    if (!user) throw new ApiError("User not found.", 404);
    if (user.isVerified) throw new ApiError("Email is already verified.", 400);

    // Generate a new code if expired or missing
    let verificationCode = user.verificationCode?.code;
    const isExpired =
      !user.verificationCode?.expiresAt || Date.now() > user.verificationCode.expiresAt;

    if (isExpired || !verificationCode) {
      verificationCode = tokenService.generateVerificationCode();
      user.verificationCode = {
        code: verificationCode,
        expiresAt: Date.now() + 10 * 60 * 1000, // 10 min
      };
      await user.save();
    }

    await emailService.sendVerificationCode(email, verificationCode);
    return { message: "A new verification code has been sent to your email." };
  }

  /**
   * Super Admin creates Admin
   */
  // async createAdmin(superAdminId, { firstName, lastName, email, password }) {
  //   const superAdmin = await User.findById(superAdminId);
  //   if (!superAdmin || superAdmin.role !== "SUPER_ADMIN") {
  //     throw new ApiError("Not authorized. Only Super Admin can create admins.", 403);
  //   }

  //   const existing = await User.findOne({ email });
  //   if (existing) throw new ApiError("Email already in use", 400);

  //   const hashedPassword = await bcrypt.hash(password, 10);
  //   const admin = await User.create({
  //     firstName,
  //     lastName,
  //     email,
  //     password: hashedPassword,
  //     role: "ADMIN",
  //     isVerified: true, // Admin is verified by default
  //   });

  //   return { message: "Admin created successfully.", admin };
  // }

  /**
   * Register an admin (only Super Admin can do this)
   */

  async registerAdmin(adminData, creatorUser) {
    if (creatorUser.role !== "SUPER_ADMIN") {
      throw new ApiError("Only Super Admins can create admins", 403);
    }

    const existingAdmin = await Admin.findOne({ email: adminData.email });
    if (existingAdmin) throw new ApiError("Admin with this email already exists", 400);

    const hashedPassword = await bcrypt.hash(adminData.password, 10);

    const admin = await Admin.create({
      name: adminData.name,
      email: adminData.email,
      password: hashedPassword,
      role: "ADMIN",
    });

    return { id: admin._id, email: admin.email, role: admin.role };
  }

  /**
  * Login admin
  */
  async loginAdmin(email, password) {
    const admin = await Admin.findOne({ email }).select("+password");
    if (!admin) throw new ApiError("Invalid email or password", 401);

    const validPassword = await bcrypt.compare(password, admin.password);
    if (!validPassword) throw new ApiError("Invalid email or password", 401);

    const accessToken = tokenService.generateAccessToken({ id: admin._id, role: admin.role });
    const refreshToken = tokenService.generateRefreshToken({ id: admin._id, role: admin.role });


    await RefreshToken.create({
      admin: admin._id, // if it's admin
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });

    return { accessToken, refreshToken, admin: { id: admin._id, role: admin.role, email: admin.email } };
  }

  async logout(userId, role) {
    if (!userId || !role) {
      throw new ApiError("Invalid user information", 400);
    }

    if (role === "ADMIN") {
      await RefreshToken.deleteMany({ admin: userId });
    } else if (role === "SUPER_ADMIN") {
      await RefreshToken.deleteMany({ superAdmin: userId });
    } else if (role === "USER") {
      await RefreshToken.deleteMany({ user: userId });
    } else {
      throw new ApiError("Unknown role", 400);
    }

    return { success: true, message: "Logout successful" };
  }

  /**
   * Refresh access token using refresh token
   * @param {string} refreshToken - The refresh token
   * @returns {Object} New access and refresh tokens with user info
   */
  async refreshToken(refreshToken) {
    if (!refreshToken) {
      throw new ApiError('Refresh token is required', 400);
    }

    // Find the refresh token in the database
    const storedToken = await RefreshToken.findOne({ token: refreshToken });
    if (!storedToken) {
      throw new ApiError('Invalid refresh token', 401);
    }

    // Check if refresh token has expired
    if (storedToken.expiresAt < new Date()) {
      await RefreshToken.findByIdAndDelete(storedToken._id);
      throw new ApiError('Refresh token has expired. Please login again.', 401);
    }

    // Verify the refresh token
    let decoded;
    try {
      decoded = tokenService.verifyRefreshToken(refreshToken);
      // console.log(decoded)
    } catch (error) {
      await RefreshToken.findByIdAndDelete(storedToken._id);
      throw new ApiError('Invalid refresh token', 401);
    }

    // Delete the old refresh token
    await RefreshToken.findByIdAndDelete(storedToken._id);

    // Generate new tokens
    const newAccessToken = tokenService.generateAccessToken({
      id: decoded.id,
      role: decoded.role,
      email: decoded.email,
    });

    const newRefreshToken = tokenService.generateRefreshToken({
      id: decoded.id,
      role: decoded.role,
      email: decoded.email,
    });

    // Save the new refresh token
    await RefreshToken.create({
      [decoded.role === 'ADMIN' ? 'admin' : 'user']: decoded.id,
      token: newRefreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      user: {
        id: decoded.id,
        role: decoded.role,
        email: decoded.email,
      },
    };
  }
}




module.exports = new AuthService();
