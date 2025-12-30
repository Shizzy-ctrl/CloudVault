<script>
  import { auth } from './lib/auth';
  import Login from './components/Login.svelte';
  import Register from './components/Register.svelte';
  import Dashboard from './components/Dashboard.svelte';
  import Download from './components/Download.svelte';
  import { onMount } from 'svelte';

  let showRegister = false;
  let currentPath = window.location.pathname;
  let downloadId = null;

  onMount(() => {
      const path = window.location.pathname;
      const match = path.match(/^\/download\/(.+)$/);
      if (match) {
          downloadId = match[1];
      }
  });
</script>

<div class="antialiased text-gray-900 bg-gray-50 dark:bg-zinc-900 dark:text-gray-100 min-h-screen font-sans">
  {#if downloadId}
      <Download params={{id: downloadId}} />
  {:else if $auth.isAuthenticated}
    <Dashboard />
  {:else}
    <div class="container mx-auto px-4 py-8">
      <h1 class="text-4xl font-extrabold text-center mb-8 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">FileShare App</h1>
      
      {#if showRegister}
        <Register />
        <div class="text-center mt-4">
          <button 
            on:click={() => showRegister = false}
            class="text-sm text-blue-600 hover:underline dark:text-blue-400"
          >
            Already have an account? Login here
          </button>
        </div>
      {:else}
        <Login />
        <div class="text-center mt-4">
          <button 
            on:click={() => showRegister = true}
            class="text-sm text-blue-600 hover:underline dark:text-blue-400"
          >
            Don't have an account? Create one
          </button>
        </div>
      {/if}
    </div>
  {/if}
</div>
