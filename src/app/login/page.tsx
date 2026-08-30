"use client"

import { useState, FormEvent } from "react"
import { useAuth } from "@/lib/auth-context"
import styles from "./login.module.css"

export default function LoginPage() {
  const { login } = useAuth()
  const [email,    setEmail]    = useState("")
  const [password, setPassword] = useState("")
  const [error,    setError]    = useState("")
  const [loading,  setLoading]  = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      await login(email, password)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>

      {/* Left panel */}
      <div className={styles.brand}>
        <div className={styles.brandInner}>
          <div className={styles.logo}>
            <span className={styles.logoMark}>S</span>
            <span className={styles.logoText}>SchoolMS</span>
          </div>
          <h1 className={styles.brandHeading}>
            Managing your institution,<br />one module at a time.
          </h1>
          <ul className={styles.featureList}>
            {["Students & Staff", "Fee & Accounting", "Roles & Access Control", "Receipts & Reports"].map(f => (
              <li key={f} className={styles.featureItem}>
                <span className={styles.featureDot} />
                {f}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Right panel — login form */}
      <div className={styles.formPanel}>
        <div className={styles.formCard}>
          <div className={styles.formHeader}>
            <h2 className={styles.formTitle}>Sign in</h2>
            <p className={styles.formSub}>Enter your credentials to access the portal</p>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                className={styles.input}
                placeholder="you@school.edu"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                className={styles.input}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <div className={styles.errorBox}>
                <span className={styles.errorIcon}>!</span>
                {error}
              </div>
            )}

            <button
              type="submit"
              className={styles.submitBtn}
              disabled={loading}
            >
              {loading ? (
                <span className={styles.spinner} />
              ) : (
                "Sign in →"
              )}
            </button>
          </form>

          <p className={styles.footer}>
            School Management System &copy; {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  )
}
