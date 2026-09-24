"use client"

import { useState, useEffect, FormEvent } from "react"
import { useAuth } from "@/lib/auth-context"
import styles from "./login.module.css"
import Image from "next/image"
import { organisationApi, brandingLogoUrl, LoginBranding } from "@/lib/api"
import logo from "./logo.png"

export default function LoginPage() {
  const { login } = useAuth()
  const [branding, setBranding] = useState<LoginBranding | null>(null)
  const [logoFailed, setLogoFailed] = useState(false)
  useEffect(() => { let active = true; organisationApi.branding().then(value => { if (active) setBranding(value) }).catch(() => {}); return () => { active = false } }, [])
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
            <Image src={logo} alt="Elevate Logo" width={150} height={150} className={styles.logoImage} />
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
          <div className={styles.mobileApp}><Image src={logo} alt="" width={28} height={28} /> <span>SchoolMS</span></div>
          <div className={styles.formHeader}>
            {branding?.logo_path && !logoFailed ? <img src={brandingLogoUrl(branding.logo_path)} alt={`${branding.display_name || "Client"} logo`} className={styles.clientLogo} onError={() => setLogoFailed(true)} /> : <Image src={logo} alt="SchoolMS logo" width={80} height={80} className={styles.formLogo} priority />}
            {branding?.display_name && <h1 className={styles.clientName}>{branding.display_name}</h1>}
            {branding?.tagline && <p className={styles.clientTagline}>{branding.tagline}</p>}
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
