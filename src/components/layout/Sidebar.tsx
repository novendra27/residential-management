import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Users, Home, FileText, Wallet, BarChart2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/residents', icon: Users, label: 'Penghuni' },
  { to: '/houses', icon: Home, label: 'Rumah' },
  { to: '/bills', icon: FileText, label: 'Tagihan' },
  { to: '/expenses', icon: Wallet, label: 'Pengeluaran' },
  { to: '/report', icon: BarChart2, label: 'Laporan' },
]

export function Sidebar() {
  return (
    <aside className="fixed top-0 left-0 h-full w-60 bg-white border-r border-border flex flex-col z-30">
      {/* Logo / App Name */}
      <div className="h-16 flex items-center px-6 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center">
            <Home className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-base text-foreground">Manajemen RT</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
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
