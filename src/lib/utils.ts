import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

// shadcn/ui utility untuk conditional classnames
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format angka ke Rupiah
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount)
}

// Format tanggal ke lokal Indonesia penuh: "25 Februari 2026"
export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

// Format tanggal singkat: "25 Feb 2026"
export function formatDateShort(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

// Format periode tagihan: "Jan 2025" atau "Jan – Mar 2025"
export function formatPeriod(start: string, end: string): string {
  const s = new Date(start)
  const e = new Date(end)
  const sLabel = s.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })
  const eLabel = e.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })
  return sLabel === eLabel ? sLabel : `${sLabel} – ${eLabel}`
}

// Nama bulan (index 1–12)
export const MONTH_NAMES = [
  '', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]

// Nama bulan singkat (index 1–12)
export const MONTH_NAMES_SHORT = [
  '', 'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des',
]
