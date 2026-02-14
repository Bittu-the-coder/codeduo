import { AppError } from '../../shared/errors/AppError.js';
import { User, type IUser } from './user.model.js';
import type { SearchUsersInput, UpdateUserInput } from './user.validation.js';

class UserService {
  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<Partial<IUser>> {
    const user = await User.findById(userId).select('-passwordHash');
    if (!user) {
      throw AppError.notFound('User', userId);
    }
    return user;
  }

  /**
   * Get user by username
   */
  async getUserByUsername(username: string): Promise<Partial<IUser>> {
    const user = await User.findOne({
      username: username.toLowerCase(),
    }).select('-passwordHash');
    if (!user) {
      throw AppError.notFound('User');
    }
    return user;
  }

  /**
   * Update user profile
   */
  async updateUser(
    userId: string,
    input: UpdateUserInput
  ): Promise<Partial<IUser>> {
    const user = await User.findById(userId);
    if (!user) {
      throw AppError.notFound('User', userId);
    }

    if (input.displayName) user.displayName = input.displayName;
    if (input.avatarUrl) user.avatarUrl = input.avatarUrl;
    if (input.settings) {
      user.settings = { ...user.settings, ...input.settings };
    }

    await user.save();
    return this.sanitizeUser(user);
  }

  /**
   * Search users by username or display name
   */
  async searchUsers(
    input: SearchUsersInput
  ): Promise<{
    users: Partial<IUser>[];
    total: number;
    page: number;
    perPage: number;
  }> {
    const regex = new RegExp(input.query, 'i');
    const filter = {
      $or: [{ username: regex }, { displayName: regex }],
    };

    const skip = ((input.page || 1) - 1) * (input.perPage || 10);

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('username displayName avatarUrl')
        .skip(skip)
        .limit(input.perPage || 10)
        .lean(),
      User.countDocuments(filter),
    ]);

    return {
      users,
      total,
      page: input.page || 1,
      perPage: input.perPage || 10,
    };
  }

  /**
   * Get user's public profile (username route)
   */
  async getPublicProfile(
    username: string
  ): Promise<Partial<IUser> & { projectCount: number }> {
    const user = await User.findOne({ username: username.toLowerCase() })
      .select('username displayName avatarUrl createdAt')
      .lean();

    if (!user) {
      throw AppError.notFound('User');
    }

    // Count public projects
    const { Project } = await import('../projects/project.model.js');
    const projectCount = await Project.countDocuments({
      ownerId: user._id,
      visibility: 'public',
    });

    return { ...user, projectCount };
  }

  /**
   * Delete user account
   */
  async deleteUser(userId: string): Promise<void> {
    const user = await User.findById(userId);
    if (!user) {
      throw AppError.notFound('User', userId);
    }

    // Delete all user's projects
    const { Project } = await import('../projects/project.model.js');
    await Project.deleteMany({ ownerId: userId });

    // Delete user
    await User.findByIdAndDelete(userId);
  }

  // ── Private Helpers ──

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
}

export const userService = new UserService();
