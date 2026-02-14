import mongoose from 'mongoose';
import { AppError } from '../../shared/errors/AppError.js';
import { User } from '../users/user.model.js';
import { Project, type IFileNode, type IProject } from './project.model.js';
import { projectRepository } from './project.repository.js';
import type {
  AddCollaboratorInput,
  CreateProjectInput,
  ForkProjectInput,
  ListProjectsInput,
  UpdateProjectInput,
} from './project.validation.js';

// Template files for different languages
const TEMPLATES: Record<string, IFileNode[]> = {
  cpp: [
    {
      type: 'file',
      name: 'main.cpp',
      path: 'main.cpp',
      content: `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    cout << "Hello, CodeDuo!" << endl;

    return 0;
}`,
      language: 'cpp',
    },
  ],
  python: [
    {
      type: 'file',
      name: 'main.py',
      path: 'main.py',
      content: `import sys
from collections import defaultdict, deque

def main():
    print("Hello, CodeDuo!")

if __name__ == "__main__":
    main()`,
      language: 'python',
    },
  ],
  javascript: [
    {
      type: 'file',
      name: 'index.js',
      path: 'index.js',
      content: `// CodeDuo - JavaScript Template
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log("Hello, CodeDuo!");`,
      language: 'javascript',
    },
  ],
  typescript: [
    {
      type: 'file',
      name: 'index.ts',
      path: 'index.ts',
      content: `// CodeDuo - TypeScript Template
const greeting: string = "Hello, CodeDuo!";
console.log(greeting);`,
      language: 'typescript',
    },
  ],
  java: [
    {
      type: 'file',
      name: 'Main.java',
      path: 'Main.java',
      content: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        System.out.println("Hello, CodeDuo!");
    }
}`,
      language: 'java',
    },
  ],
  empty: [],
};

class ProjectService {
  /**
   * Create a new project
   */
  async create(userId: string, input: CreateProjectInput): Promise<IProject> {
    const user = await User.findById(userId);
    if (!user) {
      throw AppError.notFound('User', userId);
    }

    const fileTree = TEMPLATES[input.template || 'cpp'] || TEMPLATES.cpp;

    const project = await projectRepository.create({
      title: input.title,
      description: input.description || '',
      ownerId: new mongoose.Types.ObjectId(userId),
      ownerUsername: user.username,
      visibility: input.visibility || 'public',
      language: input.language || input.template || 'cpp',
      tags: input.tags || [],
      fileTree: JSON.parse(JSON.stringify(fileTree)), // Deep clone
    });

    // Add project to user's project list
    await User.findByIdAndUpdate(userId, {
      $push: { projects: project._id },
    });

    return project;
  }

  /**
   * Get project by ID (with access check)
   */
  async getById(
    projectId: string,
    userId: string | null,
    incrementView = false
  ): Promise<IProject> {
    const access = await projectRepository.checkAccess(projectId, userId);

    if (!access.hasAccess) {
      throw AppError.forbidden('You do not have access to this project');
    }

    const project = await projectRepository.findByIdWithOwner(projectId);
    if (!project) {
      throw AppError.notFound('Project', projectId);
    }

    // Increment view count for non-owners
    if (incrementView && access.role !== 'owner') {
      await projectRepository.incrementViewCount(projectId);
    }

    return project;
  }

  /**
   * List user's projects
   */
  async listUserProjects(
    userId: string,
    options: ListProjectsInput
  ): Promise<{
    projects: IProject[];
    total: number;
    page: number;
    perPage: number;
  }> {
    const result = await projectRepository.findAccessible(userId, {
      page: options.page || 1,
      perPage: options.perPage || 20,
      visibility: options.visibility as any,
      language: options.language,
      search: options.search,
      sortBy: options.sortBy || 'updatedAt',
      sortOrder: options.sortOrder || 'desc',
    });

    return {
      ...result,
      page: options.page || 1,
      perPage: options.perPage || 20,
    };
  }

  /**
   * List public projects
   */
  async listPublicProjects(
    options: ListProjectsInput
  ): Promise<{
    projects: IProject[];
    total: number;
    page: number;
    perPage: number;
  }> {
    const result = await projectRepository.findPublic({
      page: options.page || 1,
      perPage: options.perPage || 20,
      language: options.language,
      search: options.search,
      sortBy: options.sortBy || 'updatedAt',
      sortOrder: options.sortOrder || 'desc',
    });

    return {
      ...result,
      page: options.page || 1,
      perPage: options.perPage || 20,
    };
  }

  /**
   * Update project
   */
  async update(
    projectId: string,
    userId: string,
    input: UpdateProjectInput
  ): Promise<IProject> {
    const access = await projectRepository.checkAccess(
      projectId,
      userId,
      'editor'
    );

    if (
      !access.hasAccess ||
      (access.role !== 'owner' && access.role !== 'editor')
    ) {
      throw AppError.forbidden(
        'You do not have permission to edit this project'
      );
    }

    const project = await projectRepository.updateById(projectId, input);
    if (!project) {
      throw AppError.notFound('Project', projectId);
    }

    return project;
  }

  /**
   * Delete project
   */
  async delete(projectId: string, userId: string): Promise<void> {
    const project = await projectRepository.findById(projectId);
    if (!project) {
      throw AppError.notFound('Project', projectId);
    }

    // Only owner can delete
    if (project.ownerId.toString() !== userId) {
      throw AppError.forbidden('Only the owner can delete this project');
    }

    await projectRepository.deleteById(projectId);

    // Remove from user's project list
    await User.findByIdAndUpdate(userId, {
      $pull: { projects: new mongoose.Types.ObjectId(projectId) },
    });
  }

  /**
   * Fork project
   */
  async fork(
    projectId: string,
    userId: string,
    input: ForkProjectInput
  ): Promise<IProject> {
    const originalProject = await this.getById(projectId, userId);

    const user = await User.findById(userId);
    if (!user) {
      throw AppError.notFound('User', userId);
    }

    // Create forked project
    const forkedProject = await projectRepository.create({
      title: input.title || `${originalProject.title} (Fork)`,
      description: originalProject.description,
      ownerId: new mongoose.Types.ObjectId(userId),
      ownerUsername: user.username,
      visibility: input.visibility || 'private',
      language: originalProject.language,
      tags: [...originalProject.tags],
      fileTree: JSON.parse(JSON.stringify(originalProject.fileTree)),
      forkedFrom: originalProject._id,
    });

    // Increment fork count on original
    await projectRepository.incrementForkCount(projectId);

    // Add to user's projects
    await User.findByIdAndUpdate(userId, {
      $push: { projects: forkedProject._id },
    });

    return forkedProject;
  }

  /**
   * Get collaborators
   */
  async getCollaborators(projectId: string, userId: string) {
    const access = await projectRepository.checkAccess(projectId, userId);

    if (!access.hasAccess) {
      throw AppError.forbidden('You do not have access to this project');
    }

    const project = await Project.findById(projectId)
      .populate('collaborators.userId', 'username displayName avatarUrl email')
      .select('collaborators ownerId');

    if (!project) {
      throw AppError.notFound('Project', projectId);
    }

    return project.collaborators;
  }

  /**
   * Add collaborator
   */
  async addCollaborator(
    projectId: string,
    ownerId: string,
    input: AddCollaboratorInput
  ): Promise<void> {
    const project = await projectRepository.findById(projectId);
    if (!project) {
      throw AppError.notFound('Project', projectId);
    }

    // Only owner can add collaborators
    if (project.ownerId.toString() !== ownerId) {
      throw AppError.forbidden('Only the owner can add collaborators');
    }

    // Check if user exists
    const userToAdd = await User.findById(input.userId);
    if (!userToAdd) {
      throw AppError.notFound('User', input.userId);
    }

    // Check if already a collaborator
    const existing = project.collaborators.find(
      c => c.userId.toString() === input.userId
    );
    if (existing) {
      throw AppError.conflict('User is already a collaborator');
    }

    await projectRepository.addCollaborator(
      projectId,
      input.userId,
      input.role || 'viewer'
    );
  }

  /**
   * Remove collaborator
   */
  async removeCollaborator(
    projectId: string,
    ownerId: string,
    collaboratorId: string
  ): Promise<void> {
    const project = await projectRepository.findById(projectId);
    if (!project) {
      throw AppError.notFound('Project', projectId);
    }

    // Only owner can remove collaborators
    if (project.ownerId.toString() !== ownerId) {
      throw AppError.forbidden('Only the owner can remove collaborators');
    }

    await projectRepository.removeCollaborator(projectId, collaboratorId);
  }

  /**
   * Update file tree
   */
  async updateFileTree(
    projectId: string,
    userId: string,
    fileTree: IFileNode[]
  ): Promise<IProject> {
    const access = await projectRepository.checkAccess(
      projectId,
      userId,
      'editor'
    );

    if (!access.hasAccess) {
      throw AppError.forbidden(
        'You do not have permission to edit this project'
      );
    }

    const project = await projectRepository.updateFileTree(projectId, fileTree);
    if (!project) {
      throw AppError.notFound('Project', projectId);
    }

    return project;
  }
}

export const projectService = new ProjectService();
