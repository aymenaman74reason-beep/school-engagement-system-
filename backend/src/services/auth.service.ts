import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { User } from "../models/User";
import { RefreshToken } from "../models/RefreshToken";
import { PasswordResetToken } from "../models/PasswordResetToken";
import { StudentProfile } from "../models/StudentProfile";
import { ParentProfile } from "../models/ParentProfile";
import { TeacherProfile } from "../models/TeacherProfile";
import {
  BadRequestError,
  UnauthorizedError,
  NotFoundError,
  ConflictError,
} from "../utils/errors";
import { MESSAGES } from "../constants/messages";
import { generateToken, generatePassword } from "../utils/helpers";
import { createAuditLog } from "../middleware/audit.middleware";
import { Roles } from "../constants/roles";
import { sendEmail, sendInvitationEmail } from "../utils/email";

export class AuthService {
  /**
   * Register a new user (admin-initiated).
   */
  async register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: string;
    phone?: string;
  }) {
    const existingUser = await User.findOne({ 
      email: data.email, 
      firstName: data.firstName, 
      lastName: data.lastName 
    });
    if (existingUser) {
      throw new ConflictError(MESSAGES.ALREADY_EXISTS("User"));
    }

    const user = await User.create(data);

    // Create profile based on role
    if (data.role === Roles.STUDENT) {
      await StudentProfile.create({
        userId: user._id,
        enrollmentNo: `STU-${Date.now()}`,
      });
    } else if (data.role === Roles.PARENT) {
      await ParentProfile.create({ userId: user._id });
    } else if (data.role === Roles.TEACHER) {
      await TeacherProfile.create({
        userId: user._id,
        employeeId: `EMP-${Date.now()}`,
      });
    }

    const userObj = user.toObject();
    delete (userObj as any).password;
    return userObj;
  }

  /**
   * Invite a user — auto-generates password and sends email with credentials.
   */
  async inviteUser(data: {
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    subjects?: string[];
    classes?: string[];
    classId?: string;
    studentId?: string;
    inviterName?: string;
  }) {
    const existingUser = await User.findOne({ 
      email: data.email, 
      firstName: data.firstName, 
      lastName: data.lastName 
    });
    if (existingUser) {
      throw new ConflictError(MESSAGES.ALREADY_EXISTS("User"));
    }

    const plainPassword = generatePassword(12);

    const user = await User.create({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      password: plainPassword,
      role: data.role,
    });

    if (data.role === Roles.STUDENT) {
      await StudentProfile.create({
        userId: user._id,
        enrollmentNo: `STU-${Date.now()}`,
        classId: data.classId,
      });
    } else if (data.role === Roles.PARENT && data.studentId) {
      const student = await User.findById(data.studentId);
      if (!student || student.role !== Roles.STUDENT) {
        throw new BadRequestError("The specified child ID does not belong to a student.");
      }
      await ParentProfile.findOneAndUpdate(
        { userId: user._id },
        { $addToSet: { childrenIds: data.studentId } },
        { upsert: true },
      );
      if (data.studentId) {
        await StudentProfile.findOneAndUpdate(
          { userId: data.studentId },
          { $addToSet: { parentIds: user._id } }
        );
      }
    } else if (data.role === Roles.TEACHER) {
      await TeacherProfile.create({
        userId: user._id,
        employeeId: `EMP-${Date.now()}`,
        subjects: data.subjects || [],
        classes: data.classes || [],
      });
    }

    // Send invitation email (don't fail the whole request if email fails)
    try {
      await sendInvitationEmail({
        email: data.email,
        firstName: data.firstName,
        password: plainPassword,
        role: data.role,
        fromName: data.inviterName,
      });
    } catch (error) {
      // Log but don't block — user is still created
    }

    const userObj = user.toObject();
    delete (userObj as any).password;
    return userObj;
  }

  /**
   * Login with email and password. Returns access + refresh tokens.
   */
  async login(
    email: string,
    password: string,
    meta: { ip?: string; userAgent?: string },
  ) {
    const users = await User.find({ email }).select("+password");
    if (users.length === 0) {
      throw new UnauthorizedError(MESSAGES.INVALID_CREDENTIALS);
    }

    let user = null;
    for (const u of users) {
      const isValid = await u.comparePassword(password);
      if (isValid) {
        user = u;
        break;
      }
    }

    if (!user) {
      // Logic for failed login follows for the first user found (or all)
      const firstUser = users[0];
      firstUser.failedLoginAttempts += 1;
      if (firstUser.failedLoginAttempts >= 5) {
        firstUser.lockUntil = new Date(Date.now() + 30 * 60 * 1000);
        firstUser.status = "locked";
      }
      await firstUser.save();
      
      throw new UnauthorizedError(MESSAGES.INVALID_CREDENTIALS);
    }

    // Reset failed attempts on successful login
    user.failedLoginAttempts = 0;
    user.lockUntil = undefined;
    if ((user.status as string) === "locked") user.status = "active";
    user.lastLogin = new Date();
    await user.save();

    const accessToken = this.generateAccessToken(user);
    const refreshToken = await this.generateRefreshToken(user._id, meta);

    await createAuditLog({
      actor: user._id,
      actorEmail: user.email,
      actorRole: user.role,
      action: "LOGIN_SUCCESS",
      entity: "User",
      entityId: user._id,
      ipAddress: meta.ip,
      userAgent: meta.userAgent,
    });

    const userObj = user.toObject();
    delete (userObj as any).password;

    return {
      user: userObj,
      accessToken,
      refreshToken: refreshToken.token,
    };
  }

  /**
   * Logout - revoke refresh token.
   */
  async logout(refreshTokenStr: string, userId: any) {
    await RefreshToken.findOneAndUpdate(
      { token: refreshTokenStr, userId },
      { isRevoked: true },
    );

    await createAuditLog({
      actor: userId,
      actorEmail: "",
      actorRole: "",
      action: "LOGOUT",
      entity: "User",
      entityId: userId,
    });
  }

  /**
   * Refresh access token using a valid refresh token.
   */
  async refreshAccessToken(refreshTokenStr: string) {
    const storedToken = await RefreshToken.findOne({
      token: refreshTokenStr,
      isRevoked: false,
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      throw new UnauthorizedError(MESSAGES.REFRESH_TOKEN_INVALID);
    }

    const user = await User.findById(storedToken.userId);
    if (!user || !user.isActive) {
      throw new UnauthorizedError(MESSAGES.ACCOUNT_INACTIVE);
    }

    // Rotate refresh token
    storedToken.isRevoked = true;
    await storedToken.save();

    const accessToken = this.generateAccessToken(user);
    const newRefreshToken = await this.generateRefreshToken(user._id, {});

    return {
      accessToken,
      refreshToken: newRefreshToken.token,
    };
  }

  /**
   * Change password for authenticated user.
   */
  async changePassword(
    userId: any,
    currentPassword: string,
    newPassword: string,
  ) {
    const user = await User.findById(userId).select("+password");
    if (!user) {
      throw new NotFoundError(MESSAGES.NOT_FOUND("User"));
    }

    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      throw new BadRequestError(MESSAGES.CURRENT_PASSWORD_INCORRECT);
    }

    user.password = newPassword;
    await user.save();

    // Revoke all refresh tokens
    await RefreshToken.updateMany({ userId }, { isRevoked: true });

    await createAuditLog({
      actor: userId,
      actorEmail: user.email,
      actorRole: user.role,
      action: "PASSWORD_CHANGED",
      entity: "User",
      entityId: userId,
    });
  }

  /**
   * Forgot password — generate a reset token.
   */
  async forgotPassword(email: string) {
    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal whether user exists
      return;
    }

    // Invalidate existing tokens
    await PasswordResetToken.updateMany(
      { userId: user._id, isUsed: false },
      { isUsed: true },
    );

    const token = generateToken(64);
    await PasswordResetToken.create({
      userId: user._id,
      token,
      expiresAt: new Date(Date.now() + env.PASSWORD_RESET_EXPIRY),
    });

    // Send email with reset link containing the token
    const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${token}`;
    const message = `You are receiving this email because you (or someone else) have requested the reset of a password. Please make a put request to: \n\n ${resetUrl}`;

    try {
      await sendEmail({
        email: user.email,
        subject: "Password Reset Token",
        message,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
            <h2 style="color: #333;">Password Reset Request</h2>
            <p>You are receiving this email because you (or someone else) have requested the reset of a password for your account.</p>
            <p>Please click the button below to reset your password. This link is valid for 1 hour.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
            </div>
            <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 12px; color: #777;">&copy; ${new Date().getFullYear()} School Management System. All rights reserved.</p>
          </div>
        `,
      });
    } catch (error) {
      // Log the error but don't fail the request (or maybe we should?)
      // For now, we'll let it be.
    }

    await createAuditLog({
      actor: user._id,
      actorEmail: user.email,
      actorRole: user.role,
      action: "PASSWORD_RESET_REQUESTED",
      entity: "User",
      entityId: user._id,
    });

    return token; // In production, only send via email
  }

  /**
   * Reset password using a valid reset token.
   */
  async resetPassword(tokenStr: string, newPassword: string) {
    const resetToken = await PasswordResetToken.findOne({
      token: tokenStr,
      isUsed: false,
    });

    if (!resetToken || resetToken.expiresAt < new Date()) {
      throw new BadRequestError(MESSAGES.PASSWORD_RESET_TOKEN_INVALID);
    }

    const user = await User.findById(resetToken.userId).select("+password");
    if (!user) {
      throw new NotFoundError(MESSAGES.NOT_FOUND("User"));
    }

    user.password = newPassword;
    user.failedLoginAttempts = 0;
    user.lockUntil = undefined;
    if ((user.status as string) === "locked") user.status = "active";
    await user.save();

    resetToken.isUsed = true;
    await resetToken.save();

    // Revoke all refresh tokens
    await RefreshToken.updateMany({ userId: user._id }, { isRevoked: true });

    await createAuditLog({
      actor: user._id,
      actorEmail: user.email,
      actorRole: user.role,
      action: "PASSWORD_RESET_COMPLETED",
      entity: "User",
      entityId: user._id,
    });
  }

  /**
   * Get current user's profile.
   */
  async getProfile(userId: any) {
    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError(MESSAGES.NOT_FOUND("User"));
    }

    let profile: any = null;
    if (user.role === Roles.STUDENT) {
      profile = await StudentProfile.findOne({ userId }).populate(
        "parentIds classId",
        "firstName lastName email name section academicYear"
      );
    } else if (user.role === Roles.PARENT) {
      profile = await ParentProfile.findOne({ userId }).populate(
        "childrenIds",
        "firstName lastName email",
      );
    } else if (user.role === Roles.TEACHER) {
      profile = await TeacherProfile.findOne({ userId }).populate(
        "subjects classes",
      );
    }

    return { user, profile };
  }

  // ----- Private helpers -----

  private generateAccessToken(user: any): string {
    return jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      env.JWT_SECRET,
      { expiresIn: env.JWT_ACCESS_EXPIRY as any },
    );
  }

  private async generateRefreshToken(
    userId: any,
    meta: { ip?: string; userAgent?: string },
  ) {
    const token = generateToken(128);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    const refreshToken = await RefreshToken.create({
      userId,
      token,
      expiresAt,
      ipAddress: meta.ip,
      userAgent: meta.userAgent,
    });

    return refreshToken;
  }
}

export const authService = new AuthService();
