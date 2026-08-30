"use client"

import { useParty } from "@/lib/useParty"
import styles from "./PartyBadge.module.css"

interface Props {
  userId:   number
  compact?: boolean
}

export default function PartyBadge({ userId, compact = false }: Props) {
  const { party, loading } = useParty(userId)

  if (loading) return <span className={styles.loading}>Loading...</span>
  if (!party)  return <span className={styles.fallback}>User #{userId}</span>

  const { user, refLabel, refNumber } = party

  if (compact) {
    return (
      <div className={styles.compact}>
        {/* Show "ADM001 - John Smith" or just "John Smith" if no ref */}
        {refNumber ? (
          <>
            <span className={styles.refFirst}>{refNumber}</span>
            <span className={styles.nameSecond}>{user.full_name}</span>
          </>
        ) : (
          <span className={styles.nameOnly}>{user.full_name}</span>
        )}
      </div>
    )
  }

  return (
    <div className={styles.card}>
      <div className={styles.avatar}>
        {user.full_name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
      </div>
      <div className={styles.info}>
        {refNumber && (
          <div className={styles.refChip}>
            <span className={styles.refLabel}>{refLabel}</span>
            <span className={styles.refValue}>{refNumber}</span>
          </div>
        )}
        <p className={styles.fullName}>{user.full_name}</p>
        <p className={styles.email}>{user.email}</p>
        <span className={styles.typeBadge}>{user.user_type}</span>
      </div>
    </div>
  )
}
