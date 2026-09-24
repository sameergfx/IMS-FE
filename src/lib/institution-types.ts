import { UserType } from "@/types"
import { InstitutionType } from "@/types/institution"

export function institutionUserTypes(type?: InstitutionType): UserType[] {
  return type && ["masjid", "zakat_cell", "social_welfare"].includes(type) ? ["member", "staff"] : ["student", "teacher", "staff"]
}

export const institutionTypeLabel = (type: string) => ({educational: "Educational", masjid: "Masjid", zakat_cell: "Zakat Cell", social_welfare: "Social Welfare"} as Record<string,string>)[type] || type
