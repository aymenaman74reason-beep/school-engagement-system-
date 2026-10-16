import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/apiResponse";
import { authService } from "../services/auth.service";
import { MESSAGES } from "../constants/messages";

export class AuthController {
  register = asyncHandler(async (req: Request, res: Response) => {
    if (req.user?.role === "teacher" && req.body.role !== "student") {
      return ApiResponse.error(res, {
        statusCode: 403,
        message: "Teachers can only invite students",
      });
    }
    const user = await authService.register(req.body);
    ApiResponse.success(res, {
      statusCode: 201,
      message: MESSAGES.REGISTER_SUCCESS,
      data: user,
    });
  });

  inviteTeacher = asyncHandler(async (req: Request, res: Response) => {
    const user = await authService.inviteUser({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      subjects: req.body.subjects,
      classes: req.body.classes,
      role: "teacher",
      inviterName: `${(req.user as any).firstName} ${(req.user as any).lastName}`
    });
    ApiResponse.success(res, {
      statusCode: 201,
      message: "Teacher invited successfully. Credentials sent to their email.",
      data: user,
    });
  });

  inviteStudentOrParent = asyncHandler(async (req: Request, res: Response) => {
    const user = await authService.inviteUser({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      role: req.body.role,
      classId: req.body.classId,
      studentId: req.body.studentId,
      inviterName: `${(req.user as any).firstName} ${(req.user as any).lastName}`
    });
    ApiResponse.success(res, {
      statusCode: 201,
      message: `${req.body.role === "student" ? "Student" : "Parent"} invited successfully. Credentials sent to their email.`,
      data: user,
    });
  });

  login = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const result = await authService.login(email, password, {
      ip: req.ip || req.socket.remoteAddress,
      userAgent: req.get("User-Agent"),
    });
    ApiResponse.success(res, {
      message: MESSAGES.LOGIN_SUCCESS,
      data: result,
    });
  });

  logout = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    await authService.logout(refreshToken, req.user!._id);
    ApiResponse.success(res, { message: MESSAGES.LOGOUT_SUCCESS });
  });

  refreshToken = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    const tokens = await authService.refreshAccessToken(refreshToken);
    ApiResponse.success(res, {
      message: MESSAGES.TOKEN_REFRESH_SUCCESS,
      data: tokens,
    });
  });

  changePassword = asyncHandler(async (req: Request, res: Response) => {
    const { currentPassword, newPassword } = req.body;
    await authService.changePassword(
      req.user!._id,
      currentPassword,
      newPassword,
    );
    ApiResponse.success(res, { message: MESSAGES.PASSWORD_CHANGE_SUCCESS });
  });

  forgotPassword = asyncHandler(async (req: Request, res: Response) => {
    await authService.forgotPassword(req.body.email);
    ApiResponse.success(res, { message: MESSAGES.PASSWORD_RESET_LINK_SENT });
  });

  resetPassword = asyncHandler(async (req: Request, res: Response) => {
    const { token, newPassword } = req.body;
    await authService.resetPassword(token, newPassword);
    ApiResponse.success(res, { message: MESSAGES.PASSWORD_RESET_SUCCESS });
  });

  getProfile = asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.getProfile(req.user!._id);
    ApiResponse.success(res, {
      message: MESSAGES.FETCHED("Profile"),
      data: result,
    });
  });
}

export const authController = new AuthController();
