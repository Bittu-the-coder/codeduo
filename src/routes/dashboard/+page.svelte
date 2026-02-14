<script lang="ts">
  import { goto } from '$app/navigation';
  import {
    authStore,
    isAuthenticated,
    isAuthLoading,
    isProjectLoading,
    projects,
    projectStore,
    user,
  } from '$lib/stores';
  import type { CreateProjectInput } from '$lib/types';
  import { onMount } from 'svelte';

  let showCreateModal = $state(false);
  let newProjectName = $state('');
  let newProjectLanguage = $state('cpp');
  let newProjectDescription = $state('');
  let creating = $state(false);

  // Redirect if not authenticated
  $effect(() => {
    if (!$isAuthenticated && !$isAuthLoading) {
      goto('/login?callbackUrl=/dashboard');
    }
  });

  // Fetch projects on mount
  onMount(() => {
    if ($isAuthenticated) {
      projectStore.fetchProjects();
    }
  });

  async function createProject() {
    if (!newProjectName.trim()) return;
    creating = true;

    const input: CreateProjectInput = {
      title: newProjectName,
      description: newProjectDescription || undefined,
      language: newProjectLanguage,
      visibility: 'public',
    };

    const result = await projectStore.createProject(input);

    if (result.success && result.project) {
      showCreateModal = false;
      newProjectName = '';
      newProjectDescription = '';
      // Navigate to the new project
      goto(`/room/${result.project._id}`);
    }

    creating = false;
  }

  function openProject(id: string) {
    goto(`/room/${id}`);
  }

  async function deleteProject(e: MouseEvent, id: string, title: string) {
    e.stopPropagation(); // Prevent opening the project
    if (
      !confirm(
        `Are you sure you want to delete "${title}"? This action cannot be undone.`
      )
    ) {
      return;
    }
    const result = await projectStore.deleteProject(id);
    if (!result.success) {
      alert('Failed to delete project: ' + (result.error || 'Unknown error'));
    }
  }

  async function handleLogout() {
    await authStore.logout();
    goto('/');
  }
</script>

<div class="dashboard">
  <header>
    <div class="logo">CodeDuo</div>
    <div class="user-menu">
      <span>{$user?.displayName || $user?.username || $user?.email}</span>
      {#if $user?.avatar}
        <img src={$user.avatar} alt="Avatar" class="avatar" />
      {:else}
        <div class="avatar-placeholder">
          {$user?.username?.[0]?.toUpperCase() || 'U'}
        </div>
      {/if}
      <button class="logout-btn" onclick={handleLogout}>Logout</button>
    </div>
  </header>

  <main>
    <div class="header-actions">
      <h1>My Projects</h1>
      <button class="primary-btn" onclick={() => (showCreateModal = true)}>
        + New Project
      </button>
    </div>

    {#if $isProjectLoading}
      <div class="loading">Loading projects...</div>
    {:else}
      <div class="projects-grid">
        {#each $projects as project}
          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <div class="project-card" onclick={() => openProject(project._id)}>
            <button
              class="delete-btn"
              onclick={e => deleteProject(e, project._id, project.title)}
              title="Delete project"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <polyline points="3 6 5 6 21 6"></polyline>
                <path
                  d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                ></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
              </svg>
            </button>
            <div class="card-preview">
              <div class="placeholder-preview">{project.title[0]}</div>
            </div>
            <div class="card-info">
              <h3>{project.title}</h3>
              <p>{new Date(project.updatedAt).toLocaleDateString()}</p>
              <div class="tags">
                <span class="tag">{project.language}</span>
                <span class="tag"
                  >{project.visibility === 'public'
                    ? 'public'
                    : 'private'}</span
                >
              </div>
            </div>
          </div>
        {/each}

        {#if $projects.length === 0}
          <div class="empty-state">
            <p>No projects yet. Start coding!</p>
          </div>
        {/if}
      </div>
    {/if}
  </main>

  {#if showCreateModal}
    <div class="modal-overlay">
      <div class="modal">
        <h2>Create New Project</h2>

        <label for="project-name">Project Name</label>
        <input
          id="project-name"
          type="text"
          bind:value={newProjectName}
          placeholder="My Awesome Algorithm"
        />

        <label for="project-description">Description (Optional)</label>
        <textarea
          id="project-description"
          bind:value={newProjectDescription}
          placeholder="A brief description of your project"
          rows="3"
        ></textarea>

        <label for="project-language">Language</label>
        <select id="project-language" bind:value={newProjectLanguage}>
          <option value="cpp">C++</option>
          <option value="python">Python</option>
          <option value="java">Java</option>
          <option value="javascript">JavaScript</option>
          <option value="typescript">TypeScript</option>
          <option value="rust">Rust</option>
          <option value="go">Go</option>
        </select>

        <div class="modal-actions">
          <button onclick={() => (showCreateModal = false)}>Cancel</button>
          <button
            class="primary-btn"
            onclick={createProject}
            disabled={creating}
          >
            {creating ? 'Creating...' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .dashboard {
    min-height: 100vh;
    background: var(--bg-primary);
    color: var(--text-primary);
  }

  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 2rem;
    border-bottom: 1px solid var(--border-default);
    background: var(--bg-secondary);
  }

  .logo {
    font-weight: bold;
    font-size: 1.2rem;
  }
  .user-menu {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
  }

  main {
    padding: 2rem;
    max-width: 1200px;
    margin: 0 auto;
  }

  .header-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
  }

  .primary-btn {
    background: var(--accent-primary);
    color: white;
    border: none;
    padding: 0.6rem 1.2rem;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 600;
  }
  .primary-btn:hover {
    opacity: 0.9;
  }

  .projects-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 1.5rem;
  }

  .project-card {
    position: relative;
    background: var(--bg-secondary);
    border: 1px solid var(--border-default);
    border-radius: 8px;
    overflow: hidden;
    cursor: pointer;
    transition:
      transform 0.2s,
      box-shadow 0.2s;
  }

  .project-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }

  .project-card:hover .delete-btn {
    opacity: 1;
  }

  .delete-btn {
    position: absolute;
    top: 8px;
    right: 8px;
    z-index: 10;
    background: rgba(239, 68, 68, 0.9);
    color: white;
    border: none;
    border-radius: 6px;
    padding: 6px;
    cursor: pointer;
    opacity: 0;
    transition:
      opacity 0.2s,
      background 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .delete-btn:hover {
    background: rgba(220, 38, 38, 1);
  }

  .card-preview {
    height: 140px;
    background: var(--bg-tertiary);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .placeholder-preview {
    font-size: 3rem;
    color: var(--text-secondary);
  }

  .card-info {
    padding: 1rem;
  }
  .card-info h3 {
    margin: 0 0 0.5rem;
    font-size: 1rem;
  }
  .card-info p {
    margin: 0;
    font-size: 0.8rem;
    color: var(--text-secondary);
  }

  .tags {
    margin-top: 0.5rem;
  }
  .tag {
    font-size: 0.7rem;
    padding: 0.2rem 0.5rem;
    background: var(--bg-tertiary);
    border-radius: 4px;
    color: var(--text-secondary);
  }

  /* Modal */
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
  }

  .modal {
    background: var(--bg-secondary);
    padding: 2rem;
    border-radius: 12px;
    width: 400px;
    border: 1px solid var(--border-default);
  }

  .modal h2 {
    margin-top: 0;
  }

  input,
  select {
    width: 100%;
    margin-bottom: 1rem;
    padding: 0.8rem;
    background: var(--bg-tertiary);
    border: 1px solid var(--border-default);
    border-radius: 6px;
    color: var(--text-primary);
  }

  textarea {
    width: 100%;
    margin-bottom: 1rem;
    padding: 0.8rem;
    background: var(--bg-tertiary);
    border: 1px solid var(--border-default);
    border-radius: 6px;
    color: var(--text-primary);
    resize: vertical;
    font-family: inherit;
  }

  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    margin-top: 1rem;
  }

  .empty-state {
    grid-column: 1 / -1;
    text-align: center;
    padding: 3rem;
    color: var(--text-secondary);
  }

  .loading {
    text-align: center;
    padding: 3rem;
    color: var(--text-secondary);
  }

  .logout-btn {
    background: transparent;
    border: 1px solid var(--border-default);
    color: var(--text-secondary);
    padding: 0.4rem 0.8rem;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.85rem;
  }

  .logout-btn:hover {
    background: var(--bg-tertiary);
    color: var(--text-primary);
  }

  .avatar-placeholder {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: var(--accent-primary);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    font-size: 0.9rem;
  }
</style>
