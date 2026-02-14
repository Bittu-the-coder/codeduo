// ── User Types ──
export interface User {
  id: string;
  email: string;
  username: string;
  displayName?: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthUser extends User {
  accessToken: string;
}

// ── Auth Types ──
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  username: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  data: {
    user: User;
    accessToken: string;
  };
}

// ── File Types ──
export interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  content?: string;
  language?: string;
  children?: FileNode[];
  parentId?: string;
  createdAt: string;
  updatedAt: string;
}

// Simplified file tree node for project storage (no id/timestamps required)
export interface FileTreeNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  content?: string;
  language?: string;
  children?: FileTreeNode[];
}

export interface FileTreeItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  path: string;
  depth: number;
  expanded?: boolean;
  children?: FileTreeItem[];
}

// ── Project Types ──
export interface Project {
  _id: string;
  title: string;
  description?: string;
  ownerId: string;
  ownerUsername?: string;
  collaborators: Collaborator[];
  fileTree: FileNode[];
  language: string;
  visibility: 'private' | 'public' | 'unlisted';
  forkedFrom?: string;
  forkCount: number;
  viewCount: number;
  starCount: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  lastEditedAt: string;
}

export interface ProjectSummary {
  _id: string;
  title: string;
  description?: string;
  language: string;
  visibility: 'private' | 'public' | 'unlisted';
  ownerId: string;
  ownerUsername?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Collaborator {
  user: User;
  role: 'viewer' | 'editor' | 'admin';
  joinedAt: string;
}

export interface CreateProjectInput {
  title: string;
  description?: string;
  language?: string;
  visibility?: 'private' | 'public' | 'unlisted';
  tags?: string[];
  template?: 'cpp' | 'python' | 'javascript' | 'java' | 'typescript' | 'empty';
}

export interface UpdateProjectInput {
  title?: string;
  description?: string;
  visibility?: 'private' | 'public' | 'unlisted';
  language?: string;
  tags?: string[];
  fileTree?: FileTreeNode[];
}

// ── Version Types ──
export interface Version {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  snapshot: FileNode;
  createdBy: User;
  createdAt: string;
}

export interface CreateVersionInput {
  name: string;
  description?: string;
}

// ── Collaboration Types ──
export interface Participant {
  id: string;
  username: string;
  displayName?: string;
  avatar?: string;
  color: string;
  cursorPosition?: CursorPosition;
  isOnline: boolean;
}

export interface CursorPosition {
  lineNumber: number;
  column: number;
  fileId: string;
}

export interface CollaborationSession {
  projectId: string;
  participants: Participant[];
  activeFile?: string;
}

// ── Code Execution Types ──
export interface ExecutionRequest {
  language: string;
  code: string;
  stdin?: string;
}

export interface ExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  executionTime: number;
  memoryUsage?: number;
}

// ── API Response Types ──
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: ApiError;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ── Editor Types ──
export interface EditorSettings {
  fontSize: number;
  tabSize: number;
  theme: string;
  wordWrap: boolean;
  minimap: boolean;
  lineNumbers: boolean;
}

export interface EditorTab {
  fileId: string;
  name: string;
  path: string;
  isDirty: boolean;
}
