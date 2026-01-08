import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import Login from './components/Login'
import Dashboard from './components/Dashboard'
import PublicShare from './components/PublicShare'
import ChangePassword from './components/ChangePassword'
import ErrorBoundary from './components/ErrorBoundary'

function App() {
  const { isAuthenticated, mustChangePassword } = useAuth()

  return (
    <div className="antialiased text-gray-900 min-h-screen font-sans">
      <ErrorBoundary>
        <Routes>
          <Route 
            path="/share/:id" 
            element={<PublicShare />} 
          />
          <Route 
            path="/download/:id" 
            element={<PublicShare />} 
          />
          <Route 
            path="/login" 
            element={
              isAuthenticated ? (
                <Navigate to="/" replace />
              ) : (
                <Login />
              )
            } 
          />
          <Route 
            path="/" 
            element={
              !isAuthenticated ? (
                <Navigate to="/login" replace />
              ) : mustChangePassword ? (
                <ChangePassword />
              ) : (
                <Dashboard />
              )
            } 
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ErrorBoundary>
    </div>
  )
}

export default App
