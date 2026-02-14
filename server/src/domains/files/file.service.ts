import { AppError } from '../../shared/errors/AppError.js';
import { type IFileNode } from '../projects/project.model.js';
import { projectRepository } from '../projects/project.repository.js';
import type {
  CreateFileInput,
  MoveFileInput,
  UpdateFileInput,
} from './file.validation.js';

// Language detection based on file extension
const EXTENSION_LANGUAGE_MAP: Record<string, string> = {
  '.cpp': 'cpp',
  '.cc': 'cpp',
  '.cxx': 'cpp',
  '.c': 'c',
  '.h': 'c',
  '.hpp': 'cpp',
  '.py': 'python',
  '.js': 'javascript',
  '.ts': 'typescript',
  '.tsx': 'typescript',
  '.jsx': 'javascript',
  '.java': 'java',
  '.go': 'go',
  '.rs': 'rust',
  '.rb': 'ruby',
  '.php': 'php',
  '.cs': 'csharp',
  '.swift': 'swift',
  '.kt': 'kotlin',
  '.scala': 'scala',
  '.html': 'html',
  '.css': 'css',
  '.scss': 'scss',
  '.json': 'json',
  '.md': 'markdown',
  '.sql': 'sql',
  '.sh': 'shell',
  '.bash': 'shell',
  '.yml': 'yaml',
  '.yaml': 'yaml',
  '.xml': 'xml',
  '.txt': 'plaintext',
};

function getLanguageFromPath(path: string): string {
  const ext = '.' + path.split('.').pop()?.toLowerCase();
  return EXTENSION_LANGUAGE_MAP[ext] || 'plaintext';
}

function getNameFromPath(path: string): string {
  return path.split('/').pop() || path;
}

class FileService {
  /**
   * Get file content by path
   */
  async getFile(
    projectId: string,
    userId: string | null,
    path: string
  ): Promise<IFileNode | null> {
    const access = await projectRepository.checkAccess(projectId, userId);
    if (!access.hasAccess) {
      throw AppError.forbidden('You do not have access to this project');
    }

    const project = await projectRepository.findById(projectId);
    if (!project) {
      throw AppError.notFound('Project', projectId);
    }

    return this.findFileInTree(project.fileTree, path);
  }

  /**
   * Create a new file or folder
   */
  async createFile(
    projectId: string,
    userId: string,
    input: CreateFileInput
  ): Promise<IFileNode> {
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

    const project = await projectRepository.findById(projectId);
    if (!project) {
      throw AppError.notFound('Project', projectId);
    }

    // Check if file already exists
    const existing = this.findFileInTree(project.fileTree, input.path);
    if (existing) {
      throw AppError.conflict(`File already exists at path: ${input.path}`);
    }

    // Create the file node
    const newFile: IFileNode = {
      type: input.type,
      name: getNameFromPath(input.path),
      path: input.path,
      content: input.type === 'file' ? input.content || '' : undefined,
      language:
        input.type === 'file'
          ? input.language || getLanguageFromPath(input.path)
          : undefined,
      children: input.type === 'folder' ? [] : undefined,
    };

    // Insert into tree
    const updatedTree = this.insertIntoTree([...project.fileTree], newFile);

    await projectRepository.updateFileTree(projectId, updatedTree);

    return newFile;
  }

  /**
   * Update file content
   */
  async updateFile(
    projectId: string,
    userId: string,
    path: string,
    input: UpdateFileInput
  ): Promise<IFileNode> {
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

    const project = await projectRepository.findById(projectId);
    if (!project) {
      throw AppError.notFound('Project', projectId);
    }

    const file = this.findFileInTree(project.fileTree, path);
    if (!file) {
      throw AppError.notFound('File', path);
    }

    if (file.type !== 'file') {
      throw AppError.badRequest('Cannot update content of a folder');
    }

    // Update file content
    const updatedTree = this.updateFileInTree([...project.fileTree], path, {
      content: input.content,
    });

    await projectRepository.updateFileTree(projectId, updatedTree);

    return { ...file, content: input.content };
  }

  /**
   * Delete file or folder
   */
  async deleteFile(
    projectId: string,
    userId: string,
    path: string
  ): Promise<void> {
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

    const project = await projectRepository.findById(projectId);
    if (!project) {
      throw AppError.notFound('Project', projectId);
    }

    const file = this.findFileInTree(project.fileTree, path);
    if (!file) {
      throw AppError.notFound('File', path);
    }

    const updatedTree = this.removeFromTree([...project.fileTree], path);

    await projectRepository.updateFileTree(projectId, updatedTree);
  }

  /**
   * Move/rename file or folder
   */
  async moveFile(
    projectId: string,
    userId: string,
    oldPath: string,
    input: MoveFileInput
  ): Promise<IFileNode> {
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

    const project = await projectRepository.findById(projectId);
    if (!project) {
      throw AppError.notFound('Project', projectId);
    }

    const file = this.findFileInTree(project.fileTree, oldPath);
    if (!file) {
      throw AppError.notFound('File', oldPath);
    }

    // Check if new path already exists
    const existing = this.findFileInTree(project.fileTree, input.newPath);
    if (existing) {
      throw AppError.conflict(`File already exists at path: ${input.newPath}`);
    }

    // Remove from old location
    let updatedTree = this.removeFromTree([...project.fileTree], oldPath);

    // Update the file with new path
    const movedFile: IFileNode = {
      ...file,
      path: input.newPath,
      name: getNameFromPath(input.newPath),
      language:
        file.type === 'file' ? getLanguageFromPath(input.newPath) : undefined,
    };

    // If it's a folder, update all children paths
    if (movedFile.type === 'folder' && movedFile.children) {
      movedFile.children = this.updateChildrenPaths(
        movedFile.children,
        oldPath,
        input.newPath
      );
    }

    // Insert at new location
    updatedTree = this.insertIntoTree(updatedTree, movedFile);

    await projectRepository.updateFileTree(projectId, updatedTree);

    return movedFile;
  }

  // ── Private Helper Methods ──

  private findFileInTree(tree: IFileNode[], path: string): IFileNode | null {
    for (const node of tree) {
      if (node.path === path) {
        return node;
      }
      if (node.type === 'folder' && node.children) {
        const found = this.findFileInTree(node.children, path);
        if (found) return found;
      }
    }
    return null;
  }

  private insertIntoTree(tree: IFileNode[], file: IFileNode): IFileNode[] {
    const pathParts = file.path.split('/');

    // Root level file
    if (pathParts.length === 1) {
      return [...tree, file];
    }

    // Find or create parent folders
    const parentPath = pathParts.slice(0, -1).join('/');
    let parentFound = false;

    const newTree = tree.map(node => {
      if (node.type === 'folder' && file.path.startsWith(node.path + '/')) {
        parentFound = true;
        return {
          ...node,
          children: this.insertIntoTree(node.children || [], file),
        };
      }
      return node;
    });

    if (!parentFound) {
      // Create parent folder
      const parentFolder: IFileNode = {
        type: 'folder',
        name: pathParts[0],
        path: pathParts[0],
        children: [],
      };

      if (pathParts.length === 2) {
        parentFolder.children = [file];
      } else {
        parentFolder.children = this.insertIntoTree([], file);
      }

      return [...newTree, parentFolder];
    }

    return newTree;
  }

  private removeFromTree(tree: IFileNode[], path: string): IFileNode[] {
    return tree
      .filter(node => node.path !== path)
      .map(node => {
        if (node.type === 'folder' && node.children) {
          return {
            ...node,
            children: this.removeFromTree(node.children, path),
          };
        }
        return node;
      });
  }

  private updateFileInTree(
    tree: IFileNode[],
    path: string,
    updates: Partial<IFileNode>
  ): IFileNode[] {
    return tree.map(node => {
      if (node.path === path) {
        return { ...node, ...updates };
      }
      if (node.type === 'folder' && node.children) {
        return {
          ...node,
          children: this.updateFileInTree(node.children, path, updates),
        };
      }
      return node;
    });
  }

  private updateChildrenPaths(
    children: IFileNode[],
    oldBasePath: string,
    newBasePath: string
  ): IFileNode[] {
    return children.map(child => {
      const newPath = child.path.replace(oldBasePath, newBasePath);
      const updated: IFileNode = {
        ...child,
        path: newPath,
      };
      if (child.type === 'folder' && child.children) {
        updated.children = this.updateChildrenPaths(
          child.children,
          oldBasePath,
          newBasePath
        );
      }
      return updated;
    });
  }
}

export const fileService = new FileService();
