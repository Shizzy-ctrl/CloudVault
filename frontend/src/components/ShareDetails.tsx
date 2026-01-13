import { useState, useRef, useEffect } from 'react'
import { getShareDetails, addFilesToShare, deleteFileFromShare, apiRequest, ApiError } from '../lib/api'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Alert, AlertDescription } from './ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog'
import { Share } from './Dashboard'
import { 
  ArrowLeft, 
  Upload, 
  Trash2, 
  Lock, 
  Clock, 
  Calendar, 
  FileText, 
  ExternalLink,
  Plus,
  Shield
} from 'lucide-react'

interface ShareDetailsProps {
  share: Share
  token: string
  onBack: () => void
  onGoUpload: () => void
  onShareUpdated: () => void
  onTokenExpired: () => void
}

export default function ShareDetails({ share: initialShare, token, onBack, onGoUpload, onShareUpdated, onTokenExpired }: ShareDetailsProps) {
  const [share, setShare] = useState(initialShare)
  const [loading, setLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [files, setFiles] = useState<FileList | null>(null)
  const [shareSettings, setShareSettings] = useState({
    password: '',
    expires_minutes: ''
  })
  const [isUpdatingSettings, setIsUpdatingSettings] = useState(false)
  const [deletingFileId, setDeletingFileId] = useState<number | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [pendingDeleteFileId, setPendingDeleteFileId] = useState<number | null>(null)
  const [pendingDeleteFileName, setPendingDeleteFileName] = useState<string>('')

  const refreshShareDetails = async (publicId: string) => {
    setIsRefreshing(true)
    try {
      const updatedShare = await getShareDetails(publicId, token)
      setShare(updatedShare)
      setError('')
    } catch (e) {
      const error = e as ApiError
      if (error.isTokenExpired) {
        onTokenExpired()
      } else {
        setError(error instanceof Error ? error.message : 'Failed to load share details')
      }
    } finally {
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    setShare(initialShare)
    refreshShareDetails(initialShare.public_id)
  }, [initialShare.public_id])

  const handleAddFiles = async () => {
    if (!files || files.length === 0) return
    
    setLoading(true)
    try {
      const updatedShare = await addFilesToShare(share.public_id, files, token)
      setShare(updatedShare)
      setFiles(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      setSuccess('Files added successfully!')
      setError('')
      onShareUpdated()
    } catch (e) {
      const error = e as ApiError
      if (error.isTokenExpired) {
        onTokenExpired()
      } else {
        setError(error instanceof Error ? error.message : 'Failed to add files')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteFile = async (fileId: number) => {
    setDeletingFileId(fileId)
    try {
      await deleteFileFromShare(share.public_id, fileId, token)
      setShare(prev => ({
        ...prev,
        files: prev.files.filter(f => f.id !== fileId)
      }))
      setSuccess('File deleted successfully!')
      setError('')
      onShareUpdated()
    } catch (e) {
      const error = e as ApiError
      if (error.isTokenExpired) {
        onTokenExpired()
      } else {
        setError(error instanceof Error ? error.message : 'Failed to delete file')
      }
    } finally {
      setDeletingFileId(null)
    }
  }

  const updateShareSettings = async () => {
    setIsUpdatingSettings(true)
    try {
      const body = {
        password: shareSettings.password || null,
        expires_minutes: shareSettings.expires_minutes ? parseInt(shareSettings.expires_minutes) : null
      }
      
      await apiRequest(`/share/${share.public_id}`, 'POST', body, token)
      
      // Refresh share details
      const updatedShare = await getShareDetails(share.public_id, token)
      setShare(updatedShare)
      setShareSettings({ password: '', expires_minutes: '' })
      setSuccess('Settings updated successfully!')
      setError('')
      onShareUpdated()
    } catch (e) {
      const error = e as ApiError
      if (error.isTokenExpired) {
        onTokenExpired()
      } else {
        setError(error instanceof Error ? error.message : 'Failed to update settings')
      }
    } finally {
      setIsUpdatingSettings(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const formatExpiration = (dateString: string | null) => {
    if (!dateString) return 'Never'
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFiles(e.target.files)
  }

  const requestDeleteFile = (fileId: number, filename: string) => {
    setPendingDeleteFileId(fileId)
    setPendingDeleteFileName(filename)
    setIsDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (pendingDeleteFileId === null) return
    const fileId = pendingDeleteFileId
    setIsDeleteDialogOpen(false)
    setPendingDeleteFileId(null)
    setPendingDeleteFileName('')
    await handleDeleteFile(fileId)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          onClick={onBack}
          variant="outline"
          size="sm"
          className="bg-white/10 border-white/20 text-white hover:bg-white/20"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Shares
        </Button>
        <Button
          onClick={onGoUpload}
          variant="outline"
          size="sm"
          className="bg-white/10 border-white/20 text-white hover:bg-white/20"
        >
          <Upload className="w-4 h-4" />
          Upload
        </Button>
        <h3 className="text-xl font-semibold text-white">
          Share Details: {share.public_id.substring(0, 8)}...
        </h3>
      </div>

      {error && (
        <Alert className="bg-red-500/20 border-red-500/50 text-white">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-green-500/20 border-green-500/50 text-white">
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Share Info */}
      <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20">
        <h4 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Share Information
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="space-y-2">
            <Label className="text-white/80">Share Link</Label>
            <div className="flex items-center gap-2 p-3 bg-white/5 rounded-xl border border-white/10">
              <ExternalLink size={16} className="text-white/60" />
              <a 
                href={share.share_link} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-blue-300 hover:text-blue-200 text-sm break-all"
              >
                {share.share_link}
              </a>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label className="text-white/80">Status</Label>
            <div className="flex items-center gap-2">
              {share.password_protected && (
                <div className="flex items-center gap-1 px-3 py-1 bg-yellow-500/20 text-yellow-300 rounded-full text-sm">
                  <Lock className="w-3 h-3" />
                  Password Protected
                </div>
              )}
              <div className="flex items-center gap-1 px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-sm">
                <Calendar className="w-3 h-3" />
                {share.files?.length || 0} files
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-white/80 flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              Created
            </Label>
            <p className="text-white/70">{formatDate(share.created_at)}</p>
          </div>
          
          <div className="space-y-2">
            <Label className="text-white/80 flex items-center gap-1">
              <Clock className="w-4 h-4" />
              Expires
            </Label>
            <p className="text-white/70">{formatExpiration(share.expires_at)}</p>
          </div>
        </div>
      </div>

      {/* Share Settings */}
      <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20">
        <h4 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
          <Lock className="w-5 h-5" />
          Share Settings
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="space-y-2">
            <Label className="text-white/80">Password Protection</Label>
            <Input 
              type="password" 
              value={shareSettings.password}
              onChange={(e) => setShareSettings(prev => ({ ...prev, password: e.target.value }))}
              placeholder="Set new password (leave empty to remove)"
              className="bg-white/20 border-white/30 text-white placeholder-white/80 focus:border-white/50 focus:ring-white/30"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-white/80">Expiration Time</Label>
            <Select 
              value={shareSettings.expires_minutes}
              onValueChange={(value) => setShareSettings(prev => ({ ...prev, expires_minutes: value }))}
            >
              <SelectTrigger className="bg-white/20 border-white/30 text-white">
                <SelectValue placeholder="Select expiration" />
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

        <Button 
          onClick={updateShareSettings}
          disabled={isUpdatingSettings}
          className="bg-white text-purple-900 hover:bg-white/90 font-semibold"
        >
          {isUpdatingSettings ? 'Saving...' : 'Update Settings'}
        </Button>
      </div>

      {/* Add Files */}
      <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20">
        <h4 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Add More Files
        </h4>
        
        <div className="space-y-4">
          <div className="flex items-center justify-center w-full">
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-white/30 border-dashed rounded-xl cursor-pointer bg-white/5 hover:bg-white/10 transition-all duration-200">
              <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
                <Upload className="w-8 h-8 mb-2 text-white/60" />
                {files && files.length > 0 ? (
                  <p className="text-sm text-white/80">{files.length} file(s) selected</p>
                ) : (
                  <p className="text-sm text-white/80">Click to add more files</p>
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

          <Button 
            onClick={handleAddFiles}
            disabled={!files || loading}
            className="w-full bg-white text-purple-900 hover:bg-white/90 font-semibold"
          >
            {loading ? 'Adding Files...' : 'Add Files to Share'}
          </Button>
        </div>
      </div>

      {/* Files List */}
      <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20">
        <h4 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Files ({share.files?.length || 0})
        </h4>

        {isRefreshing ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
          </div>
        ) : (!share.files || share.files.length === 0) ? (
          <p className="text-white/60 text-center py-4">No files in this share yet.</p>
        ) : (
          <div className="space-y-2">
            {share.files?.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-white/60" />
                  <span className="text-white/80">{file.filename}</span>
                </div>
                <Button
                  onClick={() => requestDeleteFile(file.id, file.filename)}
                  disabled={deletingFileId === file.id}
                  variant="outline"
                  size="sm"
                  className="bg-red-500/10 border-red-500/20 text-red-300 hover:bg-red-500/20"
                >
                  {deletingFileId === file.id ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-300 border-t-transparent"></div>
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="bg-white/10 border-white/20 text-white backdrop-blur-lg">
          <DialogHeader>
            <DialogTitle>Delete file?</DialogTitle>
            <DialogDescription className="text-white/70">
              This will permanently remove {pendingDeleteFileName || 'this file'} from the share.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="bg-red-500/80 text-white hover:bg-red-500"
              onClick={handleConfirmDelete}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
