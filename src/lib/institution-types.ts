import { UserType } from "@/types"
import { InstitutionType } from "@/types/institution"

export function institutionUserTypes(type?: InstitutionType): UserType[] {
  return type === "masjid" ? ["member", "staff"] : ["student", "teacher", "staff"]
}
