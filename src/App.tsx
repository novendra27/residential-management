import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from '@/components/ui/sonner'

import { ProtectedRoute } from '@/components/ProtectedRoute'
import { AppLayout } from '@/components/layout/AppLayout'

import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import ResidentList from '@/pages/residents/ResidentList'
import ResidentDetail from '@/pages/residents/ResidentDetail'
import ResidentForm from '@/pages/residents/ResidentForm'
import HouseList from '@/pages/houses/HouseList'
import HouseDetail from '@/pages/houses/HouseDetail'
import HouseForm from '@/pages/houses/HouseForm'
import BillList from '@/pages/bills/BillList'
import BillDetail from '@/pages/bills/BillDetail'
import BillForm from '@/pages/bills/BillForm'
import ExpenseList from '@/pages/expenses/ExpenseList'
import ExpenseForm from '@/pages/expenses/ExpenseForm'
import ReportPage from '@/pages/report/ReportPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 30, // 30 seconds
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />

          {/* Protected */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />

              {/* Residents */}
              <Route path="/residents" element={<ResidentList />} />
              <Route path="/residents/new" element={<ResidentForm />} />
              <Route path="/residents/:id" element={<ResidentDetail />} />
              <Route path="/residents/:id/edit" element={<ResidentForm />} />

              {/* Houses */}
              <Route path="/houses" element={<HouseList />} />
              <Route path="/houses/new" element={<HouseForm />} />
              <Route path="/houses/:id" element={<HouseDetail />} />
              <Route path="/houses/:id/edit" element={<HouseForm />} />

              {/* Bills */}
              <Route path="/bills" element={<BillList />} />
              <Route path="/bills/new" element={<BillForm />} />
              <Route path="/bills/:id" element={<BillDetail />} />

              {/* Expenses */}
              <Route path="/expenses" element={<ExpenseList />} />
              <Route path="/expenses/new" element={<ExpenseForm />} />
              <Route path="/expenses/:id/edit" element={<ExpenseForm />} />

              {/* Report */}
              <Route path="/report" element={<ReportPage />} />
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster richColors position="top-right" />
    </QueryClientProvider>
  )
}
