import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { apiRequest } from '../lib/api'
import { Lock, FileText, Download as DownloadIcon, Cloud, Sparkles, Shield, Eye, EyeOff } from 'lucide-react'

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
  const [showPassword, setShowPassword] = useState(false)

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
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
        <div className="absolute top-40 right-20 w-72 h-72 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-40 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse animation-delay-4000"></div>
      </div>
      
      {/* Grid pattern overlay */}
      <div className="absolute inset-0 opacity-20" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }}></div>
      
      {/* Main content */}
      <div className="relative flex items-center justify-center min-h-screen px-4">
        <div className="w-full max-w-2xl">
          {/* Logo and branding */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-lg rounded-3xl mb-4 border border-white/30 shadow-2xl transform hover:scale-105 transition-all duration-300">
              <Cloud className="w-12 h-12 text-white drop-shadow-lg" />
            </div>
            <h1 className="text-5xl font-black text-white mb-2 flex items-center justify-center gap-3 tracking-tight">
              Cloud
              <span className="bg-gradient-to-r from-yellow-300 to-orange-400 bg-clip-text text-transparent">Vault</span>
              <Sparkles className="w-7 h-7 text-yellow-300 animate-pulse drop-shadow-lg" />
            </h1>
            <p className="text-white/90 text-xl font-medium">Secure File Sharing</p>
          </div>
          
          {/* Main card */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 shadow-2xl">
            <div className="mb-6 flex justify-center">
              {locked ? (
                <div className="p-4 bg-white/10 rounded-full border border-white/20">
                  <Lock className="w-8 h-8 text-red-400" />
                </div>
              ) : (
                <button 
                  onClick={() => {
                    files.forEach(file => {
                      const link = document.createElement('a');
                      link.href = `/api/public/file/${file.token}`;
                      link.download = file.filename;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    });
                  }}
                  className="p-4 bg-white/10 rounded-full border border-white/20 cursor-pointer hover:bg-white/20 transition-all duration-200 flex items-center justify-center"
                >
                  <DownloadIcon className="w-8 h-8 text-green-400" />
                </button>
              )}
            </div>

            <h2 className="text-2xl font-bold text-white mb-2">
              {loading ? (
                'Loading...'
              ) : locked ? (
                'Secured Share'
              ) : error ? (
                'Error'
              ) : (
                'Shared Files'
              )}
            </h2>
            
            {error && (
              <div className="text-red-300 mb-6 bg-red-500/20 border border-red-500/50 rounded-lg p-3">
                {error}
              </div>
            )}

            {!loading && (
              <>
                {locked ? (
                  <>
                    <p className="text-white/70 mb-8">This share is password protected. Enter password to access files.</p>
                    <form onSubmit={unlock} className="space-y-4 max-w-sm mx-auto">
                      <div className="relative">
                        <input 
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Enter password" 
                          className="w-full px-4 py-3 border border-white/30 rounded-xl focus:ring-2 focus:ring-white/30 bg-white/20 text-white placeholder-amber-200 font-medium pr-10"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white/80 transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <button 
                        type="submit" 
                        className="w-full bg-white text-purple-900 hover:bg-white/90 font-semibold py-3 rounded-xl transition-all duration-200 transform hover:scale-[1.02] shadow-lg flex items-center justify-center gap-2"
                        disabled={loading}
                      >
                        {loading ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-purple-900 border-t-transparent rounded-full animate-spin"></div>
                            Unlocking...
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Shield className="w-4 h-4" />
                            Unlock
                          </div>
                        )}
                      </button>
                    </form>
                  </>
                ) : files.length > 0 ? (
                  <div className="grid gap-3 text-left">
                    {files.map((file) => (
                      <div key={file.token} className="flex items-center justify-between p-4 bg-white/10 rounded-xl border border-white/20 backdrop-blur-sm hover:bg-white/15 transition-all duration-200">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <FileText className="w-5 h-5 text-white/60 flex-shrink-0" />
                          <span className="text-white truncate font-medium" title={file.filename}>{file.filename}</span>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <a 
                            href={`/api/public/file/${file.token}`} 
                            download 
                            className="p-2 text-white/60 hover:text-green-400 hover:bg-white/10 rounded-lg transition-all duration-200"
                          >
                            <DownloadIcon className="w-5 h-5" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-white/60 italic">No files available in this share.</p>
                )}
              </>
            )}
            
            {/* Footer */}
            <div className="mt-8 text-center">
              <p className="text-white/60 text-xs">
                Secure • Fast • Reliable
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Custom styles for animations */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 0.4; }
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  )
}
