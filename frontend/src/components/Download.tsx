import { useParams } from 'react-router-dom'
import { Suspense } from 'react'
import { Cloud, Sparkles, Download as DownloadIcon, Shield, FileText, Lock } from 'lucide-react'

function DownloadContent() {
  const { id } = useParams<{ id: string }>()

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
            <p className="text-white/90 text-xl font-medium">Secure Downloads</p>
          </div>
          
          {/* Main card */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 shadow-2xl">
            <div className="mb-6 flex justify-center">
              <div className="p-4 bg-white/10 rounded-full border border-white/20">
                <DownloadIcon className="w-8 h-8 text-green-300" />
              </div>
            </div>

            <h2 className="text-2xl font-bold text-white mb-2 text-center">
              Download Files
            </h2>
            <p className="text-white/70 text-center mb-6">
              Download ID: <code className="bg-white/10 px-2 py-1 rounded text-sm text-white">{id}</code>
            </p>

            <div className="grid gap-4">
              <div className="flex items-start gap-3 p-4 bg-white/5 rounded-xl border border-white/10">
                <Shield className="w-5 h-5 text-yellow-300 mt-0.5" />
                <div>
                  <p className="text-white font-medium">Secure access</p>
                  <p className="text-white/70 text-sm">We verify permissions and protect downloads with expiring tokens.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-white/5 rounded-xl border border-white/10">
                <Lock className="w-5 h-5 text-blue-300 mt-0.5" />
                <div>
                  <p className="text-white font-medium">Password support</p>
                  <p className="text-white/70 text-sm">Password-protected shares require validation before showing files.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-white/5 rounded-xl border border-white/10">
                <FileText className="w-5 h-5 text-green-300 mt-0.5" />
                <div>
                  <p className="text-white font-medium">File list & downloads</p>
                  <p className="text-white/70 text-sm">We will display file names and allow secure downloads per file.</p>
                </div>
              </div>
            </div>
            
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

export default function Download() {
  return (
    <Suspense fallback={
      <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent mx-auto"></div>
          <p className="mt-2 text-white/70">Loading download...</p>
        </div>
      </div>
    }>
      <DownloadContent />
    </Suspense>
  )
}
