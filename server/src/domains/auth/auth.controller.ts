import type { Request, Response } from 'express';
import { env } from '../../config/env.js';
import type { AuthenticatedRequest } from '../../shared/middleware/auth.middleware.js';
import {
  createdResponse,
  successResponse,
} from '../../shared/utils/response.js';
import { authService } from './auth.service.js';

/**
 * POST /api/auth/register
 */
export async function register(req: Request, res: Response): Promise<void> {
  const result = await authService.register(req.body);

  // Set refresh token in HTTP-only cookie
  setRefreshTokenCookie(res, result.tokens.refreshToken);

  createdResponse(res, {
    user: result.user,
    accessToken: result.tokens.accessToken,
    expiresIn: result.tokens.expiresIn,
  });
}

/**
 * POST /api/auth/login
 */
export async function login(req: Request, res: Response): Promise<void> {
  const result = await authService.login(req.body);

  // Set refresh token in HTTP-only cookie
  setRefreshTokenCookie(res, result.tokens.refreshToken);

  successResponse(res, {
    user: result.user,
    accessToken: result.tokens.accessToken,
    expiresIn: result.tokens.expiresIn,
  });
}

/**
 * POST /api/auth/logout
 */
export async function logout(req: Request, res: Response): Promise<void> {
  const authHeader = req.headers.authorization;
  const accessToken = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : '';
  const refreshToken = req.cookies?.refreshToken;

  await authService.logout(accessToken, refreshToken);

  const isProduction = env.NODE_ENV === 'production';
  // Clear refresh token cookie
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'strict',
    path: '/api/auth',
  });

  successResponse(res, { message: 'Logged out successfully' });
}

/**
 * POST /api/auth/refresh
 */
export async function refreshToken(req: Request, res: Response): Promise<void> {
  // Get refresh token from cookie or body (safely handle undefined body)
  const token = req.cookies?.refreshToken || req.body?.refreshToken;

  if (!token) {
    res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'No refresh token provided' },
    });
    return;
  }

  const tokens = await authService.refreshToken(token);

  // Set new refresh token in cookie
  setRefreshTokenCookie(res, tokens.refreshToken);

  successResponse(res, {
    accessToken: tokens.accessToken,
    expiresIn: tokens.expiresIn,
  });
}

/**
 * GET /api/auth/me
 */
export async function getCurrentUser(
  req: Request,
  res: Response
): Promise<void> {
  const authReq = req as AuthenticatedRequest;
  const user = await authService.getCurrentUser(authReq.user.userId);

  if (!user) {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'User not found' },
    });
    return;
  }

  successResponse(res, user);
}

/**
 * PUT /api/auth/password
 */
export async function updatePassword(
  req: Request,
  res: Response
): Promise<void> {
  const authReq = req as AuthenticatedRequest;
  const { currentPassword, newPassword } = req.body;

  await authService.updatePassword(
    authReq.user.userId,
    currentPassword,
    newPassword
  );

  successResponse(res, { message: 'Password updated successfully' });
}

/**
 * GET /api/auth/github
 */
export function githubOAuthRedirect(_req: Request, res: Response): void {
  const params = new URLSearchParams({
    client_id: env.GITHUB_CLIENT_ID,
    redirect_uri: env.GITHUB_CALLBACK_URL,
    scope: 'read:user user:email',
    state: generateState(),
  });

  res.redirect(`https://github.com/login/oauth/authorize?${params}`);
}

/**
 * GET /api/auth/github/callback
 */
export async function githubOAuthCallback(
  req: Request,
  res: Response
): Promise<void> {
  const { code } = req.query;

  if (!code) {
    res.redirect(`${env.FRONTEND_URL}/login?error=no_code`);
    return;
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch(
      'https://github.com/login/oauth/access_token',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          client_id: env.GITHUB_CLIENT_ID,
          client_secret: env.GITHUB_CLIENT_SECRET,
          code,
        }),
      }
    );

    const tokenData = (await tokenResponse.json()) as {
      access_token?: string;
      error?: string;
    };

    if (!tokenData.access_token) {
      res.redirect(`${env.FRONTEND_URL}/login?error=token_exchange_failed`);
      return;
    }

    // Get user profile
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        Accept: 'application/json',
      },
    });

    const userData = (await userResponse.json()) as {
      id: number;
      email: string | null;
      name: string;
      login: string;
      avatar_url: string;
    };

    // Get email if not public
    let email = userData.email;
    if (!email) {
      const emailsResponse = await fetch('https://api.github.com/user/emails', {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          Accept: 'application/json',
        },
      });
      const emails = (await emailsResponse.json()) as {
        email: string;
        primary: boolean;
      }[];
      const primaryEmail = emails.find(e => e.primary);
      email = primaryEmail?.email || emails[0]?.email;
    }

    if (!email) {
      res.redirect(`${env.FRONTEND_URL}/login?error=no_email`);
      return;
    }

    // Login/register with OAuth
    const result = await authService.oauthLogin('github', {
      id: userData.id.toString(),
      email,
      name: userData.name || userData.login,
      avatarUrl: userData.avatar_url,
    });

    // Set refresh token cookie
    setRefreshTokenCookie(res, result.tokens.refreshToken);

    // Redirect to frontend with access token
    res.redirect(
      `${env.FRONTEND_URL}/auth/callback?token=${result.tokens.accessToken}&expiresIn=${result.tokens.expiresIn}`
    );
  } catch (error) {
    console.error('GitHub OAuth error:', error);
    res.redirect(`${env.FRONTEND_URL}/login?error=oauth_failed`);
  }
}

// ── Helper Functions ──

function setRefreshTokenCookie(res: Response, token: string): void {
  const isProduction = env.NODE_ENV === 'production';
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'strict',
    path: '/api/auth',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
}

function generateState(): string {
  return Math.random().toString(36).substring(2, 15);
}
