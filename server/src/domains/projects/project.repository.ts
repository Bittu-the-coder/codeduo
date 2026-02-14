import mongoose from 'mongoose';
import { Project, type IFileNode, type IProject } from './project.model.js';

export interface ProjectQueryOptions {
  page: number;
  perPage: number;
  visibility?: 'private' | 'public' | 'unlisted' | 'all';
  language?: string;
  search?: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

class ProjectRepository {
  /**
   * Create a new project
   */
  async create(data: Partial<IProject>): Promise<IProject> {
    const project = new Project(data);
    return project.save();
  }

  /**
   * Find project by ID
   */
  async findById(id: string): Promise<IProject | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return Project.findById(id);
  }

  /**
   * Find project by ID with owner info
   */
  async findByIdWithOwner(id: string): Promise<IProject | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return Project.findById(id).populate(
      'ownerId',
      'username displayName avatarUrl'
    );
  }

  /**
   * Find projects by owner
   */
  async findByOwner(
    ownerId: string,
    options: ProjectQueryOptions
  ): Promise<{ projects: IProject[]; total: number }> {
    const filter: Record<string, unknown> = { ownerId };

    if (options.visibility && options.visibility !== 'all') {
      filter.visibility = options.visibility;
    }

    if (options.language) {
      filter.language = options.language;
    }

    if (options.search) {
      filter.$text = { $search: options.search };
    }

    const sort: Record<string, 1 | -1> = {
      [options.sortBy]: options.sortOrder === 'asc' ? 1 : -1,
    };

    const skip = (options.page - 1) * options.perPage;

    const [projects, total] = await Promise.all([
      Project.find(filter).sort(sort).skip(skip).limit(options.perPage).lean(),
      Project.countDocuments(filter),
    ]);

    return { projects: projects as IProject[], total };
  }

  /**
   * Find projects user can access (owner + collaborator)
   */
  async findAccessible(
    userId: string,
    options: ProjectQueryOptions
  ): Promise<{ projects: IProject[]; total: number }> {
    const filter: Record<string, unknown> = {
      $or: [
        { ownerId: userId },
        { 'collaborators.userId': new mongoose.Types.ObjectId(userId) },
      ],
    };

    if (options.visibility && options.visibility !== 'all') {
      filter.visibility = options.visibility;
    }

    if (options.language) {
      filter.language = options.language;
    }

    if (options.search) {
      filter.$text = { $search: options.search };
    }

    const sort: Record<string, 1 | -1> = {
      [options.sortBy]: options.sortOrder === 'asc' ? 1 : -1,
    };

    const skip = (options.page - 1) * options.perPage;

    const [projects, total] = await Promise.all([
      Project.find(filter).sort(sort).skip(skip).limit(options.perPage).lean(),
      Project.countDocuments(filter),
    ]);

    return { projects: projects as IProject[], total };
  }

  /**
   * Find public projects
   */
  async findPublic(
    options: ProjectQueryOptions
  ): Promise<{ projects: IProject[]; total: number }> {
    const filter: Record<string, unknown> = { visibility: 'public' };

    if (options.language) {
      filter.language = options.language;
    }

    if (options.search) {
      filter.$text = { $search: options.search };
    }

    const sort: Record<string, 1 | -1> = {
      [options.sortBy]: options.sortOrder === 'asc' ? 1 : -1,
    };

    const skip = (options.page - 1) * options.perPage;

    const [projects, total] = await Promise.all([
      Project.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(options.perPage)
        .populate('ownerId', 'username displayName avatarUrl')
        .lean(),
      Project.countDocuments(filter),
    ]);

    return { projects: projects as IProject[], total };
  }

  /**
   * Update project by ID
   */
  async updateById(
    id: string,
    data: Partial<IProject>
  ): Promise<IProject | null> {
    return Project.findByIdAndUpdate(
      id,
      { ...data, lastEditedAt: new Date() },
      { new: true, runValidators: true }
    );
  }

  /**
   * Delete project by ID
   */
  async deleteById(id: string): Promise<boolean> {
    const result = await Project.findByIdAndDelete(id);
    return !!result;
  }

  /**
   * Update file tree
   */
  async updateFileTree(
    id: string,
    fileTree: IFileNode[]
  ): Promise<IProject | null> {
    return Project.findByIdAndUpdate(
      id,
      { fileTree, lastEditedAt: new Date() },
      { new: true, runValidators: true }
    );
  }

  /**
   * Increment view count
   */
  async incrementViewCount(id: string): Promise<void> {
    await Project.findByIdAndUpdate(id, { $inc: { viewCount: 1 } });
  }

  /**
   * Increment fork count
   */
  async incrementForkCount(id: string): Promise<void> {
    await Project.findByIdAndUpdate(id, { $inc: { forkCount: 1 } });
  }

  /**
   * Add collaborator
   */
  async addCollaborator(
    projectId: string,
    userId: string,
    role: 'editor' | 'viewer'
  ): Promise<IProject | null> {
    return Project.findByIdAndUpdate(
      projectId,
      {
        $addToSet: {
          collaborators: {
            userId: new mongoose.Types.ObjectId(userId),
            role,
            addedAt: new Date(),
          },
        },
      },
      { new: true }
    );
  }

  /**
   * Remove collaborator
   */
  async removeCollaborator(
    projectId: string,
    userId: string
  ): Promise<IProject | null> {
    return Project.findByIdAndUpdate(
      projectId,
      {
        $pull: {
          collaborators: { userId: new mongoose.Types.ObjectId(userId) },
        },
      },
      { new: true }
    );
  }

  /**
   * Check if user has access to project
   */
  async checkAccess(
    projectId: string,
    userId: string | null,
    requiredRole?: 'editor' | 'viewer'
  ): Promise<{
    hasAccess: boolean;
    role: 'owner' | 'editor' | 'viewer' | 'public' | null;
  }> {
    const project = await this.findById(projectId);
    if (!project) return { hasAccess: false, role: null };

    // Public projects are viewable by anyone
    if (project.visibility === 'public' && !requiredRole) {
      return { hasAccess: true, role: userId ? 'public' : 'public' };
    }

    if (!userId) return { hasAccess: false, role: null };

    // Owner has full access
    if (project.ownerId.toString() === userId) {
      return { hasAccess: true, role: 'owner' };
    }

    // Check collaborator role
    const collaborator = project.collaborators.find(
      c => c.userId.toString() === userId
    );

    if (!collaborator) {
      // Only public projects are accessible without collaboration
      if (project.visibility === 'public') {
        return { hasAccess: true, role: 'public' };
      }
      return { hasAccess: false, role: null };
    }

    // Check if role meets requirement
    if (requiredRole === 'editor' && collaborator.role !== 'editor') {
      return { hasAccess: false, role: 'viewer' };
    }

    return { hasAccess: true, role: collaborator.role };
  }
}

export const projectRepository = new ProjectRepository();
