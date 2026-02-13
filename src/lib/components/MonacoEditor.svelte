<script lang="ts">
  import { browser } from '$app/environment';
  import { themes } from '$lib/themes';
  import { onDestroy, onMount } from 'svelte';

  let {
    language = 'javascript',
    theme = 'codeduo-dark',
    onEditorReady = (editor: any, monaco: any) => {},
  }: {
    language?: string;
    theme?: string;
    onEditorReady?: (editor: any, monaco: any) => void;
  } = $props();

  let editorContainer: HTMLDivElement;
  let editor: any = $state(null);
  let monacoModule: any = $state(null);
  let themesRegistered = false;

  function registerAllThemes(monaco: any) {
    if (themesRegistered) return;
    for (const t of themes) {
      monaco.editor.defineTheme(t.id, t.data);
    }
    themesRegistered = true;
  }

  onMount(async () => {
    if (!browser) return;

    const monaco = await import('monaco-editor');
    monacoModule = monaco;

    // Set up workers
    (self as any).MonacoEnvironment = {
      getWorker(_: string, label: string) {
        switch (label) {
          case 'json':
            return new Worker(
              new URL(
                'monaco-editor/esm/vs/language/json/json.worker.js',
                import.meta.url
              ),
              { type: 'module' }
            );
          case 'css':
          case 'scss':
          case 'less':
            return new Worker(
              new URL(
                'monaco-editor/esm/vs/language/css/css.worker.js',
                import.meta.url
              ),
              { type: 'module' }
            );
          case 'html':
          case 'handlebars':
          case 'razor':
            return new Worker(
              new URL(
                'monaco-editor/esm/vs/language/html/html.worker.js',
                import.meta.url
              ),
              { type: 'module' }
            );
          case 'typescript':
          case 'javascript':
            return new Worker(
              new URL(
                'monaco-editor/esm/vs/language/typescript/ts.worker.js',
                import.meta.url
              ),
              { type: 'module' }
            );
          default:
            return new Worker(
              new URL(
                'monaco-editor/esm/vs/editor/editor.worker.js',
                import.meta.url
              ),
              { type: 'module' }
            );
        }
      },
    };

    // Register themes
    registerAllThemes(monaco);

    // Create editor
    editor = monaco.editor.create(editorContainer, {
      language,
      theme,
      value: '',
      automaticLayout: true,
      fontSize: 14,
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
      fontLigatures: true,
      minimap: { enabled: true, scale: 1 },
      scrollBeyondLastLine: false,
      padding: { top: 16, bottom: 16 },
      lineNumbers: 'on',
      renderLineHighlight: 'all',
      cursorBlinking: 'smooth',
      cursorSmoothCaretAnimation: 'on',
      smoothScrolling: true,
      bracketPairColorization: { enabled: true },
      guides: {
        bracketPairs: true,
        indentation: true,
      },
      suggest: {
        showMethods: true,
        showFunctions: true,
        showConstructors: true,
        showFields: true,
        showVariables: true,
        showClasses: true,
        showInterfaces: true,
        showModules: true,
        showProperties: true,
        showKeywords: true,
        showSnippets: true,
      },
      wordWrap: 'off',
      tabSize: 4,
      insertSpaces: false,
      roundedSelection: true,
      contextmenu: true,
      accessibilitySupport: 'off',
    });

    onEditorReady(editor, monaco);
  });

  // React to language changes
  $effect(() => {
    if (editor && monacoModule && language) {
      const model = editor.getModel();
      if (model) {
        monacoModule.editor.setModelLanguage(model, language);
      }
    }
  });

  // React to theme changes
  $effect(() => {
    if (editor && monacoModule && theme) {
      monacoModule.editor.setTheme(theme);
    }
  });

  onDestroy(() => {
    editor?.dispose();
  });
</script>

<div class="editor-wrapper" bind:this={editorContainer}></div>

<style>
  .editor-wrapper {
    width: 100%;
    height: 100%;
    min-height: 0;
    border-radius: var(--radius-md);
    overflow: hidden;
  }
</style>
