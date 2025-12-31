<script>
  import { apiRequest } from '../lib/api.js';
  import { login } from '../lib/auth.js';

  let username = '';
  let password = '';
  let error = '';

  async function handleLogin() {
    try {
      const formData = new URLSearchParams();
      formData.append('username', username);
      formData.append('password', password);

      const response = await fetch('/api/token', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: formData
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Login failed');

      login(data.access_token, { username }, data.must_change_password);
    } catch (e) {
      error = e.message;
    }
  }
</script>

<div class="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-zinc-900">
  <div class="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
    <h2 class="text-2xl font-bold text-center text-gray-900 dark:text-white">Sign in to your account</h2>
    
    {#if error}
      <div class="p-4 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-900/50 dark:text-red-400" role="alert">
        <span class="font-medium">Error!</span> {error}
      </div>
    {/if}

    <form class="space-y-4" on:submit|preventDefault={handleLogin}>
      <div>
        <label for="username" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Username</label>
        <input 
          type="text" 
          id="username" 
          bind:value={username} 
          required 
          class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-zinc-900 dark:border-zinc-700 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" 
          placeholder="Your username here"
        />
      </div>
      <div>
        <label for="password" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Password</label>
        <input 
          type="password" 
          id="password" 
          bind:value={password} 
          required 
          class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-zinc-900 dark:border-zinc-700 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" 
          placeholder="••••••••"
        />
      </div>
      <button 
        type="submit" 
        class="w-full text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
      >
        Sign in
      </button>
    </form>
  </div>
</div>
