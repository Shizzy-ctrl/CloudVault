import { useState, useRef } from 'react'
import { useAuth } from '../hooks/useAuth'
import { uploadFiles, apiRequest } from '../lib/api'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Alert, AlertDescription } from './ui/alert'
import { Upload, LogOut, Link, Clock, Lock, FileText, Folder } from 'lucide-react'

interface ShareResult {
  public_id: string;
  share_link: string;
  files: Array<{ filename: string }>;
}

export default function Dashboard() {
  const { user, token, logout } = useAuth()
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

  async function handleUpload() {
    if (!files || files.length === 0) return
    setIsLoading(true)
    try {
      const result = await uploadFiles(files, token!)
      setUploadResult(result)
      setError('')
      setShareSettings({ password: '', expires_minutes: '30' })
      setShareUpdateMsg('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed')
      setUploadResult(null)
    } finally {
      setIsLoading(false)
    }
  }

  async function updateShareSettings() {
    if (!uploadResult) return
    setIsLoading(true)
    try {
      const body = {
        public_id: uploadResult.public_id,
        password: shareSettings.password ? shareSettings.password : null,
        expires_minutes: shareSettings.expires_minutes ? parseInt(shareSettings.expires_minutes) : null
      }
      
      await apiRequest(`/share/${uploadResult.public_id}`, 'POST', body, token!)
      setShareUpdateMsg('Settings updated successfully!')
    } catch (e) {
      setShareUpdateMsg('Error updating settings: ' + (e instanceof Error ? e.message : 'Unknown error'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFiles(e.target.files)
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-zinc-900 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        <header className="flex justify-between items-center bg-white dark:bg-zinc-950 p-6 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">FileShare</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Welcome back, {user?.username}</p>
          </div>
          <Button 
            onClick={logout}
            variant="outline"
            className="flex items-center gap-2 text-red-600 hover:text-red-700"
          >
            <LogOut size={16} />
            Logout
          </Button>
        </header>

        <section className="bg-white dark:bg-zinc-950 p-6 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 dark:text-white">
            <Upload size={20} />
            Upload Files
          </h2>
          
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-zinc-800 dark:bg-zinc-900 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
                  <Folder className="w-12 h-12 mb-4 text-gray-400" />
                  {files && files.length > 0 ? (
                    <>
                      <p className="mb-2 text-sm text-gray-500 dark:text-gray-400 font-semibold">{files.length} file(s) selected</p>
                      <ul className="text-xs text-gray-400 max-h-32 overflow-y-auto">
                        {Array.from(files).map((f, index) => (
                          <li key={index}>{f.name}</li>
                        ))}
                      </ul>
                    </>
                  ) : (
                    <>
                      <p className="mb-2 text-sm text-gray-500 dark:text-gray-400"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Select multiple files at once</p>
                    </>
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

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button 
              onClick={handleUpload} 
              disabled={!files || isLoading}
              className="w-full"
            >
              {isLoading ? 'Uploading...' : 'Upload Files'}
            </Button>
          </div>
        </section>

        {uploadResult && (
          <section className="bg-white dark:bg-zinc-950 p-6 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-6 pb-6 border-b border-gray-100 dark:border-zinc-800">
              <h3 className="text-lg font-semibold text-green-600 dark:text-green-400 mb-2">Share Created!</h3>
              <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-zinc-900 rounded-md border border-gray-200 dark:border-zinc-700 mb-4">
                <Link size={16} className="text-gray-500" />
                <a href={uploadResult.share_link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm break-all">{uploadResult.share_link}</a>
              </div>

              <div className="bg-gray-50 dark:bg-zinc-900 p-4 rounded-md">
                <h4 className="text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">Files in this Share:</h4>
                <ul className="space-y-1">
                  {uploadResult.files.map((file, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <FileText size={14} /> {file.filename}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="text-md font-medium dark:text-white">Share Settings</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="flex items-center gap-2">
                    <Lock size={16} /> Password Protection (Optional)
                  </Label>
                  <Input 
                    type="password" 
                    value={shareSettings.password}
                    onChange={(e) => setShareSettings(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Set a password"
                  />
                </div>
                <div>
                  <Label className="flex items-center gap-2">
                    <Clock size={16} /> Expiration Time
                  </Label>
                  <Select 
                    value={shareSettings.expires_minutes}
                    onValueChange={(value) => setShareSettings(prev => ({ ...prev, expires_minutes: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
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

              <Button 
                onClick={updateShareSettings}
                disabled={isLoading}
                variant="secondary"
              >
                {isLoading ? 'Saving...' : 'Save Settings'}
              </Button>
              
              {shareUpdateMsg && (
                <p className={`text-sm mt-2 ${shareUpdateMsg.includes('Error') ? 'text-red-500' : 'text-green-500'}`}>
                  {shareUpdateMsg}
                </p>
              )}
            </div>
          </section>
        )}

      </div>
    </div>
  )
}
