"use client"

import { useEffect, useState } from "react"
import { usersApi } from "@/lib/api"
import { UserResponse } from "@/types"

export interface PartyInfo {
  user:      UserResponse
  refLabel:  string
  refNumber: string | null
}

export function useParty(userId: number | null): { party: PartyInfo | null; loading: boolean } {
  const [party,   setParty]   = useState<PartyInfo | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!userId) return
    setLoading(true)

    usersApi.getUser(userId)
      .then(user => {
        setParty({
          user,
          refLabel:  user.ref_label  ?? "Ref No",
          refNumber: user.ref_number ?? null,
        })
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [userId])

  return { party, loading }
}
