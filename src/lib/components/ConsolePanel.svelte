<script lang="ts">
  import type { ExecutionState } from '$lib/index';
  import { ChevronDown, ChevronUp, Terminal } from 'lucide-svelte';

  let {
    consoleLines,
    stdinInput = $bindable(''),
    execution,
    onClear,
  }: {
    consoleLines: {
      type: 'stdout' | 'stderr' | 'info' | 'stdin';
      text: string;
    }[];
    stdinInput: string;
    execution: ExecutionState;
    onClear: () => void;
  } = $props();

  let stdinExpanded = $state(false);

  // Auto-scroll to bottom when new lines are added
  $effect(() => {
    if (consoleLines.length > 0) {
      const el = document.getElementById('console-output');
      if (el) el.scrollTop = el.scrollHeight;
    }
  });
</script>

<div class="console-panel">
  <div class="console-header">
    <div class="console-tabs">
      <span class="console-tab active">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <polyline points="4 17 10 11 4 5" /><line
            x1="12"
            y1="19"
            x2="20"
            y2="19"
          />
        </svg>
        Console
      </span>
    </div>
    <div class="console-actions">
      {#if execution.executionTime !== null}
        <span class="exec-time">{execution.executionTime}ms</span>
      {/if}
      <button class="console-btn" onclick={onClear} title="Clear console">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <line x1="18" y1="6" x2="6" y2="18" /><line
            x1="6"
            y1="6"
            x2="18"
            y2="18"
          />
        </svg>
      </button>
    </div>
  </div>

  <div class="console-output" id="console-output">
    {#if consoleLines.length === 0}
      <div class="console-empty">
        <span class="console-prompt">$</span>
        Run your code to see output here...
      </div>
    {/if}
    {#each consoleLines as line}
      <div class="console-line {line.type}">
        <pre>{line.text}</pre>
      </div>
    {/each}
  </div>

  <!-- Stdin Input -->
  <div class="stdin-section" class:expanded={stdinExpanded}>
    <button
      class="stdin-header"
      onclick={() => (stdinExpanded = !stdinExpanded)}
    >
      <div class="stdin-label">
        <Terminal size={12} />
        <span>stdin</span>
        {#if stdinInput.trim()}
          <span class="stdin-indicator">has input</span>
        {/if}
      </div>
      <div class="stdin-toggle">
        {#if stdinExpanded}
          <ChevronDown size={14} />
        {:else}
          <ChevronUp size={14} />
        {/if}
      </div>
    </button>
    {#if stdinExpanded}
      <textarea
        class="stdin-input"
        bind:value={stdinInput}
        placeholder="Provide input for your program (one value per line for multiple inputs)..."
        rows="6"
      ></textarea>
    {/if}
  </div>
</div>

<style>
  .console-panel {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: var(--console-bg, #0d1117);
    overflow: hidden;
  }

  .console-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-2) var(--space-3);
    background: rgba(255, 255, 255, 0.03);
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    flex-shrink: 0;
  }

  .console-tabs {
    display: flex;
    gap: var(--space-1);
  }

  .console-tab {
    display: flex;
    align-items: center;
    gap: var(--space-1);
    padding: var(--space-1) var(--space-2);
    font-size: var(--text-xs);
    font-weight: 600;
    color: var(--console-text, #c9d1d9);
    border-radius: var(--radius-sm);
  }

  .console-tab.active {
    background: rgba(255, 255, 255, 0.08);
  }

  .console-actions {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .exec-time {
    font-size: var(--text-xs);
    font-family: var(--font-mono);
    color: var(--console-info, #8b949e);
    background: rgba(255, 255, 255, 0.06);
    padding: 2px var(--space-2);
    border-radius: var(--radius-sm);
  }

  .console-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    background: none;
    border: none;
    border-radius: var(--radius-sm);
    color: var(--console-text, #c9d1d9);
    cursor: pointer;
    opacity: 0.6;
    transition: all var(--transition-fast);
  }

  .console-btn:hover {
    opacity: 1;
    background: rgba(255, 255, 255, 0.08);
  }

  .console-output {
    flex: 1;
    overflow-y: auto;
    padding: var(--space-2) var(--space-3);
    font-family: var(--font-mono);
    font-size: var(--text-xs);
  }

  .console-empty {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-4);
    color: var(--console-info, #8b949e);
    font-size: var(--text-sm);
  }

  .console-prompt {
    color: var(--console-success, #3fb950);
    font-weight: 700;
  }

  .console-line {
    padding: 1px 0;
  }
  .console-line pre {
    margin: 0;
    white-space: pre-wrap;
    word-break: break-all;
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    line-height: 1.5;
  }

  .console-line.stdout pre {
    color: var(--console-text, #c9d1d9);
  }
  .console-line.stderr pre {
    color: var(--console-error, #f85149);
  }
  .console-line.info pre {
    color: var(--console-info, #8b949e);
    font-style: italic;
  }
  .console-line.stdin pre {
    color: var(--console-stdin, #58a6ff);
  }

  /* Stdin */
  .stdin-section {
    border-top: 1px solid rgba(255, 255, 255, 0.06);
    flex-shrink: 0;
  }

  .stdin-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: var(--space-2) var(--space-3);
    background: none;
    border: none;
    cursor: pointer;
    transition: background-color var(--transition-fast);
  }

  .stdin-header:hover {
    background: rgba(255, 255, 255, 0.03);
  }

  .stdin-label {
    display: flex;
    align-items: center;
    gap: var(--space-1);
    font-size: var(--text-xs);
    font-weight: 500;
    color: var(--console-stdin, #58a6ff);
  }

  .stdin-indicator {
    font-size: var(--text-xs);
    color: var(--console-success, #3fb950);
    background: rgba(63, 185, 80, 0.15);
    padding: 1px 6px;
    border-radius: var(--radius-sm);
    font-weight: 400;
  }

  .stdin-toggle {
    color: var(--console-info, #8b949e);
    display: flex;
    align-items: center;
  }

  .stdin-section.expanded .stdin-input {
    display: block;
  }

  .stdin-input {
    width: calc(100% - var(--space-3) * 2);
    margin: 0 var(--space-3) var(--space-2);
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: var(--radius-sm);
    padding: var(--space-2);
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    color: var(--console-text, #c9d1d9);
    resize: vertical;
    min-height: 80px;
    max-height: 200px;
    transition: border-color var(--transition-fast);
  }

  .stdin-input:focus {
    border-color: var(--console-stdin, #58a6ff);
    outline: none;
  }
  .stdin-input::placeholder {
    color: rgba(201, 209, 217, 0.3);
  }

  /* Responsive */
  @media (max-width: 480px) {
    .console-header {
      padding: var(--space-1) var(--space-2);
    }
    .stdin-section {
      padding: var(--space-1) var(--space-2);
    }
    .console-output {
      padding: var(--space-1) var(--space-2);
    }
  }
</style>
