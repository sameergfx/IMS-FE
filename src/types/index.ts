export type UserType = "student" | "teacher" | "staff" | "member" | "admin"

export interface TokenResponse {
  access_token:  string
  refresh_token: string
  token_type:    string
  user_id:       number
  user_type:     UserType
  full_name:     string
}

export interface UserResponse {
  id:             number
  full_name:      string
  grade:         string | null
  roll_number:    string | null
  gender:         string | null
  date_of_birth:  string | null
  admission_number: string | null
  blood_group:    string | null
  address:        string | null
  city:           string | null
  state:          string | null
  country:        string | null
  email:          string
  phone:          string | null
  user_type:      UserType
  institution_id: number | null
  is_active:      boolean
  roles:          Role[]
  ref_label:      string | null     // "Admission No" / "Membership No" / "Employee ID"
  ref_number:     string | null     // the actual reference number
  employee_id:     string | null     // employee ID for staff/teacher
  qualification:  string | null     // qualification for staff/teacher
  specialization:  string | null     // specialization for staff/teacher
  designation:     string | null     // designation for staff/teacher
  department:      string | null     // department for staff/teacher
  date_of_joining: string | null     // date of joining for staff/teacher
  membership_expiry: string | null     // membership expiry date for member
  membership_number: string | null     // membership number for member
  membership_type:        string | null     // member type for member
  joining_date:       string | null     // joining date for member
  experience_years:   string | null     // experience years for staff/teacher
  guardian_name:      string | null     // guardian name for student
  guardian_relation: string | null // guardian relationship for student
  guardian_phone:     string | null     // guardian phone for student
  guardian_email:     string | null     // guardian email for student
  created_at:     string
  updated_at:     string
}

export interface Role {
  id:          number
  name:        string
  description: string | null
}

export interface ApiError {
  detail: string
}
