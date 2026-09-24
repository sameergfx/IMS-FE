"use client"
import { useEffect, useState } from 'react'
import { bankingApi, MoneyAccount } from '@/lib/api'

export default function MoneyAccountSelect({ institutionId, method, value, onChange }: { institutionId: number; method: string; value: string; onChange: (value: string) => void }) {
  const [accounts, setAccounts] = useState<MoneyAccount[]>([])
  const [error, setError] = useState('')
  const [loadedInstitution, setLoadedInstitution] = useState<number | null>(null)
  useEffect(() => {
    let active = true
    setAccounts([]); setError(''); setLoadedInstitution(null)
    bankingApi.options(institutionId).then(rows => { if (active) { setAccounts(rows); setLoadedInstitution(institutionId) } }).catch(err => { if (active) setError(err.message) })
    return () => { active = false }
  }, [institutionId])
  useEffect(() => {
    // Wait for this institution's options before validating an existing selection.
    if (loadedInstitution !== institutionId) return
    const selected = accounts.find(account => String(account.id) === value)
    if (!selected || (method === 'cash') !== (selected.kind === 'cash')) {
      const next = accounts.find(account => (method === 'cash') === (account.kind === 'cash'))
      const nextValue = next ? String(next.id) : ''
      if (nextValue !== value) onChange(nextValue)
    }
  }, [accounts, institutionId, loadedInstitution, method, value, onChange])
  const compatible = accounts.filter(account => (method === 'cash') === (account.kind === 'cash'))
  const ready = loadedInstitution === institutionId
  return <label style={{ display: 'flex', flexDirection: 'column', gap: '.4rem', gridColumn: '1 / -1' }}>{method === 'cash' ? 'Cash in Hand Account' : 'Bank Account'}
    <select required={!ready || accounts.length > 0} value={value} onChange={e => onChange(e.target.value)} style={{ padding: '.65rem', border: '1px solid var(--border)', borderRadius: 8, background: 'white' }}>
      {(!ready || !compatible.length) && <option value="" disabled={!ready || accounts.length > 0}>{!ready ? 'Loading accounts…' : accounts.length ? `No ${method === 'cash' ? 'cash' : 'bank'} account available` : 'No accounts configured'}</option>}
      {accounts.map(account => <option key={account.id} value={account.id} disabled={(method === 'cash') !== (account.kind === 'cash')}>{account.name}{(method === 'cash') !== (account.kind === 'cash') ? (account.kind === 'cash' ? ' — cash payments only' : ' — non-cash payments only') : ''}</option>)}
    </select><small style={{ color: 'var(--slate)', fontSize: '.75rem' }}>{compatible.length ? `A ${method === 'cash' ? 'cash' : 'bank'} account is selected automatically. Confirm it is the account receiving or paying the money.` : ready ? `Create or link a ${method === 'cash' ? 'cash' : 'bank'} account in Bank & Cash to track this payment in account balances.` : 'Loading available accounts.'}</small>{error && <span role="alert">{error}</span>}
  </label>
}
