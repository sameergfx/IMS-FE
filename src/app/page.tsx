"use client"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { tokenStorage } from "@/lib/api"

export default function Home() {
  const router = useRouter()
  useEffect(() => {
    router.replace(tokenStorage.getAccess() ? "/dashboard" : "/login")
  }, [router])
  return null
}
