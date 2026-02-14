import type {
  ApiResponse,
  Collaborator,
  CreateProjectInput,
  CreateVersionInput,
  FileNode,
  PaginatedResponse,
  Project,
  ProjectSummary,
  UpdateProjectInput,
  Version,
} from '$lib/types';
import { api } from './api.service';

export const projectService = {
  // ── Project CRUD ──
  async getProjects(
    page = 1,
    limit = 10
  ): Promise<PaginatedResponse<ProjectSummary>> {
    const response = await api.get<PaginatedResponse<ProjectSummary>>(
      `/projects?page=${page}&limit=${limit}`
    );
    return response as unknown as PaginatedResponse<ProjectSummary>;
  },

  async getProject(id: string): Promise<ApiResponse<Project>> {
    return api.get<Project>(`/projects/${id}`);
  },

  async createProject(
    input: CreateProjectInput
  ): Promise<ApiResponse<Project>> {
    return api.post<Project>('/projects', input);
  },

  async updateProject(
    id: string,
    input: UpdateProjectInput
  ): Promise<ApiResponse<Project>> {
    return api.patch<Project>(`/projects/${id}`, input);
  },

  async deleteProject(id: string): Promise<ApiResponse<void>> {
    return api.delete<void>(`/projects/${id}`);
  },

  async forkProject(id: string, name?: string): Promise<ApiResponse<Project>> {
    return api.post<Project>(`/projects/${id}/fork`, { name });
  },

  // ── File Operations ──
  async getFiles(projectId: string): Promise<ApiResponse<FileNode>> {
    return api.get<FileNode>(`/projects/${projectId}/files`);
  },

  async createFile(
    projectId: string,
    parentId: string,
    name: string,
    type: 'file' | 'folder',
    content?: string
  ): Promise<ApiResponse<FileNode>> {
    return api.post<FileNode>(`/projects/${projectId}/files`, {
      parentId,
      name,
      type,
      content,
    });
  },

  async updateFile(
    projectId: string,
    fileId: string,
    content: string
  ): Promise<ApiResponse<FileNode>> {
    return api.patch<FileNode>(`/projects/${projectId}/files/${fileId}`, {
      content,
    });
  },

  async renameFile(
    projectId: string,
    fileId: string,
    name: string
  ): Promise<ApiResponse<FileNode>> {
    return api.patch<FileNode>(`/projects/${projectId}/files/${fileId}`, {
      name,
    });
  },

  async moveFile(
    projectId: string,
    fileId: string,
    newParentId: string
  ): Promise<ApiResponse<FileNode>> {
    return api.patch<FileNode>(`/projects/${projectId}/files/${fileId}/move`, {
      newParentId,
    });
  },

  async deleteFile(
    projectId: string,
    fileId: string
  ): Promise<ApiResponse<void>> {
    return api.delete<void>(`/projects/${projectId}/files/${fileId}`);
  },

  // ── Collaborators ──
  async getCollaborators(
    projectId: string
  ): Promise<ApiResponse<Collaborator[]>> {
    return api.get<Collaborator[]>(`/projects/${projectId}/collaborators`);
  },

  async addCollaborator(
    projectId: string,
    userId: string,
    role: 'viewer' | 'editor' | 'admin'
  ): Promise<ApiResponse<Collaborator>> {
    return api.post<Collaborator>(`/projects/${projectId}/collaborators`, {
      userId,
      role,
    });
  },

  async updateCollaborator(
    projectId: string,
    userId: string,
    role: 'viewer' | 'editor' | 'admin'
  ): Promise<ApiResponse<Collaborator>> {
    return api.patch<Collaborator>(
      `/projects/${projectId}/collaborators/${userId}`,
      { role }
    );
  },

  async removeCollaborator(
    projectId: string,
    userId: string
  ): Promise<ApiResponse<void>> {
    return api.delete<void>(`/projects/${projectId}/collaborators/${userId}`);
  },

  // ── Versions ──
  async getVersions(projectId: string): Promise<ApiResponse<Version[]>> {
    return api.get<Version[]>(`/projects/${projectId}/versions`);
  },

  async createVersion(
    projectId: string,
    input: CreateVersionInput
  ): Promise<ApiResponse<Version>> {
    return api.post<Version>(`/projects/${projectId}/versions`, input);
  },

  async getVersion(
    projectId: string,
    versionId: string
  ): Promise<ApiResponse<Version>> {
    return api.get<Version>(`/projects/${projectId}/versions/${versionId}`);
  },

  async restoreVersion(
    projectId: string,
    versionId: string
  ): Promise<ApiResponse<Project>> {
    return api.post<Project>(
      `/projects/${projectId}/versions/${versionId}/restore`
    );
  },
};
