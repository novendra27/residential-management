import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Users, Home, FileText, Wallet, BarChart2, X, PanelLeftClose } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/residents', icon: Users, label: 'Penghuni' },
  { to: '/houses', icon: Home, label: 'Rumah' },
  { to: '/bills', icon: FileText, label: 'Tagihan' },
  { to: '/expenses', icon: Wallet, label: 'Pengeluaran' },
  { to: '/report', icon: BarChart2, label: 'Laporan' },
]

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  // Tutup sidebar hanya saat mobile ketika nav diklik
  const handleNavClick = () => {
    if (window.innerWidth < 1024) onClose()
  }

  return (
    <aside
      className={cn(
        'fixed top-0 left-0 h-full w-60 bg-white border-r border-border flex flex-col z-30 transition-transform duration-300 ease-in-out',
        isOpen ? 'translate-x-0' : '-translate-x-full'
      )}
    >
      {/* Logo + toggle button */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center shrink-0">
            <Home className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-base text-foreground">Manajemen RT</span>
        </div>
        {/* Tombol tutup — X di mobile, ikon panel di desktop */}
        <button
          onClick={onClose}
          className="p-1.5 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          aria-label="Tutup sidebar"
        >
          <X className="h-4 w-4 lg:hidden" />
          <PanelLeftClose className="h-4 w-4 hidden lg:block" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={handleNavClick}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
