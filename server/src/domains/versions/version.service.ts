import mongoose from 'mongoose';
import { AppError } from '../../shared/errors/AppError.js';
import { projectRepository } from '../projects/project.repository.js';
import { ProjectVersion, type IProjectVersion } from './version.model.js';
import type {
  CreateVersionInput,
  ListVersionsInput,
} from './version.validation.js';

class VersionService {
  /**
   * Create a new version snapshot
   */
  async createVersion(
    projectId: string,
    userId: string,
    input: CreateVersionInput
  ): Promise<IProjectVersion> {
    // Check access
    const access = await projectRepository.checkAccess(
      projectId,
      userId,
      'editor'
    );
    if (!access.hasAccess) {
      throw AppError.forbidden('You do not have permission to create versions');
    }

    const project = await projectRepository.findById(projectId);
    if (!project) {
      throw AppError.notFound('Project', projectId);
    }

    // Get next version number
    const versionNumber = await (ProjectVersion as any).getNextVersionNumber(
      new mongoose.Types.ObjectId(projectId)
    );

    // Create version with deep copy of file tree
    const version = await ProjectVersion.create({
      projectId: new mongoose.Types.ObjectId(projectId),
      versionNumber,
      fileTreeSnapshot: JSON.parse(JSON.stringify(project.fileTree)),
      createdBy: new mongoose.Types.ObjectId(userId),
      message: input.message || `Version ${versionNumber}`,
      tags: input.tags || [],
    });

    return version;
  }

  /**
   * List versions for a project
   */
  async listVersions(
    projectId: string,
    userId: string | null,
    options: ListVersionsInput
  ): Promise<{
    versions: IProjectVersion[];
    total: number;
    page: number;
    perPage: number;
  }> {
    // Check access
    const access = await projectRepository.checkAccess(projectId, userId);
    if (!access.hasAccess) {
      throw AppError.forbidden('You do not have access to this project');
    }

    const skip = ((options.page || 1) - 1) * (options.perPage || 20);

    const [versions, total] = await Promise.all([
      ProjectVersion.find({ projectId })
        .sort({ versionNumber: -1 })
        .skip(skip)
        .limit(options.perPage || 20)
        .populate('createdBy', 'username displayName avatarUrl')
        .select('-fileTreeSnapshot') // Don't include full snapshot in list
        .lean(),
      ProjectVersion.countDocuments({ projectId }),
    ]);

    return {
      versions: versions as IProjectVersion[],
      total,
      page: options.page || 1,
      perPage: options.perPage || 20,
    };
  }

  /**
   * Get a specific version with full snapshot
   */
  async getVersion(
    projectId: string,
    versionId: string,
    userId: string | null
  ): Promise<IProjectVersion> {
    // Check access
    const access = await projectRepository.checkAccess(projectId, userId);
    if (!access.hasAccess) {
      throw AppError.forbidden('You do not have access to this project');
    }

    const version = await ProjectVersion.findOne({
      _id: versionId,
      projectId,
    }).populate('createdBy', 'username displayName avatarUrl');

    if (!version) {
      throw AppError.notFound('Version', versionId);
    }

    return version;
  }

  /**
   * Restore a version (replace current project with snapshot)
   */
  async restoreVersion(
    projectId: string,
    versionId: string,
    userId: string
  ): Promise<void> {
    // Check access - need editor role
    const access = await projectRepository.checkAccess(
      projectId,
      userId,
      'editor'
    );
    if (!access.hasAccess) {
      throw AppError.forbidden(
        'You do not have permission to restore versions'
      );
    }

    const version = await ProjectVersion.findOne({
      _id: versionId,
      projectId,
    });

    if (!version) {
      throw AppError.notFound('Version', versionId);
    }

    // Replace current file tree with snapshot
    await projectRepository.updateFileTree(projectId, version.fileTreeSnapshot);
  }

  /**
   * Delete a version
   */
  async deleteVersion(
    projectId: string,
    versionId: string,
    userId: string
  ): Promise<void> {
    // Only owner can delete versions
    const project = await projectRepository.findById(projectId);
    if (!project) {
      throw AppError.notFound('Project', projectId);
    }

    if (project.ownerId.toString() !== userId) {
      throw AppError.forbidden('Only the owner can delete versions');
    }

    const result = await ProjectVersion.findOneAndDelete({
      _id: versionId,
      projectId,
    });

    if (!result) {
      throw AppError.notFound('Version', versionId);
    }
  }

  /**
   * Compare two versions (returns diff info)
   */
  async compareVersions(
    projectId: string,
    versionId1: string,
    versionId2: string,
    userId: string | null
  ): Promise<{
    added: string[];
    removed: string[];
    modified: string[];
  }> {
    // Check access
    const access = await projectRepository.checkAccess(projectId, userId);
    if (!access.hasAccess) {
      throw AppError.forbidden('You do not have access to this project');
    }

    const [v1, v2] = await Promise.all([
      ProjectVersion.findOne({ _id: versionId1, projectId }),
      ProjectVersion.findOne({ _id: versionId2, projectId }),
    ]);

    if (!v1 || !v2) {
      throw AppError.notFound('Version');
    }

    // Extract file paths and contents
    const getFiles = (tree: any[]): Map<string, string> => {
      const files = new Map<string, string>();
      const traverse = (nodes: any[]) => {
        for (const node of nodes) {
          if (node.type === 'file') {
            files.set(node.path, node.content || '');
          }
          if (node.children) {
            traverse(node.children);
          }
        }
      };
      traverse(tree);
      return files;
    };

    const files1 = getFiles(v1.fileTreeSnapshot);
    const files2 = getFiles(v2.fileTreeSnapshot);

    const added: string[] = [];
    const removed: string[] = [];
    const modified: string[] = [];

    // Find added files (in v2 but not in v1)
    for (const path of files2.keys()) {
      if (!files1.has(path)) {
        added.push(path);
      }
    }

    // Find removed and modified files
    for (const [path, content] of files1) {
      if (!files2.has(path)) {
        removed.push(path);
      } else if (files2.get(path) !== content) {
        modified.push(path);
      }
    }

    return { added, removed, modified };
  }
}

export const versionService = new VersionService();
