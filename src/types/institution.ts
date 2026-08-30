export interface Institution {
  id:             number
  name:           string
  place:          string | null
  address:        string | null
  phone:          string | null
  email:          string | null
  logo:           string | null
  is_active:      boolean
  bank_name:      string | null
  bank_branch:    string | null
  account_name:   string | null
  account_number: string | null
  ifsc_code:      string | null
  created_at:     string
  updated_at:     string
}
