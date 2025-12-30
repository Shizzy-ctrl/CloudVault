<script>
  import { auth, logout } from '../lib/auth';
  import { uploadFiles, apiRequest } from '../lib/api';
  import { Upload, LogOut, Link, Clock, Lock, FileText, Folder } from 'lucide-svelte';

  let files; // FileList
  let uploadResult = null; // Share Object
  let error = '';
  let shareSettings = {
      password: '',
      expires_minutes: ''
  };
  let shareUpdateMsg = '';
  let isLoading = false;

  async function handleUpload() {
    if (!files || files.length === 0) return;
    isLoading = true;
    try {
        uploadResult = await uploadFiles(files, $auth.token);
        error = '';
        shareSettings = { password: '', expires_minutes: '' };
        shareUpdateMsg = '';
    } catch (e) {
        error = e.message;
        uploadResult = null;
    } finally {
        isLoading = false;
    }
  }

  async function updateShareSettings() {
      if (!uploadResult) return;
      isLoading = true;
      try {
          const body = {
              public_id: uploadResult.public_id,
              password: shareSettings.password ? shareSettings.password : null,
              expires_minutes: shareSettings.expires_minutes ? parseInt(shareSettings.expires_minutes) : null
          };
          
          await apiRequest(`/share/${uploadResult.public_id}`, 'POST', body, $auth.token);
          shareUpdateMsg = 'Settings updated successfully!';
      } catch (e) {
          shareUpdateMsg = 'Error updating settings: ' + e.message;
      } finally {
          isLoading = false;
      }
  }
</script>

<div class="min-h-screen bg-gray-100 dark:bg-zinc-900 p-8">
  <div class="max-w-4xl mx-auto space-y-8">
    
    <header class="flex justify-between items-center bg-white dark:bg-zinc-950 p-6 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">FileShare</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400">Welcome back, {$auth.user.username}</p>
      </div>
      <button 
        on:click={logout}
        class="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 dark:bg-red-900/10 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors"
      >
        <LogOut size={16} />
        Logout
      </button>
    </header>

    <section class="bg-white dark:bg-zinc-950 p-6 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800">
      <h2 class="text-xl font-semibold mb-4 flex items-center gap-2 dark:text-white">
        <Upload size={20} />
        Upload Files
      </h2>
      
      <div class="flex flex-col gap-4">
        <div class="flex items-center justify-center w-full">
            <label for="dropzone-file" class="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-zinc-800 dark:bg-zinc-900 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 transition-colors">
                <div class="flex flex-col items-center justify-center pt-5 pb-6 text-center">
                    <Folder class="w-12 h-12 mb-4 text-gray-400" />
                    {#if files && files.length > 0}
                         <p class="mb-2 text-sm text-gray-500 dark:text-gray-400 font-semibold">{files.length} file(s) selected</p>
                         <ul class="text-xs text-gray-400 max-h-32 overflow-y-auto">
                            {#each Array.from(files) as f}
                                <li>{f.name}</li>
                            {/each}
                         </ul>
                    {:else}
                        <p class="mb-2 text-sm text-gray-500 dark:text-gray-400"><span class="font-semibold">Click to upload</span> or drag and drop</p>
                        <p class="text-xs text-gray-500 dark:text-gray-400">Select multiple files at once</p>
                    {/if}
                </div>
                <!-- multiple attribute added -->
                <input id="dropzone-file" type="file" multiple class="hidden" on:change={e => files = e.target.files} />
            </label>
        </div> 

        {#if error}
            <div class="p-4 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-900/50 dark:text-red-400">
                {error}
            </div>
        {/if}

        <button 
            on:click={handleUpload} 
            disabled={!files || isLoading}
            class="w-full text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
            {isLoading ? 'Uploading...' : 'Upload Files'}
        </button>
      </div>
    </section>

    {#if uploadResult}
    <section class="bg-white dark:bg-zinc-950 p-6 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div class="mb-6 pb-6 border-b border-gray-100 dark:border-zinc-800">
            <h3 class="text-lg font-semibold text-green-600 dark:text-green-400 mb-2">Share Created!</h3>
            <div class="flex items-center gap-2 p-3 bg-gray-50 dark:bg-zinc-900 rounded-md border border-gray-200 dark:border-zinc-700 mb-4">
                <Link size={16} class="text-gray-500" />
                <a href={uploadResult.share_link} target="_blank" class="text-blue-600 hover:underline text-sm break-all">{uploadResult.share_link}</a>
            </div>

            <div class="bg-gray-50 dark:bg-zinc-900 p-4 rounded-md">
                <h4 class="text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">Files in this Share:</h4>
                <ul class="space-y-1">
                    {#each uploadResult.files as file}
                        <li class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <FileText size={14} /> {file.filename}
                        </li>
                    {/each}
                </ul>
            </div>
        </div>
        
        <div class="space-y-4">
            <h4 class="text-md font-medium dark:text-white">Share Settings</h4>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="block mb-2 text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
                        <Lock size={16} /> Password Protection (Optional)
                    </label>
                    <input 
                        type="password" 
                        bind:value={shareSettings.password} 
                        placeholder="Set a password"
                        class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-zinc-900 dark:border-zinc-700 dark:placeholder-gray-400 dark:text-white"
                    />
                </div>
                <div>
                    <label class="block mb-2 text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
                        <Clock size={16} /> Expiration Time (Minutes)
                    </label>
                    <input 
                        type="number" 
                        bind:value={shareSettings.expires_minutes} 
                        placeholder="e.g. 60"
                        class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-zinc-900 dark:border-zinc-700 dark:placeholder-gray-400 dark:text-white"
                    />
                </div>
            </div>

            <button 
                on:click={updateShareSettings}
                disabled={isLoading}
                class="text-white bg-zinc-800 hover:bg-zinc-900 focus:ring-4 focus:ring-zinc-300 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-zinc-700 dark:hover:bg-zinc-600 dark:focus:ring-zinc-800 disabled:opacity-50 transition-colors"
            >
                {isLoading ? 'Saving...' : 'Save Settings'}
            </button>
            
            {#if shareUpdateMsg}
                <p class="text-sm mt-2 {shareUpdateMsg.includes('Error') ? 'text-red-500' : 'text-green-500'}">
                    {shareUpdateMsg}
                </p>
            {/if}
        </div>
    </section>
    {/if}

  </div>
</div>
