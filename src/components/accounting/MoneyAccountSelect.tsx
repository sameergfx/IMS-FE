"use client"
import { useEffect, useState } from 'react'
import { bankingApi, MoneyAccount } from '@/lib/api'

export default function MoneyAccountSelect({ institutionId, method, value, onChange }: { institutionId: number; method: string; value: string; onChange: (value: string) => void }) {
  const [accounts, setAccounts] = useState<MoneyAccount[]>([])
  const [error, setError] = useState('')
  useEffect(() => {
    let active = true
    setAccounts([]); setError('')
    bankingApi.options(institutionId).then(rows => { if (active) setAccounts(rows) }).catch(err => { if (active) setError(err.message) })
    return () => { active = false }
  }, [institutionId])
  return <label style={{ display: 'flex', flexDirection: 'column', gap: '.4rem' }}>Cash / Bank Account
    <select value={value} onChange={e => onChange(e.target.value)} style={{ padding: '.65rem', border: '1px solid var(--border)', borderRadius: 8, background: 'white' }}>
      <option value="">Unassigned — excluded from account balances</option>
      {accounts.map(account => <option key={account.id} value={account.id} disabled={(method === 'cash') !== (account.kind === 'cash')}>{account.name}</option>)}
    </select>{error && <span role="alert">{error}</span>}
  </label>
}
