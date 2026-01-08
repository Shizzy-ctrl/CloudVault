import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { apiRequest } from '../lib/api'
import { Lock, FileText, Download as DownloadIcon } from 'lucide-react'

interface FileData {
  filename: string
  token: string
}

interface ShareData {
  locked: boolean
  files: FileData[]
}

export default function PublicShare() {
  const { id } = useParams<{ id: string }>()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [locked, setLocked] = useState(false)
  const [files, setFiles] = useState<FileData[]>([])
  const [password, setPassword] = useState('')

  // Fetch initial status
  async function checkStatus() {
    if (!id) return
    
    try {
      setLoading(true)
      setError('')
      const data: ShareData = await apiRequest(`/public/share/${id}`, 'GET')
      
      if (data.locked) {
        setLocked(true)
        setFiles([])
      } else {
        setLocked(false)
        setFiles(data.files)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load share')
    } finally {
      setLoading(false)
    }
  }

  async function unlock(e: React.FormEvent) {
    e.preventDefault()
    if (!id) return
    
    try {
      setLoading(true)
      setError('')
      const data: ShareData = await apiRequest(`/public/share/${id}/unlock`, 'POST', { password })
      setLocked(false)
      setFiles(data.files)     
      setPassword('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to unlock share')
    } finally {
      setLoading(false)
    }
  }
  
  useEffect(() => {
    if (id) checkStatus()
  }, [id])

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-zinc-900 flex items-center justify-center p-4 font-sans">
      <div className="bg-white dark:bg-zinc-950 p-8 rounded-lg shadow-lg border border-gray-200 dark:border-zinc-800 max-w-2xl w-full text-center">
        
        <div className="mb-6 flex justify-center">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-full">
            {locked ? (
              <Lock className="w-8 h-8 text-red-500" />
            ) : (
              <DownloadIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" /> 
            )}
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {loading ? (
            'Loading...'
          ) : locked ? (
            'Secured Share'
          ) : error ? (
            'Error'
          ) : (
            'Shared Files'
          )}
        </h1>
        
        {error && (
          <div className="text-red-500 dark:text-red-400 mb-6">{error}</div>
        )}

        {!loading && (
          <>
            {locked ? (
              <>
                <p className="text-gray-500 dark:text-gray-400 mb-8">This share is password protected.</p>
                <form onSubmit={unlock} className="space-y-4 max-w-sm mx-auto">
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password" 
                    className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50 dark:bg-zinc-900 dark:text-white"
                    required
                  />
                  <button 
                    type="submit" 
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg"
                    disabled={loading}
                  >
                    {loading ? 'Unlocking...' : 'Unlock'}
                  </button>
                </form>
              </>
            ) : files.length > 0 ? (
              <div className="grid gap-3 text-left">
                {files.map((file) => (
                  <div key={file.token} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-700">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <FileText className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-700 dark:text-gray-200 truncate font-medium">{file.filename}</span>
                    </div>
                    <div className="flex gap-2">
                      <a 
                        href={`/api/public/file/${file.token}`} 
                        download 
                        className="p-2 text-gray-500 hover:text-green-600 hover:bg-gray-200 dark:hover:bg-zinc-800 rounded-md transition-colors"
                      >
                        <DownloadIcon className="w-5 h-5" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">No files available in this share.</p>
            )}
          </>
        )}
        
      </div>
    </div>
  )
}
