import { useParams } from 'react-router-dom'
import { Suspense } from 'react'

function DownloadContent() {
  const { id } = useParams<{ id: string }>()

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-zinc-900 flex items-center justify-center p-8">
      <div className="max-w-2xl w-full bg-white dark:bg-zinc-950 rounded-lg shadow-md border border-zinc-200 dark:border-zinc-800 p-8">
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-900 dark:text-white">Download Files</h1>
        
        <div className="text-center space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Download ID: <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm">{id}</code>
          </p>
          
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-blue-800 dark:text-blue-200 text-sm">
              This is a placeholder for the download functionality. In a real implementation, this would:
            </p>
            <ul className="text-left text-blue-800 dark:text-blue-200 text-sm mt-2 space-y-1">
              <li>• Fetch share information from the API</li>
              <li>• Check if password protection is required</li>
              <li>• Show file list and download options</li>
              <li>• Handle file downloads securely</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Download() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-100 dark:bg-zinc-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Loading download...</p>
        </div>
      </div>
    }>
      <DownloadContent />
    </Suspense>
  )
}
