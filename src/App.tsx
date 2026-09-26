import { useState, useEffect } from 'react'
import { AdminPage } from '@/pages/AdminPage'
import { PortalPage } from '@/pages/PortalPage'

export function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname)

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname)
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  // Cek apakah URL adalah rute portal teman: /view/:token
  const portalMatch = currentPath.match(/^\/view\/([a-zA-Z0-9_-]+)/)

  if (portalMatch) {
    const token = portalMatch[1]
    return <PortalPage token={token} />
  }

  // Default: Halaman Dashboard Admin
  return <AdminPage />
}

export default App
