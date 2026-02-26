// =====================
// Pagination
// =====================
export interface PaginationMeta {
  current_page: number
  per_page: number
  total: number
  last_page: number
}

export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

export interface PaginatedResponse<T> {
  success: boolean
  message: string
  data: T[]
  meta: PaginationMeta
}

// =====================
// Auth
// =====================
export interface User {
  id: string
  user_name: string
  email: string
}

export interface LoginResponse {
  token: string
  expired_at: string
  user: User
}

// =====================
// Resident
// =====================
export interface Resident {
  id: string
  full_name: string
  ktp_photo: string        // URL lengkap, e.g. http://127.0.0.1:8000/storage/ktp/abc.jpg
  is_contract: boolean
  phone_number: string
  is_married: boolean
  created_at: string
}

// =====================
// House
// =====================
export interface CurrentResident {
  history_id: string
  move_in_date: string
  resident: Pick<Resident, 'id' | 'full_name' | 'phone_number' | 'is_contract' | 'is_married'>
}

export interface House {
  id: string
  house_number: string
  address: string | null
  is_occupied: boolean
  created_at: string
  current_resident?: CurrentResident | null  // hanya ada di GET /houses/{id}
}

export interface ResidentHistory {
  id: string
  resident: Pick<Resident, 'id' | 'full_name' | 'phone_number' | 'is_contract' | 'is_married'>
  move_in_date: string
  move_out_date: string | null
  is_active: boolean
  created_at: string
}

export interface PaymentHistory {
  bill_id: string
  fee_type: FeeType
  resident: Pick<Resident, 'id' | 'full_name'>
  period_start: string
  period_end: string
  total_amount: number
  is_paid: boolean
  payment_date: string | null
  created_at: string
}

// =====================
// FeeType
// =====================
export interface FeeType {
  id: string
  fee_name: string
  default_amount: number
}

// =====================
// Bill
// =====================
export interface Bill {
  id: string
  house: Pick<House, 'id' | 'house_number' | 'address'>
  resident: Pick<Resident, 'id' | 'full_name'> | null
  fee_type: FeeType
  period_start: string
  period_end: string
  total_amount: number
  is_paid: boolean
  payment_date: string | null
  created_at: string
}

// =====================
// Payment
// =====================
export interface Payment {
  id: string
  payment_date: string
  amount_paid: number
  notes: string | null
  created_at: string
  bill: {
    id: string
    period_start: string
    period_end: string
    total_amount: number
    is_paid: boolean
    house: Pick<House, 'id' | 'house_number'>
    resident: Pick<Resident, 'id' | 'full_name'>
    fee_type: Pick<FeeType, 'id' | 'fee_name'>
  }
}

// =====================
// Expense
// =====================
export interface Expense {
  id: string
  expense_name: string
  expense_date: string
  amount: number
  description: string | null
  is_monthly: boolean
  created_at: string
}

// =====================
// Report
// =====================
export interface MonthlySummary {
  month: number
  year: number
  total_income: number
  total_expense: number
  ending_balance: number
}

export interface IncomeEntry {
  payment_id: string
  payment_date: string
  amount_paid: number
  notes: string | null
  bill: {
    id: string
    period_start: string
    period_end: string
    total_amount: number
    fee_type: FeeType
  }
  house: Pick<House, 'id' | 'house_number' | 'address'>
  resident: Pick<Resident, 'id' | 'full_name'>
}

export interface MonthlyBalance {
  month: number
  year: number
  total_income: number
  total_expense: number
  ending_balance: number
  incomes: IncomeEntry[]
  expenses: Expense[]
}
