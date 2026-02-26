import { useLocation, useNavigate } from 'react-router-dom'
import { LogOut, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/auth.store'
import { authService } from '@/services/auth.service'

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/residents': 'Data Penghuni',
  '/residents/new': 'Tambah Penghuni',
  '/houses': 'Data Rumah',
  '/houses/new': 'Tambah Rumah',
  '/bills': 'Tagihan Iuran',
  '/bills/new': 'Buat Tagihan',
  '/expenses': 'Pengeluaran',
  '/expenses/new': 'Tambah Pengeluaran',
  '/report': 'Laporan Keuangan',
}

function getPageTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname]
  if (pathname.includes('/edit')) return 'Edit Data'
  if (pathname.includes('/residents/')) return 'Detail Penghuni'
  if (pathname.includes('/houses/')) return 'Detail Rumah'
  if (pathname.includes('/bills/')) return 'Detail Tagihan'
  return 'Manajemen RT'
}

export function Header() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, clearAuth } = useAuthStore()

  const handleLogout = async () => {
    await authService.logout()
    clearAuth()
    navigate('/login', { replace: true })
  }

  return (
    <header className="fixed top-0 left-60 right-0 h-16 bg-white border-b border-border flex items-center justify-between px-6 z-20">
      <h1 className="text-base font-semibold text-foreground">
        {getPageTitle(location.pathname)}
      </h1>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <User className="h-4 w-4" />
          <span>{user?.user_name ?? user?.email ?? 'Admin'}</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="gap-2 text-muted-foreground hover:text-destructive"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </header>
  )
}
