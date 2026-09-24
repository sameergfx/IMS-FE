export type PaymentMethod  = "cash" | "card" | "upi" | "bank_transfer" | "cheque" | "online"
export type ReceiptStatus  = "active" | "cancelled"
export type InvoiceStatus  = "unpaid" | "partially_paid" | "paid" | "cancelled"

export interface Account {
  id:           number
  name:         string
  code:         string
  account_type: string
  description:  string | null
  is_active:    boolean
}

// ── Invoice ──────────────────────────────────────────────────────────────────

export interface InvoiceCategory {
  id:          number
  name:        string
  code:        string
  is_active:   boolean
}

export interface InvoiceItem {
  category_id: number
  id:          number
  account_id:  number
  category_name: string
  description: string
  amount:      number
  discount:    number
  net_amount:  number
}

export interface Invoice {
  donor_name?: string | null
  donor_phone?: string | null
  donor_address?: string | null
  id:             number
  invoice_number: string
  user_id:        number | null
  full_name:      string
  admission_number: string
  institution_id: number
  invoice_date:   string
  due_date:       string | null
  subtotal:       number
  discount:       number
  total_amount:   number
  paid_amount:    number
  balance_due:    number
  status:         InvoiceStatus
  description:    string | null
  academic_year:  string | null
  issued_by:      number | null
  items:          InvoiceItem[]
  created_at:     string
  updated_at:     string
}

export interface InvoiceItemCreate {
  account_id:  number
  category_name: string
  category_id: number
  description: string
  amount:      number
  discount:    number
}

export interface InvoiceCreate {
  user_id:       number
  invoice_date:  string
  due_date:      string | null
  discount:      number
  description:   string | null
  academic_year: string | null
  issued_by:     number | null
  items:         InvoiceItemCreate[]
}

// ── Receipt (payment against invoice) ─────────────────────────────────────────

export interface Receipt {
  money_account_id?: number | null
  donor_name?: string | null
  donor_phone?: string | null
  donor_address?: string | null
  allocations?: { invoice_item_id: number; amount: number | string }[]
  id:                  number
  receipt_number:      string
  invoice_id:          number
  invoice_number:      string | null
  user_id:             number | null
  institution_id:      number
  receipt_date:        string
  payment_method:      PaymentMethod
  amount_paid:         number
  reference_number:    string | null
  bank_name:           string | null
  notes:               string | null
  status:              ReceiptStatus
  cancellation_reason: string | null
  issued_by:           number | null
  created_at:          string
  updated_at:          string
}

export interface ReceiptCreate {
  money_account_id?: number | null
  institution_id:   number
  invoice_id:       number
  receipt_date:     string
  payment_method:   PaymentMethod
  amount_paid:      number
  reference_number: string | null
  bank_name:        string | null
  notes:            string | null
  issued_by:        number | null
}

// ── Expense ──────────────────────────────────────────────────────────────────

export interface ExpenseCategory {
  money_account_id?: number | null
  id:          number
  name:        string
  code:        string
  is_active:   boolean
}

export type ExpenseStatus = "active" | "cancelled"

export interface Expense extends ExpenseRecord {}

export interface ExpenseItem {
  money_account_id?: number | null
  id: number
  account_id: number | null
  category_id: number | null
  category: ExpenseCategory | null
  description: string
  amount: number | string
  discount: number | string
  net_amount: number | string
}

export interface ExpenseItemCreate {
  money_account_id?: number | null
  category_id: number
  description: string
  amount: number
  discount: number
}

export interface ExpenseCreate {
  money_account_id?: number | null
  institution_id:   number
  expense_date:     string
  paid_to:          string
  payment_method:   PaymentMethod
  items:            ExpenseItemCreate[]
  reference_number: string | null
  bank_name:        string | null
  description:      string | null
  notes:            string | null
}


// Persisted expense records returned by the institution list endpoint.
export interface ExpenseRecord {
  assistance_application_id?: number | null
  money_account_id?: number | null
  id: number
  expense_number: string
  institution_id: number
  category_id: number | null
  category: ExpenseCategory | null
  paid_to: string | null
  payment_method: PaymentMethod | null
  reference_number: string | null
  bank_name: string | null
  notes: string | null
  status: ExpenseStatus
  cancellation_reason: string | null
  issued_by: number | null
  user_id: number
  expense_date: string
  total_amount: number | string
  description: string | null
  items: ExpenseItem[]
  created_at: string
  updated_at: string
}


export interface StatementEntry {
  date: string
  kind: "receipt" | "expense"
  id: number
  number: string
  party: string | null
  description: string | null
  invoice_id: number | null
  invoice_number: string | null
  category: string | null
  money_in: string | number
  money_out: string | number
  balance: string | number
}

export interface AccountStatement {
  institution_id: number
  institution_name: string
  start_date: string
  end_date: string
  opening_balance: string | number
  total_receipts: string | number
  total_expenses: string | number
  closing_balance: string | number
  entries: StatementEntry[]
}

export interface InvoiceUpdate {
  due_date?: string | null
  description?: string | null
  academic_year?: string | null
  invoice_date?: string
  discount?: number
  items?: { category_id: number; category_name: string; description: string; amount: number; discount: number }[]
}

export interface DailyStatement {
  institution_id: number
  institution_name: string
  date: string
  opening_balance: string | number
  closing_balance: string | number
  total_received: string | number
  total_expenses: string | number
  net_movement: string | number
  categories: DailyStatementGroup[]
  payment_methods: DailyStatementGroup[]
  entries: { id: number; kind: 'receipt' | 'expense'; number: string; category: string; description: string; payment_method: string; received: string | number; spent: string | number }[]
}
export interface DailyStatementGroup { name: string; received: string | number; spent: string | number }
