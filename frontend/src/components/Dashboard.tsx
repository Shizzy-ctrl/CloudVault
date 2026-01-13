import { useState, useRef } from 'react'
import { useAuth } from '../hooks/useAuth'
import { uploadFiles, apiRequest, ApiError } from '../lib/api'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Alert, AlertDescription } from './ui/alert'
import ShareList from './ShareList'
import ShareDetails from './ShareDetails'
import { Upload, LogOut, Link, Clock, Lock, FileText, Folder, Cloud, Sparkles, Shield, Zap, List } from 'lucide-react'

// Unified Share interface that works for both components
export interface Share {
  public_id: string
  share_link: string
  files: Array<{ id: number; filename: string }>
  file_count?: number
  expires_at: string | null
  password_protected: boolean
  created_at: string
  is_shared: boolean
}

interface ShareResult {
  public_id: string;
  share_link: string;
  files: Array<{ filename: string }>;
}

export default function Dashboard() {
  const { user, token, logout, handleTokenExpiration } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [files, setFiles] = useState<FileList | null>(null)
  const [uploadResult, setUploadResult] = useState<ShareResult | null>(null)
  const [error, setError] = useState('')
  const [shareSettings, setShareSettings] = useState({
    password: '',
    expires_minutes: '30'
  })
  const [shareUpdateMsg, setShareUpdateMsg] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isUpdatingSettings, setIsUpdatingSettings] = useState(false)
  const [currentView, setCurrentView] = useState<'upload' | 'shares'>('upload')
  const [selectedShare, setSelectedShare] = useState<Share | null>(null)

  async function applyShareSettings(publicId: string, settings: { password: string; expires_minutes: string }) {
    const body = {
      public_id: publicId,
      password: settings.password ? settings.password : null,
      expires_minutes: settings.expires_minutes ? parseInt(settings.expires_minutes) : null
    }

    await apiRequest(`/share/${publicId}`, 'POST', body, token!)
  }

  async function handleUpload() {
    if (!files || files.length === 0) return
    setIsLoading(true)
    try {
      const result = await uploadFiles(files, token!)
      setUploadResult(result)
      setError('')
      const shouldApplySettings = Boolean(shareSettings.password) || shareSettings.expires_minutes !== '30'
      if (shouldApplySettings) {
        try {
          await applyShareSettings(result.public_id, shareSettings)
          setShareUpdateMsg('Files uploaded and settings applied!')
        } catch (settingsError) {
          const error = settingsError as ApiError
          if (error.isTokenExpired) {
            handleTokenExpiration()
          } else {
            setShareUpdateMsg('Files uploaded, but settings update failed: ' + (error instanceof Error ? error.message : 'Unknown error'))
          }
        }
      } else {
        setShareUpdateMsg('Files uploaded successfully!')
      }
      setShareSettings({ password: '', expires_minutes: '30' })
    } catch (e) {
      const error = e as ApiError
      if (error.isTokenExpired) {
        handleTokenExpiration()
      } else {
        setError(error instanceof Error ? error.message : 'Upload failed')
      }
      setUploadResult(null)
    } finally {
      setIsLoading(false)
    }
  }

  async function updateShareSettings() {
    if (!uploadResult) return
    setIsUpdatingSettings(true)
    try {
      await applyShareSettings(uploadResult.public_id, shareSettings)
      setShareUpdateMsg('Settings updated successfully!')
    } catch (e) {
      const error = e as ApiError
      if (error.isTokenExpired) {
        handleTokenExpiration()
      } else {
        setShareUpdateMsg('Error updating settings: ' + (error instanceof Error ? error.message : 'Unknown error'))
      }
    } finally {
      setIsUpdatingSettings(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFiles(e.target.files)
  }

  const handleShareSelect = (share: Share) => {
    setSelectedShare(share)
  }

  const handleBackToShares = () => {
    setSelectedShare(null)
  }

  const handleGoToUpload = () => {
    setSelectedShare(null)
    setCurrentView('upload')
  }

  const handleViewChange = (view: 'upload' | 'shares') => {
    setSelectedShare(null)
    setCurrentView(view)
  }

  const handleShareUpdated = () => {
    if (selectedShare) {
      // The ShareList component will handle refreshing
    }
  }

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
      <div className="relative z-10 min-h-screen p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* Header */}
          <header className="flex justify-between items-center bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-white/20 to-white/10 rounded-xl border border-white/30 shadow-lg transform hover:scale-105 transition-all duration-300">
                <Cloud className="w-10 h-10 text-white drop-shadow-lg" />
              </div>
              <div>
                <h1 className="text-4xl font-black text-white flex items-center gap-2 tracking-tight">
                  Cloud
                  <span className="bg-gradient-to-r from-yellow-300 to-orange-400 bg-clip-text text-transparent">Vault</span>
                  <Sparkles className="w-6 h-6 text-yellow-300 animate-pulse drop-shadow-lg" />
                </h1>
                <p className="text-white/90 font-medium">Welcome back, {user?.username}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-1.5 shadow-lg">
                <Button
                  onClick={() => handleViewChange('upload')}
                  variant={currentView === 'upload' ? 'default' : 'ghost'}
                  className={`flex items-center justify-center gap-2 px-5 py-2.5 min-w-[140px] rounded-xl transition-all duration-200 ${
                    currentView === 'upload' 
                      ? 'bg-gradient-to-r from-yellow-300 to-orange-400 text-purple-900 shadow-md' 
                      : 'text-white hover:bg-white/15'
                  }`}
                >
                  <Upload size={16} />
                  Upload
                </Button>
                <Button
                  onClick={() => handleViewChange('shares')}
                  variant={currentView === 'shares' ? 'default' : 'ghost'}
                  className={`flex items-center justify-center gap-2 px-5 py-2.5 min-w-[140px] rounded-xl transition-all duration-200 ${
                    currentView === 'shares' 
                      ? 'bg-gradient-to-r from-cyan-300 to-blue-400 text-purple-900 shadow-md' 
                      : 'text-white hover:bg-white/15'
                  }`}
                >
                  <List size={16} />
                  My Shares
                </Button>
              </div>
              <Button 
                onClick={logout}
                variant="outline"
                className="flex items-center gap-2 bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white transition-all duration-200"
              >
                <LogOut size={16} />
                Logout
              </Button>
            </div>
          </header>

          {/* Main Content */}
          {selectedShare ? (
            <ShareDetails
              share={selectedShare}
              token={token!}
              onBack={handleBackToShares}
              onGoUpload={handleGoToUpload}
              onShareUpdated={handleShareUpdated}
              onTokenExpired={handleTokenExpiration}
            />
          ) : currentView === 'upload' ? (
            <div>
              {/* Upload Section */}
              <section className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20 shadow-2xl">
                <h2 className="text-2xl font-semibold mb-6 flex items-center gap-3 text-white">
                  <div className="p-2 bg-white/10 rounded-lg">
                    <Upload size={20} className="text-white" />
                  </div>
                  Upload Files
                  <Zap className="w-5 h-5 text-yellow-300 animate-pulse" />
                </h2>
              
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-white/30 border-dashed rounded-2xl cursor-pointer bg-white/5 hover:bg-white/10 transition-all duration-200 backdrop-blur-sm">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
                        <Folder className="w-16 h-16 mb-4 text-white/60" />
                        {files && files.length > 0 ? (
                          <div>
                            <p className="mb-2 text-sm text-white/80 font-semibold">{files.length} file(s) selected</p>
                            <ul className="text-xs text-white/60 max-h-32 overflow-y-auto">
                              {Array.from(files).map((f, index) => (
                                <li key={index}>{f.name}</li>
                              ))}
                            </ul>
                          </div>
                        ) : (
                          <div>
                            <p className="mb-2 text-sm text-white/80"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                            <p className="text-xs text-white/60">Select multiple files at once</p>
                          </div>
                        )}
                      </div>
                      <input 
                        ref={fileInputRef}
                        type="file" 
                        multiple 
                        className="hidden" 
                        onChange={handleFileChange} 
                      />
                    </label>
                  </div> 

                  <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                    <h4 className="text-sm font-semibold mb-4 text-white/80 flex items-center gap-2">
                      <Lock size={16} />
                      Share Settings (optional)
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-white/80">
                          <Lock size={16} /> Password Protection
                        </Label>
                        <Input
                          type="password"
                          value={shareSettings.password}
                          onChange={(e) => setShareSettings(prev => ({ ...prev, password: e.target.value }))}
                          placeholder="Set a password"
                          className="bg-white/20 border-white/30 text-white placeholder-white/80 focus:border-white/50 focus:ring-white/30 font-medium"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-white/80">
                          <Clock size={16} /> Expiration Time
                        </Label>
                        <Select
                          value={shareSettings.expires_minutes}
                          onValueChange={(value) => setShareSettings(prev => ({ ...prev, expires_minutes: value }))}
                        >
                          <SelectTrigger className="bg-white/20 border-white/30 text-white font-medium">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-white/20 border-white/30 text-white backdrop-blur-lg">
                            <SelectItem value="5">5 minutes</SelectItem>
                            <SelectItem value="15">15 minutes</SelectItem>
                            <SelectItem value="30">30 minutes</SelectItem>
                            <SelectItem value="60">1 hour</SelectItem>
                            <SelectItem value="360">6 hours</SelectItem>
                            <SelectItem value="720">12 hours</SelectItem>
                            <SelectItem value="1440">1 day</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {error && (
                    <Alert className="bg-red-500/20 border-red-500/50 text-white">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <Button 
                    onClick={handleUpload} 
                    disabled={!files || isLoading}
                    className="w-full bg-white text-purple-900 hover:bg-white/90 font-semibold py-3 rounded-xl transition-all duration-200 transform hover:scale-[1.02] shadow-lg relative"
                  >
                    {isLoading && (
                      <div className="absolute inset-0 bg-white/30 rounded-xl flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-900 border-t-transparent"></div>
                      </div>
                    )}
                    <span className={isLoading ? 'opacity-50' : ''}>
                      {isLoading ? 'Uploading...' : 'Upload Files'}
                    </span>
                  </Button>
                </div>
              </section>

              {uploadResult && (
                <section className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="mb-6 pb-6 border-b border-white/10">
                    <h3 className="text-xl font-semibold text-green-300 mb-2 flex items-center gap-2">
                      <Shield className="w-5 h-5" />
                      Share Created Successfully!
                    </h3>
                    <div className="flex items-center gap-2 p-3 bg-white/5 rounded-xl border border-white/10 mb-4">
                      <Link size={16} className="text-white/60" />
                      <a href={uploadResult.share_link} target="_blank" rel="noopener noreferrer" className="text-blue-300 hover:text-blue-200 text-sm break-all">{uploadResult.share_link}</a>
                    </div>

                    <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                      <h4 className="text-sm font-semibold mb-2 text-white/80">Files in this Share:</h4>
                      <ul className="space-y-1">
                        {uploadResult.files.map((file, index) => (
                          <li key={index} className="flex items-center gap-2 text-sm text-white/60">
                            <FileText size={14} /> {file.filename}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  
                  {shareUpdateMsg && (
                    <Alert className={shareUpdateMsg.includes('Error') ? 'bg-red-500/20 border-red-500/50 text-white' : 'bg-green-500/20 border-green-500/50 text-white'}>
                      <AlertDescription>
                        {shareUpdateMsg}
                      </AlertDescription>
                    </Alert>
                  )}
                </section>
              )}
            </div>
          ) : (
            <ShareList
              token={token!}
              onShareSelect={handleShareSelect}
              onTokenExpired={handleTokenExpiration}
            />
          )}
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
