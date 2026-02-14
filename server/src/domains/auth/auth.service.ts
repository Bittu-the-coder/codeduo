import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { cache } from '../../config/redis.js';
import { AppError } from '../../shared/errors/AppError.js';
import type { JwtPayload } from '../../shared/middleware/auth.middleware.js';
import { User, type IUser } from '../users/user.model.js';
import type { LoginInput, RegisterInput } from './auth.validation.js';

const SALT_ROUNDS = 12;
const REFRESH_TOKEN_EXPIRY_SECONDS = 7 * 24 * 60 * 60; // 7 days

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthResult {
  user: Partial<IUser>;
  tokens: AuthTokens;
}

class AuthService {
  /**
   * Register a new user with email/password
   */
  async register(input: RegisterInput): Promise<AuthResult> {
    const { email, username, password, displayName = username } = input;

    // Check if email exists
    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      throw AppError.conflict('Email already registered');
    }

    // Check if username exists
    const existingUsername = await User.findOne({
      username: username.toLowerCase(),
    });
    if (existingUsername) {
      throw AppError.conflict('Username already taken');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Create user
    const user = await User.create({
      email: email.toLowerCase(),
      username: username.toLowerCase(),
      passwordHash,
      displayName,
      avatarUrl: this.generateAvatarUrl(username),
    });

    // Generate tokens
    const tokens = await this.generateTokens(user);

    return {
      user: this.sanitizeUser(user),
      tokens,
    };
  }

  /**
   * Login with email/password
   */
  async login(input: LoginInput): Promise<AuthResult> {
    const { email, password } = input;

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      throw AppError.unauthorized('Invalid email or password');
    }

    // Check password
    if (!user.passwordHash) {
      throw AppError.unauthorized('This account uses OAuth login');
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw AppError.unauthorized('Invalid email or password');
    }

    // Update last active
    user.lastActiveAt = new Date();
    await user.save();

    // Generate tokens
    const tokens = await this.generateTokens(user);

    return {
      user: this.sanitizeUser(user),
      tokens,
    };
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    try {
      // Verify refresh token
      const decoded = jwt.verify(
        refreshToken,
        env.REFRESH_TOKEN_SECRET
      ) as JwtPayload & { type: string };

      if (decoded.type !== 'refresh') {
        throw AppError.unauthorized('Invalid token type');
      }

      // Check if token is blacklisted
      const isBlacklisted = await cache.exists(
        `blacklist:refresh:${refreshToken}`
      );
      if (isBlacklisted) {
        throw AppError.unauthorized('Token has been revoked');
      }

      // Get user
      const user = await User.findById(decoded.userId);
      if (!user) {
        throw AppError.unauthorized('User not found');
      }

      // Blacklist old refresh token
      await cache.set(
        `blacklist:refresh:${refreshToken}`,
        true,
        REFRESH_TOKEN_EXPIRY_SECONDS
      );

      // Generate new tokens
      return this.generateTokens(user);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw AppError.unauthorized('Invalid refresh token');
    }
  }

  /**
   * Logout - blacklist the access token
   */
  async logout(accessToken: string, refreshToken?: string): Promise<void> {
    try {
      // Decode token to get expiry
      const decoded = jwt.decode(accessToken) as JwtPayload;
      if (decoded?.exp) {
        const ttl = decoded.exp - Math.floor(Date.now() / 1000);
        if (ttl > 0) {
          await cache.set(`blacklist:${accessToken}`, true, ttl);
        }
      }

      // Also blacklist refresh token if provided
      if (refreshToken) {
        await cache.set(
          `blacklist:refresh:${refreshToken}`,
          true,
          REFRESH_TOKEN_EXPIRY_SECONDS
        );
      }
    } catch {
      // Ignore errors during logout
    }
  }

  /**
   * Get current user by ID
   */
  async getCurrentUser(userId: string): Promise<Partial<IUser> | null> {
    const user = await User.findById(userId);
    return user ? this.sanitizeUser(user) : null;
  }

  /**
   * Update password
   */
  async updatePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const user = await User.findById(userId);
    if (!user) {
      throw AppError.notFound('User');
    }

    if (!user.passwordHash) {
      throw AppError.badRequest('Cannot update password for OAuth accounts');
    }

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      throw AppError.unauthorized('Current password is incorrect');
    }

    user.passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await user.save();
  }

  /**
   * OAuth login/register (GitHub)
   */
  async oauthLogin(
    provider: 'github' | 'google',
    profile: {
      id: string;
      email: string;
      name: string;
      avatarUrl?: string;
    }
  ): Promise<AuthResult> {
    const providerIdField = provider === 'github' ? 'githubId' : 'googleId';

    // Try to find existing user by provider ID
    let user = await User.findOne({ [providerIdField]: profile.id });

    if (!user) {
      // Try to find by email
      user = await User.findOne({ email: profile.email.toLowerCase() });

      if (user) {
        // Link OAuth to existing account
        (user as any)[providerIdField] = profile.id;
        if (profile.avatarUrl && !user.avatarUrl) {
          user.avatarUrl = profile.avatarUrl;
        }
        await user.save();
      } else {
        // Create new user
        const username = await this.generateUniqueUsername(profile.name);
        user = await User.create({
          email: profile.email.toLowerCase(),
          username,
          displayName: profile.name,
          avatarUrl: profile.avatarUrl || this.generateAvatarUrl(username),
          [providerIdField]: profile.id,
        });
      }
    }

    // Update last active
    user.lastActiveAt = new Date();
    await user.save();

    // Generate tokens
    const tokens = await this.generateTokens(user);

    return {
      user: this.sanitizeUser(user),
      tokens,
    };
  }

  // ── Private Helper Methods ──

  private async generateTokens(user: IUser): Promise<AuthTokens> {
    const payload: JwtPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: 'user', // Default role
    };

    const accessToken = jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    });

    const refreshToken = jwt.sign(
      { ...payload, type: 'refresh' },
      env.REFRESH_TOKEN_SECRET,
      {
        expiresIn: env.REFRESH_TOKEN_EXPIRES_IN as jwt.SignOptions['expiresIn'],
      }
    );

    // Parse expiry for response
    const decoded = jwt.decode(accessToken) as { exp: number };
    const expiresIn = decoded.exp - Math.floor(Date.now() / 1000);

    return {
      accessToken,
      refreshToken,
      expiresIn,
    };
  }

  private sanitizeUser(user: IUser): Partial<IUser> {
    return {
      _id: user._id,
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      settings: user.settings,
      createdAt: user.createdAt,
      lastActiveAt: user.lastActiveAt,
    };
  }

  private generateAvatarUrl(username: string): string {
    // Use DiceBear or similar for default avatars
    return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(username)}&backgroundColor=6366f1`;
  }

  private async generateUniqueUsername(name: string): Promise<string> {
    // Clean and create base username
    const base = name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .slice(0, 20);

    let username = base || 'user';
    let counter = 0;

    while (await User.findOne({ username })) {
      counter++;
      username = `${base}${counter}`;
    }

    return username;
  }
}

export const authService = new AuthService();
