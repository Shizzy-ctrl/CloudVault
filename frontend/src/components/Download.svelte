<script>
    import { onMount } from 'svelte';
    import { apiRequest } from '../lib/api';
    import { Lock, FileText, Download as DownloadIcon } from 'lucide-svelte';

    export let params = {}; // Provided by router
    let publicId = params.id;

    let loading = true;
    let error = null;
    let locked = false;
    let files = [];
    let password = '';

    // Fetch initial status
    async function checkStatus() {
        try {
            loading = true;
            // Since we previously used HTML response for GET, we need the backend to return JSON now.
            // But we didn't change the backend GET yet. It returns HTML.
            // We need to update backend first or handle HTML response?
            // PLAN UPDATE: We must update public.py to return JSON first.
            
            // Assuming we updated backend to return JSON for /public/share/{id}
            const data = await apiRequest(`/public/share/${publicId}`, 'GET');
            
            if (data.locked) {
                locked = true;
                files = [];
            } else {
                locked = false;
                files = data.files;
            }
        } catch (e) {
            error = e.message;
        } finally {
            loading = false;
        }
    }

    async function unlock() {
        try {
            loading = true;
            const data = await apiRequest(`/public/share/${publicId}/unlock`, 'POST', { password });
            locked = false;
            files = data.files;     
        } catch (e) {
            error = e.message;
        } finally {
            loading = false;
        }
    }
    
    // Auto-check on mount
    onMount(() => {
        if (publicId) checkStatus();
    });

</script>

<div class="min-h-screen bg-gray-100 dark:bg-zinc-900 flex items-center justify-center p-4 font-sans">
    <div class="bg-white dark:bg-zinc-950 p-8 rounded-lg shadow-lg border border-gray-200 dark:border-zinc-800 max-w-2xl w-full text-center">
        
        <div class="mb-6 flex justify-center">
            <div class="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-full">
                {#if locked}
                     <Lock class="w-8 h-8 text-red-500" />
                {:else}
                     <DownloadIcon class="w-8 h-8 text-blue-600 dark:text-blue-400" /> 
                {/if}
            </div>
        </div>

        <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {#if loading}
                Loading...
            {:else if locked}
                Secured Share
            {:else if error}
                Error
            {:else}
                Shared Files
            {/if}
        </h1>
        
        {#if error}
            <div class="text-red-500 dark:text-red-400 mb-6">{error}</div>
        {/if}

        {#if !loading}
            {#if locked}
                 <p class="text-gray-500 dark:text-gray-400 mb-8">This share is password protected.</p>
                 <form on:submit|preventDefault={unlock} class="space-y-4 max-w-sm mx-auto">
                    <input 
                        type="password" 
                        bind:value={password} 
                        placeholder="Enter password" 
                        class="w-full px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50 dark:bg-zinc-900 dark:text-white"
                    />
                    <button type="submit" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg">
                        Unlock
                    </button>
                 </form>
            {:else if files.length > 0}
                 <div class="grid gap-3 text-left">
                    {#each files as file}
                        <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-700">
                             <div class="flex items-center gap-3 overflow-hidden">
                                <FileText class="w-5 h-5 text-gray-400" />
                                <span class="text-gray-700 dark:text-gray-200 truncate font-medium">{file.filename}</span>
                             </div>
                             <div class="flex gap-2">
                                <a href="/api/public/file/{file.token}" download class="p-2 text-gray-500 hover:text-green-600 hover:bg-gray-200 dark:hover:bg-zinc-800 rounded-md transition-colors">
                                    <DownloadIcon class="w-5 h-5" />
                                </a>
                             </div>
                        </div>
                    {/each}
                 </div>
            {/if}
        {/if}
        
    </div>
</div>
