import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'

export function AppLayout() {
  return (
    <div className="min-h-screen bg-muted/30">
      <Sidebar />
      <Header />
      <main className="ml-60 pt-16 p-6 min-h-screen">
        <Outlet />
      </main>
    </div>
  )
}
