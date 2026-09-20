export interface InstitutionDashboardData {
  institution_id: number
  as_of: string
  month_start: string
  users_by_type: Record<string, number>
  total_users: number
  active_users: number
  invoice_count: number
  outstanding_count: number
  outstanding_amount: string | number
  overdue_count: number
  overdue_amount: string | number
  month_receipts: string | number
  month_expenses: string | number
  month_net: string | number
  receipt_count: number
  expense_count: number
  recent_transactions: {
    id: number
    kind: "receipt" | "expense"
    number: string
    date: string
    party: string | null
    amount: string | number
  }[]
}
