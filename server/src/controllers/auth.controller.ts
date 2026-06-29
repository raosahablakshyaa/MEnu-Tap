import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { authService } from '../services/auth.service';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess, sendCreated } from '../utils/apiResponse';
import { COOKIE_NAMES } from '../constants';

export const register = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const meta = authService.getClientMeta(req);
  const result = await authService.register(req.body, meta, res);
  sendCreated(res, 'Registration successful', result);
});

export const login = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const meta = authService.getClientMeta(req);
  const result = await authService.login(req.body, meta, res);
  sendSuccess(res, 'Login successful', result);
});

export const logout = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const result = await authService.logout(req.tokenId, res);
  sendSuccess(res, result.message);
});

export const refreshToken = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const refreshTokenValue =
    req.cookies?.[COOKIE_NAMES.REFRESH_TOKEN] || req.body.refreshToken;

  if (!refreshTokenValue) {
    res.status(401).json({
      success: false,
      message: 'Refresh token required',
      data: null,
      errors: null,
    });
    return;
  }

  const meta = authService.getClientMeta(req);
  const result = await authService.refreshToken(refreshTokenValue, meta, res);
  sendSuccess(res, 'Token refreshed successfully', result);
});

export const forgotPassword = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const result = await authService.forgotPassword(req.body);
  sendSuccess(res, result.message);
});

export const resetPassword = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const result = await authService.resetPassword(req.body);
  sendSuccess(res, result.message);
});

export const changePassword = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const result = await authService.changePassword(req.user!._id.toString(), req.body);
  sendSuccess(res, result.message);
});

export const getProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const profile = await authService.getProfile(req.user!._id.toString());
  sendSuccess(res, 'Profile retrieved successfully', profile);
});

export const getMe = getProfile;
