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

export interface InvoiceItem {
  id:          number
  account_id:  number
  description: string
  amount:      number
  discount:    number
  net_amount:  number
}

export interface Invoice {
  id:             number
  invoice_number: string
  user_id:        number
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
  id:                  number
  receipt_number:      string
  invoice_id:          number
  user_id:             number
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
