<script lang="ts">
  import { createEventDispatcher, tick } from 'svelte';

  interface FileNode {
    name: string;
    path: string;
    type: 'file' | 'folder';
    content?: string;
    language?: string;
    children?: FileNode[];
  }

  export let files: FileNode[] = [];
  export let activeFile: string | null = null;
  export let readOnly: boolean = false;

  const dispatch = createEventDispatcher();

  // Expanded folders state
  let expandedFolders: Set<string> = new Set();

  // Creation state
  let creatingIn: string | null = null;
  let creatingType: 'file' | 'folder' | null = null;
  let newItemName = '';
  let createInputRef: HTMLInputElement | null = null;

  // Rename state
  let renamingPath: string | null = null;
  let renameValue = '';
  let renameInputRef: HTMLInputElement | null = null;

  // Drag and drop state
  let draggedFile: FileNode | null = null;
  let dragOverPath: string | null = null;

  // Hover state for showing actions
  let hoveredPath: string | null = null;

  function toggleFolder(path: string) {
    if (expandedFolders.has(path)) {
      expandedFolders.delete(path);
    } else {
      expandedFolders.add(path);
    }
    expandedFolders = expandedFolders;
  }

  function handleFileClick(file: FileNode) {
    if (file.type === 'file') {
      dispatch('select', file);
    } else {
      toggleFolder(file.path);
    }
  }

  async function startCreate(
    type: 'file' | 'folder',
    parentPath: string | null = null
  ) {
    creatingType = type;
    creatingIn = parentPath;
    newItemName = '';
    if (parentPath) {
      expandedFolders.add(parentPath);
      expandedFolders = expandedFolders;
    }
    await tick();
    createInputRef?.focus();
  }

  function submitCreate() {
    if (!newItemName.trim()) {
      cancelCreate();
      return;
    }

    const basePath = creatingIn || '';
    const newPath = basePath
      ? `${basePath}/${newItemName.trim()}`
      : newItemName.trim();

    dispatch('create', {
      name: newItemName.trim(),
      path: newPath,
      type: creatingType,
      content: creatingType === 'file' ? '' : undefined,
      language:
        creatingType === 'file' ? detectLanguage(newItemName) : undefined,
      children: creatingType === 'folder' ? [] : undefined,
    });

    cancelCreate();
  }

  function cancelCreate() {
    creatingType = null;
    creatingIn = null;
    newItemName = '';
  }

  async function startRename(file: FileNode, e: MouseEvent) {
    e.stopPropagation();
    renamingPath = file.path;
    renameValue = file.name;
    await tick();
    renameInputRef?.focus();
    renameInputRef?.select();
  }

  function submitRename(file: FileNode) {
    if (!renameValue.trim() || renameValue === file.name) {
      cancelRename();
      return;
    }

    const parentPath = file.path.substring(0, file.path.lastIndexOf('/'));
    const newPath = parentPath
      ? `${parentPath}/${renameValue.trim()}`
      : renameValue.trim();

    dispatch('rename', {
      oldPath: file.path,
      newPath,
      newName: renameValue.trim(),
    });

    cancelRename();
  }

  function cancelRename() {
    renamingPath = null;
    renameValue = '';
  }

  function deleteFile(file: FileNode, e: MouseEvent) {
    e.stopPropagation();
    if (confirm(`Delete "${file.name}"?`)) {
      dispatch('delete', file);
    }
  }

  // Drag and drop handlers
  function handleDragStart(event: DragEvent, file: FileNode) {
    if (readOnly) return;
    draggedFile = file;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', file.path);
    }
  }

  function handleDragOver(event: DragEvent, targetFile: FileNode) {
    if (readOnly || !draggedFile) return;
    if (draggedFile.path === targetFile.path) return;

    // Can only drop on folders or on root level
    if (targetFile.type === 'folder') {
      // Prevent dropping into itself or its children
      if (targetFile.path.startsWith(draggedFile.path + '/')) return;
      event.preventDefault();
      dragOverPath = targetFile.path;
    }
  }

  function handleDragLeave() {
    dragOverPath = null;
  }

  function handleDrop(event: DragEvent, targetFolder: FileNode) {
    event.preventDefault();
    if (readOnly || !draggedFile || targetFolder.type !== 'folder') return;
    if (draggedFile.path === targetFolder.path) return;
    if (targetFolder.path.startsWith(draggedFile.path + '/')) return;

    const newPath = `${targetFolder.path}/${draggedFile.name}`;

    dispatch('move', {
      oldPath: draggedFile.path,
      newPath,
      targetFolder: targetFolder.path,
    });

    draggedFile = null;
    dragOverPath = null;
  }

  function handleDragEnd() {
    draggedFile = null;
    dragOverPath = null;
  }

  function detectLanguage(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();
    const langMap: Record<string, string> = {
      cpp: 'cpp',
      cc: 'cpp',
      cxx: 'cpp',
      c: 'c',
      h: 'c',
      hpp: 'cpp',
      py: 'python',
      js: 'javascript',
      ts: 'typescript',
      jsx: 'javascript',
      tsx: 'typescript',
      java: 'java',
      go: 'go',
      rs: 'rust',
      rb: 'ruby',
      php: 'php',
      cs: 'csharp',
      swift: 'swift',
      kt: 'kotlin',
      md: 'markdown',
      json: 'json',
      html: 'html',
      css: 'css',
      scss: 'scss',
      sql: 'sql',
      sh: 'shell',
      yml: 'yaml',
      yaml: 'yaml',
      xml: 'xml',
      xlsx: 'excel',
      gitignore: 'git',
    };
    return langMap[ext || ''] || 'plaintext';
  }

  function getFileExtension(filename: string): string {
    if (filename.startsWith('.')) return filename.slice(1);
    return filename.split('.').pop()?.toLowerCase() || '';
  }

  function getFileColor(file: FileNode): string {
    if (file.type === 'folder') return '#dcb67a'; // Yellow/gold for folders

    const ext = getFileExtension(file.name);
    const colorMap: Record<string, string> = {
      js: '#f7df1e',
      ts: '#3178c6',
      jsx: '#61dafb',
      tsx: '#61dafb',
      html: '#e34c26',
      css: '#264de4',
      scss: '#cd6799',
      json: '#cbcb41',
      md: '#ffffff',
      py: '#3572A5',
      java: '#b07219',
      cpp: '#f34b7d',
      c: '#555555',
      go: '#00ADD8',
      rs: '#dea584',
      rb: '#701516',
      php: '#4F5D95',
      gitignore: '#f14e32',
      xlsx: '#217346',
    };
    return colorMap[ext] || '#8b949e';
  }
</script>

<div class="file-explorer">
  <div class="explorer-header">
    <span class="header-title">FILES</span>
    {#if !readOnly}
      <div class="header-actions">
        <button
          class="action-btn"
          onclick={() => startCreate('file')}
          title="New File"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
            />
            <polyline points="14 2 14 8 20 8" />
            <line x1="12" y1="18" x2="12" y2="12" />
            <line x1="9" y1="15" x2="15" y2="15" />
          </svg>
        </button>
        <button
          class="action-btn"
          onclick={() => startCreate('folder')}
          title="New Folder"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"
            />
            <line x1="12" y1="11" x2="12" y2="17" />
            <line x1="9" y1="14" x2="15" y2="14" />
          </svg>
        </button>
      </div>
    {/if}
  </div>

  <div class="file-tree">
    {#each files as file}
      {@const isExpanded = expandedFolders.has(file.path)}
      {@const isRenaming = renamingPath === file.path}
      {@const isDragOver = dragOverPath === file.path}
      {@const isHovered = hoveredPath === file.path}

      <div
        class="tree-item depth-0"
        class:active={activeFile === file.path}
        class:folder={file.type === 'folder'}
        class:drag-over={isDragOver}
        class:dragging={draggedFile?.path === file.path}
        draggable={!readOnly && !isRenaming}
        ondragstart={e => handleDragStart(e, file)}
        ondragover={e => handleDragOver(e, file)}
        ondragleave={handleDragLeave}
        ondrop={e => handleDrop(e, file)}
        ondragend={handleDragEnd}
        onclick={() => !isRenaming && handleFileClick(file)}
        onkeydown={e =>
          e.key === 'Enter' && !isRenaming && handleFileClick(file)}
        onmouseenter={() => (hoveredPath = file.path)}
        onmouseleave={() => (hoveredPath = null)}
        role="treeitem"
        aria-selected={activeFile === file.path}
        tabindex="0"
      >
        <div class="item-content">
          {#if file.type === 'folder'}
            <span class="chevron">
              {#if isExpanded}
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              {:else}
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              {/if}
            </span>
          {/if}

          <span class="file-icon" style="color: {getFileColor(file)}">
            {#if file.type === 'folder'}
              {#if isExpanded}
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path
                    d="M20 19H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5l2 2h9a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2z"
                  />
                </svg>
              {:else}
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path
                    d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"
                  />
                </svg>
              {/if}
            {:else}
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            {/if}
          </span>

          {#if isRenaming}
            <input
              class="rename-input"
              type="text"
              bind:value={renameValue}
              bind:this={renameInputRef}
              onkeydown={e => {
                if (e.key === 'Enter') submitRename(file);
                if (e.key === 'Escape') cancelRename();
              }}
              onblur={() => submitRename(file)}
              onclick={e => e.stopPropagation()}
            />
          {:else}
            <span class="file-name">{file.name}</span>
          {/if}
        </div>

        {#if !readOnly && isHovered && !isRenaming}
          <div class="item-actions">
            {#if file.type === 'folder'}
              <button
                class="item-action"
                onclick={e => {
                  e.stopPropagation();
                  startCreate('file', file.path);
                }}
                title="New File"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path
                    d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                  />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="12" y1="18" x2="12" y2="12" />
                  <line x1="9" y1="15" x2="15" y2="15" />
                </svg>
              </button>
              <button
                class="item-action"
                onclick={e => {
                  e.stopPropagation();
                  startCreate('folder', file.path);
                }}
                title="New Folder"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path
                    d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"
                  />
                  <line x1="12" y1="11" x2="12" y2="17" />
                  <line x1="9" y1="14" x2="15" y2="14" />
                </svg>
              </button>
            {/if}
            <button
              class="item-action"
              onclick={e => startRename(file, e)}
              title="Rename"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"
                />
              </svg>
            </button>
            <button
              class="item-action danger"
              onclick={e => deleteFile(file, e)}
              title="Delete"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <polyline points="3 6 5 6 21 6" />
                <path
                  d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                />
              </svg>
            </button>
          </div>
        {/if}
      </div>

      <!-- Folder children -->
      {#if file.type === 'folder' && isExpanded}
        {#if file.children && file.children.length > 0}
          {#each file.children as child}
            {@const childIsExpanded = expandedFolders.has(child.path)}
            {@const childIsRenaming = renamingPath === child.path}
            {@const childIsDragOver = dragOverPath === child.path}
            {@const childIsHovered = hoveredPath === child.path}

            <div
              class="tree-item depth-1"
              class:active={activeFile === child.path}
              class:folder={child.type === 'folder'}
              class:drag-over={childIsDragOver}
              class:dragging={draggedFile?.path === child.path}
              draggable={!readOnly && !childIsRenaming}
              ondragstart={e => handleDragStart(e, child)}
              ondragover={e => handleDragOver(e, child)}
              ondragleave={handleDragLeave}
              ondrop={e => handleDrop(e, child)}
              ondragend={handleDragEnd}
              onclick={() => !childIsRenaming && handleFileClick(child)}
              onkeydown={e =>
                e.key === 'Enter' && !childIsRenaming && handleFileClick(child)}
              onmouseenter={() => (hoveredPath = child.path)}
              onmouseleave={() => (hoveredPath = null)}
              role="treeitem"
              aria-selected={activeFile === child.path}
              tabindex="0"
            >
              <div class="item-content">
                {#if child.type === 'folder'}
                  <span class="chevron">
                    {#if childIsExpanded}
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    {:else}
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                      >
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    {/if}
                  </span>
                {/if}

                <span class="file-icon" style="color: {getFileColor(child)}">
                  {#if child.type === 'folder'}
                    {#if childIsExpanded}
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path
                          d="M20 19H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5l2 2h9a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2z"
                        />
                      </svg>
                    {:else}
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path
                          d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"
                        />
                      </svg>
                    {/if}
                  {:else}
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <path
                        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                      />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                  {/if}
                </span>

                {#if childIsRenaming}
                  <input
                    class="rename-input"
                    type="text"
                    bind:value={renameValue}
                    bind:this={renameInputRef}
                    onkeydown={e => {
                      if (e.key === 'Enter') submitRename(child);
                      if (e.key === 'Escape') cancelRename();
                    }}
                    onblur={() => submitRename(child)}
                    onclick={e => e.stopPropagation()}
                  />
                {:else}
                  <span class="file-name">{child.name}</span>
                {/if}
              </div>

              {#if !readOnly && childIsHovered && !childIsRenaming}
                <div class="item-actions">
                  {#if child.type === 'folder'}
                    <button
                      class="item-action"
                      onclick={e => {
                        e.stopPropagation();
                        startCreate('file', child.path);
                      }}
                      title="New File"
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                      >
                        <path
                          d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                        />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="12" y1="18" x2="12" y2="12" />
                        <line x1="9" y1="15" x2="15" y2="15" />
                      </svg>
                    </button>
                    <button
                      class="item-action"
                      onclick={e => {
                        e.stopPropagation();
                        startCreate('folder', child.path);
                      }}
                      title="New Folder"
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                      >
                        <path
                          d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"
                        />
                        <line x1="12" y1="11" x2="12" y2="17" />
                        <line x1="9" y1="14" x2="15" y2="14" />
                      </svg>
                    </button>
                  {/if}
                  <button
                    class="item-action"
                    onclick={e => startRename(child, e)}
                    title="Rename"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <path
                        d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"
                      />
                    </svg>
                  </button>
                  <button
                    class="item-action danger"
                    onclick={e => deleteFile(child, e)}
                    title="Delete"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <polyline points="3 6 5 6 21 6" />
                      <path
                        d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                      />
                    </svg>
                  </button>
                </div>
              {/if}
            </div>

            <!-- Second level children (depth 2) -->
            {#if child.type === 'folder' && childIsExpanded && child.children}
              {#each child.children as grandchild}
                {@const grandchildIsRenaming = renamingPath === grandchild.path}
                {@const grandchildIsDragOver = dragOverPath === grandchild.path}
                {@const grandchildIsHovered = hoveredPath === grandchild.path}

                <div
                  class="tree-item depth-2"
                  class:active={activeFile === grandchild.path}
                  class:folder={grandchild.type === 'folder'}
                  class:drag-over={grandchildIsDragOver}
                  class:dragging={draggedFile?.path === grandchild.path}
                  draggable={!readOnly && !grandchildIsRenaming}
                  ondragstart={e => handleDragStart(e, grandchild)}
                  ondragover={e => handleDragOver(e, grandchild)}
                  ondragleave={handleDragLeave}
                  ondrop={e => handleDrop(e, grandchild)}
                  ondragend={handleDragEnd}
                  onclick={() =>
                    !grandchildIsRenaming && handleFileClick(grandchild)}
                  onkeydown={e =>
                    e.key === 'Enter' &&
                    !grandchildIsRenaming &&
                    handleFileClick(grandchild)}
                  onmouseenter={() => (hoveredPath = grandchild.path)}
                  onmouseleave={() => (hoveredPath = null)}
                  role="treeitem"
                  aria-selected={activeFile === grandchild.path}
                  tabindex="0"
                >
                  <div class="item-content">
                    {#if grandchild.type === 'folder'}
                      <span class="chevron">
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                        >
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </span>
                    {/if}

                    <span
                      class="file-icon"
                      style="color: {getFileColor(grandchild)}"
                    >
                      {#if grandchild.type === 'folder'}
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path
                            d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"
                          />
                        </svg>
                      {:else}
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                        >
                          <path
                            d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                          />
                          <polyline points="14 2 14 8 20 8" />
                        </svg>
                      {/if}
                    </span>

                    {#if grandchildIsRenaming}
                      <input
                        class="rename-input"
                        type="text"
                        bind:value={renameValue}
                        bind:this={renameInputRef}
                        onkeydown={e => {
                          if (e.key === 'Enter') submitRename(grandchild);
                          if (e.key === 'Escape') cancelRename();
                        }}
                        onblur={() => submitRename(grandchild)}
                        onclick={e => e.stopPropagation()}
                      />
                    {:else}
                      <span class="file-name">{grandchild.name}</span>
                    {/if}
                  </div>

                  {#if !readOnly && grandchildIsHovered && !grandchildIsRenaming}
                    <div class="item-actions">
                      <button
                        class="item-action"
                        onclick={e => startRename(grandchild, e)}
                        title="Rename"
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                        >
                          <path
                            d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"
                          />
                        </svg>
                      </button>
                      <button
                        class="item-action danger"
                        onclick={e => deleteFile(grandchild, e)}
                        title="Delete"
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                        >
                          <polyline points="3 6 5 6 21 6" />
                          <path
                            d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                          />
                        </svg>
                      </button>
                    </div>
                  {/if}
                </div>
              {/each}

              <!-- Create input inside nested folder (child) -->
              {#if creatingIn === child.path && creatingType}
                <div class="tree-item depth-2 creating">
                  <div class="item-content">
                    <span
                      class="file-icon"
                      style="color: {creatingType === 'folder'
                        ? '#dcb67a'
                        : '#8b949e'}"
                    >
                      {#if creatingType === 'folder'}
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path
                            d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"
                          />
                        </svg>
                      {:else}
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                        >
                          <path
                            d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                          />
                          <polyline points="14 2 14 8 20 8" />
                        </svg>
                      {/if}
                    </span>
                    <input
                      class="create-input"
                      type="text"
                      bind:value={newItemName}
                      bind:this={createInputRef}
                      placeholder={creatingType === 'folder'
                        ? 'folder name'
                        : 'filename.ext'}
                      onkeydown={e => {
                        if (e.key === 'Enter') submitCreate();
                        if (e.key === 'Escape') cancelCreate();
                      }}
                      onblur={cancelCreate}
                    />
                  </div>
                </div>
              {/if}
            {/if}
          {/each}
        {/if}

        <!-- Create input inside this folder -->
        {#if creatingIn === file.path && creatingType}
          <div class="tree-item depth-1 creating">
            <div class="item-content">
              <span
                class="file-icon"
                style="color: {creatingType === 'folder'
                  ? '#dcb67a'
                  : '#8b949e'}"
              >
                {#if creatingType === 'folder'}
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path
                      d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"
                    />
                  </svg>
                {:else}
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path
                      d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                    />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                {/if}
              </span>
              <input
                class="create-input"
                type="text"
                bind:value={newItemName}
                bind:this={createInputRef}
                placeholder={creatingType === 'folder'
                  ? 'folder name'
                  : 'filename.ext'}
                onkeydown={e => {
                  if (e.key === 'Enter') submitCreate();
                  if (e.key === 'Escape') cancelCreate();
                }}
                onblur={cancelCreate}
              />
            </div>
          </div>
        {/if}
      {/if}
    {/each}

    <!-- Create input at root level -->
    {#if creatingIn === null && creatingType}
      <div class="tree-item depth-0 creating">
        <div class="item-content">
          <span
            class="file-icon"
            style="color: {creatingType === 'folder' ? '#dcb67a' : '#8b949e'}"
          >
            {#if creatingType === 'folder'}
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path
                  d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"
                />
              </svg>
            {:else}
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            {/if}
          </span>
          <input
            class="create-input"
            type="text"
            bind:value={newItemName}
            bind:this={createInputRef}
            placeholder={creatingType === 'folder'
              ? 'folder name'
              : 'filename.ext'}
            onkeydown={e => {
              if (e.key === 'Enter') submitCreate();
              if (e.key === 'Escape') cancelCreate();
            }}
            onblur={cancelCreate}
          />
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  .file-explorer {
    width: 250px;
    background: var(--bg-secondary, #161b22);
    border-right: 1px solid var(--border-default, #30363d);
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
    font-size: 13px;
  }

  .explorer-header {
    padding: 8px 12px;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    color: var(--text-secondary, #8b949e);
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid var(--border-default, #30363d);
  }

  .header-actions {
    display: flex;
    gap: 2px;
  }

  .action-btn {
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px;
    color: var(--text-secondary, #8b949e);
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s;
  }

  .action-btn:hover {
    background: var(--bg-tertiary, #21262d);
    color: var(--text-primary, #c9d1d9);
  }

  .file-tree {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
  }

  .tree-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 4px 8px;
    cursor: pointer;
    color: var(--text-primary, #c9d1d9);
    user-select: none;
    transition: background-color 0.1s;
    min-height: 24px;
  }

  .tree-item.depth-0 {
    padding-left: 8px;
  }

  .tree-item.depth-1 {
    padding-left: 24px;
  }

  .tree-item.depth-2 {
    padding-left: 40px;
  }

  .tree-item:hover {
    background: var(--bg-tertiary, #21262d);
  }

  .tree-item.active {
    background: var(--bg-active, #388bfd26);
  }

  .tree-item.drag-over {
    background: rgba(88, 166, 255, 0.15);
    outline: 1px dashed var(--accent-primary, #58a6ff);
    outline-offset: -1px;
  }

  .tree-item.dragging {
    opacity: 0.5;
  }

  .item-content {
    display: flex;
    align-items: center;
    gap: 4px;
    flex: 1;
    min-width: 0;
    overflow: hidden;
  }

  .chevron {
    width: 16px;
    height: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-secondary, #8b949e);
    flex-shrink: 0;
  }

  .file-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    margin-right: 4px;
  }

  .file-name {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 13px;
  }

  .item-actions {
    display: flex;
    gap: 2px;
    flex-shrink: 0;
    margin-left: 4px;
  }

  .item-action {
    background: none;
    border: none;
    cursor: pointer;
    padding: 2px;
    color: var(--text-secondary, #8b949e);
    border-radius: 3px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s;
  }

  .item-action:hover {
    background: var(--bg-elevated, #30363d);
    color: var(--text-primary, #c9d1d9);
  }

  .item-action.danger:hover {
    background: var(--accent-danger, #f85149);
    color: white;
  }

  .rename-input,
  .create-input {
    flex: 1;
    background: var(--bg-primary, #0d1117);
    border: 1px solid var(--accent-primary, #58a6ff);
    color: var(--text-primary, #c9d1d9);
    padding: 2px 6px;
    font-size: 13px;
    border-radius: 3px;
    outline: none;
    min-width: 0;
  }

  .rename-input:focus,
  .create-input:focus {
    box-shadow: 0 0 0 2px rgba(88, 166, 255, 0.3);
  }

  /* Scrollbar styling */
  .file-tree::-webkit-scrollbar {
    width: 8px;
  }

  .file-tree::-webkit-scrollbar-track {
    background: transparent;
  }

  .file-tree::-webkit-scrollbar-thumb {
    background: var(--bg-elevated, #30363d);
    border-radius: 4px;
  }

  .file-tree::-webkit-scrollbar-thumb:hover {
    background: var(--text-muted, #484f58);
  }
</style>
