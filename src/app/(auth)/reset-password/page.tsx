'use client'

import { Suspense, useState, useTransition } from 'react'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

type Status = 'idle' | 'success' | 'error' | 'invalid-token'

function PasswordStrengthBar({ password }: { password: string }) {
  const score = getStrengthScore(password)
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong']
  const colors = ['', '#C0392B', '#D4820A', '#2980B9', '#27AE60']

  if (!password) return null

  return (
    <div className="strength-bar">
      <div className="strength-bar__track">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="strength-bar__segment"
            style={{ background: i <= score ? colors[score] : '#E8E6E1' }}
          />
        ))}
      </div>
      <span className="strength-bar__label" style={{ color: colors[score] }}>
        {labels[score]}
      </span>
    </div>
  )
}

function getStrengthScore(pw: string): number {
  if (!pw) return 0
  let score = 0
  if (pw.length >= 8) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  return score
}

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [status, setStatus] = useState<Status>(token ? 'idle' : 'invalid-token')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErrorMsg(null)
    const form = e.currentTarget
    const newPassword = (form.elements.namedItem('password') as HTMLInputElement).value
    const confirmPassword = (form.elements.namedItem('confirm') as HTMLInputElement).value

    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.')
      return
    }

    if (getStrengthScore(newPassword) < 2) {
      setErrorMsg('Please choose a stronger password.')
      return
    }

    startTransition(async () => {
      try {
        const res = await fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, password: newPassword }),
        })
        if (!res.ok) {
          const data = await res.json()
          if (res.status === 400 && data.code === 'TOKEN_EXPIRED') {
            setStatus('invalid-token')
            return
          }
          setErrorMsg(data.message ?? 'Something went wrong. Please try again.')
          return
        }
        setStatus('success')
      } catch {
        setErrorMsg('Something went wrong. Please try again.')
      }
    })
  }

  if (status === 'invalid-token') {
    return (
      <>
        <div className="rp-state">
          <div className="rp-state__icon rp-state__icon--warn" aria-hidden="true">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <h1>Link expired</h1>
          <p>
            This password reset link is invalid or has expired. Reset links
            are valid for 30 minutes.
          </p>
          <Link href="/forgot-password" className="btn-primary">
            Request a new link
          </Link>
          <Link href="/login" className="rp-back-link">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            Back to sign in
          </Link>
        </div>
        <style>{`${sharedStyles}`}</style>
      </>
    )
  }

  if (status === 'success') {
    return (
      <>
        <div className="rp-state">
          <div className="rp-state__icon rp-state__icon--ok" aria-hidden="true">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <h1>Password updated</h1>
          <p>
            Your password has been reset successfully. You can now sign in
            with your new password.
          </p>
          <Link href="/login" className="btn-primary">
            Sign in
          </Link>
        </div>
        <style>{`${sharedStyles}`}</style>
      </>
    )
  }

  return (
    <>
      <div className="rp-header">
        <h1>Choose a new password</h1>
        <p>Must be at least 8 characters with a mix of letters, numbers, or symbols.</p>
      </div>

      {errorMsg && (
        <div className="rp-error" role="alert">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="8" cy="8" r="7.25" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M8 4.5V8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <circle cx="8" cy="11" r="0.75" fill="currentColor"/>
          </svg>
          {errorMsg}
        </div>
      )}

      <form className="rp-form" onSubmit={handleSubmit} noValidate>
        <div className="field">
          <label htmlFor="password">New password</label>
          <div className="password-wrapper">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              minLength={8}
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isPending}
            />
            <button
              type="button"
              className="toggle-password"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              onClick={() => setShowPassword((v) => !v)}
              tabIndex={-1}
            >
              {showPassword ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              )}
            </button>
          </div>
          <PasswordStrengthBar password={password} />
        </div>

        <div className="field">
          <label htmlFor="confirm">Confirm new password</label>
          <div className="password-wrapper">
            <input
              id="confirm"
              name="confirm"
              type={showConfirm ? 'text' : 'password'}
              autoComplete="new-password"
              required
              placeholder="••••••••••••"
              disabled={isPending}
            />
            <button
              type="button"
              className="toggle-password"
              aria-label={showConfirm ? 'Hide password' : 'Show password'}
              onClick={() => setShowConfirm((v) => !v)}
              tabIndex={-1}
            >
              {showConfirm ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              )}
            </button>
          </div>
        </div>

        <button type="submit" className="btn-primary" disabled={isPending}>
          {isPending && <span className="btn-spinner" aria-hidden="true" />}
          {isPending ? 'Updating password…' : 'Set new password'}
        </button>
      </form>

      <Link href="/login" className="rp-back-link">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        Back to sign in
      </Link>

      <style>{`${sharedStyles}`}</style>
    </>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="rp-loading">Loading…</div>}>
      <ResetPasswordForm />
      <style>{`.rp-loading { color: #6B6B68; font-size: 0.9375rem; }`}</style>
    </Suspense>
  )
}

const sharedStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');

  .rp-header {
    margin-bottom: 36px;
  }

  .rp-header h1 {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 2rem;
    font-weight: 700;
    color: #1A1A18;
    letter-spacing: -0.01em;
    margin-bottom: 10px;
  }

  .rp-header p {
    font-size: 0.9375rem;
    color: #6B6B68;
    line-height: 1.6;
  }

  .rp-error {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 16px;
    background: #FDF2F2;
    border: 1px solid #F5C6C6;
    border-radius: 8px;
    color: #C0392B;
    font-size: 0.875rem;
    margin-bottom: 24px;
  }

  .rp-form {
    display: flex;
    flex-direction: column;
    gap: 20px;
    margin-bottom: 24px;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  label {
    font-size: 0.875rem;
    font-weight: 500;
    color: #1A1A18;
  }

  input[type="password"],
  input[type="text"] {
    width: 100%;
    height: 48px;
    padding: 0 48px 0 14px;
    border: 1.5px solid #E8E6E1;
    border-radius: 10px;
    background: #FFFFFF;
    font-family: 'DM Sans', system-ui, sans-serif;
    font-size: 0.9375rem;
    color: #1A1A18;
    outline: none;
    transition: border-color 0.15s, box-shadow 0.15s;
    -webkit-appearance: none;
  }

  input:focus {
    border-color: #8B6914;
    box-shadow: 0 0 0 3px rgba(139, 105, 20, 0.12);
  }

  input:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  input::placeholder {
    color: #B8B5AE;
  }

  .password-wrapper {
    position: relative;
  }

  .toggle-password {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    cursor: pointer;
    color: #6B6B68;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 4px;
    transition: color 0.15s;
  }

  .toggle-password:hover {
    color: #1A1A18;
  }

  .strength-bar {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 8px;
  }

  .strength-bar__track {
    display: flex;
    gap: 4px;
    flex: 1;
  }

  .strength-bar__segment {
    height: 4px;
    flex: 1;
    border-radius: 2px;
    transition: background 0.25s;
  }

  .strength-bar__label {
    font-size: 0.75rem;
    font-weight: 600;
    min-width: 40px;
    text-align: right;
    transition: color 0.25s;
  }

  .btn-primary {
    width: 100%;
    height: 50px;
    background: #1A1A18;
    color: #F5F0E8;
    border: none;
    border-radius: 10px;
    font-family: 'DM Sans', system-ui, sans-serif;
    font-size: 0.9375rem;
    font-weight: 600;
    letter-spacing: 0.01em;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    text-decoration: none;
    transition: background 0.15s, transform 0.1s;
  }

  .btn-primary:hover:not(:disabled) {
    background: #2E2E2A;
  }

  .btn-primary:active:not(:disabled) {
    transform: scale(0.99);
  }

  .btn-primary:disabled {
    opacity: 0.65;
    cursor: not-allowed;
  }

  .btn-spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(245, 240, 232, 0.3);
    border-top-color: #F5F0E8;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .rp-back-link {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 0.875rem;
    font-weight: 500;
    color: #6B6B68;
    text-decoration: none;
    transition: color 0.15s;
    margin-top: 4px;
  }

  .rp-back-link:hover {
    color: #1A1A18;
  }

  .rp-state {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .rp-state__icon {
    width: 60px;
    height: 60px;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 4px;
  }

  .rp-state__icon--ok {
    background: #EEF8F1;
    border: 1.5px solid #C3E8CC;
    color: #27AE60;
  }

  .rp-state__icon--warn {
    background: #FFF8EE;
    border: 1.5px solid #F5DEB5;
    color: #D4820A;
  }

  .rp-state h1 {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 2rem;
    font-weight: 700;
    color: #1A1A18;
    letter-spacing: -0.01em;
  }

  .rp-state p {
    font-size: 0.9375rem;
    color: #6B6B68;
    line-height: 1.6;
  }
`