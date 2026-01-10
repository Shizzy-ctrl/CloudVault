import { useState, useEffect } from 'react'
import { getUserShares, deleteShare, ApiError } from '../lib/api'
import { Button } from './ui/button'
import { Alert, AlertDescription } from './ui/alert'
import { Share } from './Dashboard'
import { 
  Folder, 
  Clock, 
  Lock, 
  Trash2, 
  ExternalLink, 
  Calendar,
  FileText,
  Eye,
  RefreshCw
} from 'lucide-react'

interface ShareListProps {
  token: string
  onShareSelect: (share: Share) => void
  onTokenExpired: () => void
}

export default function ShareList({ token, onShareSelect, onTokenExpired }: ShareListProps) {
  const [shares, setShares] = useState<Share[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchShares = async () => {
    try {
      setLoading(true)
      const userShares = await getUserShares(token)
      setShares(userShares)
      setError('')
    } catch (e) {
      const error = e as ApiError
      if (error.isTokenExpired) {
        onTokenExpired()
      } else {
        setError(error instanceof Error ? error.message : 'Failed to load shares')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteShare = async (publicId: string) => {
    if (!confirm('Are you sure you want to delete this share and all its files?')) {
      return
    }

    try {
      setDeletingId(publicId)
      await deleteShare(publicId, token)
      setShares(shares.filter(s => s.public_id !== publicId))
      setError('')
    } catch (e) {
      const error = e as ApiError
      if (error.isTokenExpired) {
        onTokenExpired()
      } else {
        setError(error instanceof Error ? error.message : 'Failed to delete share')
      }
    } finally {
      setDeletingId(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const formatExpiration = (dateString: string | null) => {
    if (!dateString) return 'Never'
    const date = new Date(dateString)
    const now = new Date()
    if (date < now) return 'Expired'
    return date.toLocaleString()
  }

  const isExpired = (dateString: string | null) => {
    if (!dateString) return false
    return new Date(dateString) < new Date()
  }

  useEffect(() => {
    fetchShares()
  }, [token])

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-white flex items-center gap-2">
          <Folder className="w-5 h-5" />
          Your Shares ({shares.length})
        </h3>
        <Button
          onClick={fetchShares}
          disabled={loading}
          variant="outline"
          size="sm"
          className="bg-white/10 border-white/20 text-white hover:bg-white/20"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <Alert className="bg-red-500/20 border-red-500/50 text-white">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent"></div>
        </div>
      ) : shares.length === 0 ? (
        <div className="text-center py-8 text-white/60">
          <Folder className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>No shares yet. Upload some files to get started!</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {shares.map((share) => (
            <div
              key={share.public_id}
              className={`bg-white/10 backdrop-blur-lg p-4 rounded-xl border ${
                isExpired(share.expires_at) 
                  ? 'border-red-500/50 opacity-75' 
                  : 'border-white/20'
              } hover:bg-white/15 transition-all duration-200`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-medium text-white truncate">
                      Share {share.public_id.substring(0, 8)}...
                    </h4>
                    {share.password_protected && (
                      <Lock className="w-4 h-4 text-yellow-400" />
                    )}
                    {isExpired(share.expires_at) && (
                      <span className="px-2 py-1 bg-red-500/20 text-red-300 text-xs rounded-full">
                        Expired
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-white/70 mb-3">
                    <div className="flex items-center gap-1">
                      <FileText className="w-4 h-4" />
                      {share.file_count} files
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Created {formatDate(share.created_at)}
                    </div>
                    {share.expires_at && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        Expires {formatExpiration(share.expires_at)}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={share.share_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-blue-300 hover:text-blue-200 text-sm"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Open Link
                    </a>
                    <span className="text-white/30">•</span>
                    <button
                      onClick={() => onShareSelect(share)}
                      className="text-green-300 hover:text-green-200 text-sm flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" />
                      View Details
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <Button
                    onClick={() => onShareSelect(share)}
                    variant="outline"
                    size="sm"
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => handleDeleteShare(share.public_id)}
                    disabled={deletingId === share.public_id}
                    variant="outline"
                    size="sm"
                    className="bg-red-500/10 border-red-500/20 text-red-300 hover:bg-red-500/20"
                  >
                    {deletingId === share.public_id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-300 border-t-transparent"></div>
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
