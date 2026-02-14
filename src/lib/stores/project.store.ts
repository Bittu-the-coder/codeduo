import { projectService } from '$lib/services';
import type {
  CreateProjectInput,
  FileNode,
  Project,
  ProjectSummary,
  UpdateProjectInput,
} from '$lib/types';
import { derived, writable } from 'svelte/store';

interface ProjectState {
  projects: ProjectSummary[];
  currentProject: Project | null;
  isLoading: boolean;
  error: string | null;
  page: number;
  totalPages: number;
}

const initialState: ProjectState = {
  projects: [],
  currentProject: null,
  isLoading: false,
  error: null,
  page: 1,
  totalPages: 1,
};

function createProjectStore() {
  const { subscribe, set, update } = writable<ProjectState>(initialState);

  return {
    subscribe,

    async fetchProjects(page = 1) {
      update(state => ({ ...state, isLoading: true, error: null }));

      try {
        const response = await projectService.getProjects(page);
        if (response.success) {
          update(state => ({
            ...state,
            projects: response.data,
            page: response.meta.page,
            totalPages: response.meta.totalPages,
            isLoading: false,
          }));
        } else {
          update(state => ({
            ...state,
            isLoading: false,
            error: 'Failed to fetch projects',
          }));
        }
      } catch (error) {
        update(state => ({
          ...state,
          isLoading: false,
          error: 'Failed to fetch projects',
        }));
      }
    },

    async fetchProject(id: string) {
      update(state => ({ ...state, isLoading: true, error: null }));

      const response = await projectService.getProject(id);

      if (response.success && response.data) {
        update(state => ({
          ...state,
          currentProject: response.data,
          isLoading: false,
        }));
        return { success: true, project: response.data };
      } else {
        update(state => ({
          ...state,
          isLoading: false,
          error: response.error?.message || 'Failed to fetch project',
        }));
        return { success: false, error: response.error?.message };
      }
    },

    async createProject(input: CreateProjectInput) {
      update(state => ({ ...state, isLoading: true, error: null }));

      const response = await projectService.createProject(input);

      if (response.success && response.data) {
        const project = response.data;
        update(state => ({
          ...state,
          projects: [
            {
              _id: project._id,
              title: project.title,
              description: project.description,
              language: project.language,
              visibility: project.visibility,
              ownerId: project.ownerId,
              ownerUsername: project.ownerUsername,
              createdAt: project.createdAt,
              updatedAt: project.updatedAt,
            } as ProjectSummary,
            ...state.projects,
          ],
          currentProject: project,
          isLoading: false,
        }));
        return { success: true, project };
      } else {
        update(state => ({
          ...state,
          isLoading: false,
          error: response.error?.message || 'Failed to create project',
        }));
        return { success: false, error: response.error?.message };
      }
    },

    async updateProject(id: string, input: UpdateProjectInput) {
      const response = await projectService.updateProject(id, input);

      if (response.success && response.data) {
        update(state => ({
          ...state,
          currentProject:
            state.currentProject?._id === id
              ? response.data
              : state.currentProject,
          projects: state.projects.map(p =>
            p._id === id ? { ...p, ...input } : p
          ),
        }));
        return { success: true };
      }

      return { success: false, error: response.error?.message };
    },

    async deleteProject(id: string) {
      const response = await projectService.deleteProject(id);

      if (response.success) {
        update(state => ({
          ...state,
          projects: state.projects.filter(p => p._id !== id),
          currentProject:
            state.currentProject?._id === id ? null : state.currentProject,
        }));
        return { success: true };
      }

      return { success: false, error: response.error?.message };
    },

    async forkProject(id: string, name?: string) {
      update(state => ({ ...state, isLoading: true }));

      const response = await projectService.forkProject(id, name);

      if (response.success && response.data) {
        update(state => ({ ...state, isLoading: false }));
        return { success: true, project: response.data };
      }

      update(state => ({
        ...state,
        isLoading: false,
        error: response.error?.message ?? null,
      }));
      return { success: false, error: response.error?.message };
    },

    setCurrentProject(project: Project | null) {
      update(state => ({ ...state, currentProject: project }));
    },

    updateFiles(files: FileNode) {
      update(state => ({
        ...state,
        currentProject: state.currentProject
          ? { ...state.currentProject, files }
          : null,
      }));
    },

    clearError() {
      update(state => ({ ...state, error: null }));
    },

    reset() {
      set(initialState);
    },
  };
}

export const projectStore = createProjectStore();

// Derived stores
export const currentProject = derived(
  projectStore,
  $project => $project.currentProject
);
export const projects = derived(projectStore, $project => $project.projects);
export const isProjectLoading = derived(
  projectStore,
  $project => $project.isLoading
);
