import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div className="min-h-screen bg-[#f5f6fa]">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Backdrop — mobile only */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Header
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen((o) => !o)}
      />

      <main
        className={`pt-16 min-h-screen transition-all duration-300 ease-in-out ${
          sidebarOpen ? 'lg:ml-60' : 'lg:ml-0'
        }`}
      >
        <div className="p-5 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
