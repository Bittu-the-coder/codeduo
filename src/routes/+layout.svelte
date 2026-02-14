<script lang="ts">
  import { authStore } from '$lib/stores';
  import { onMount } from 'svelte';
  import '../app.css';

  let { children } = $props();

  onMount(() => {
    authStore.initialize();
  });
</script>

{@render children()}
