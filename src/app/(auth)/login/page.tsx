'use client'

import { useState, useTransition } from 'react'

import Link from 'next/link'

import type { Metadata } from 'next'

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const form = e.currentTarget
    const email = (form.elements.namedItem('email') as HTMLInputElement).value
    const password = (form.elements.namedItem('password') as HTMLInputElement).value

    startTransition(async () => {
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        })
        if (!res.ok) {
          const data = await res.json()
          setError(data.message ?? 'Invalid credentials. Please try again.')
          return
        }
        window.location.href = '/'
      } catch {
        setError('Something went wrong. Please try again.')
      }
    })
  }

  return (
    <>
      <div className="login-header">
        <h1>Welcome back</h1>
        <p>Sign in to the Lomash Wood admin panel</p>
      </div>

      {error && (
        <div className="login-error" role="alert">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="8" cy="8" r="7.25" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M8 4.5V8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <circle cx="8" cy="11" r="0.75" fill="currentColor"/>
          </svg>
          {error}
        </div>
      )}

      <form className="login-form" onSubmit={handleSubmit} noValidate>
        <div className="field">
          <label htmlFor="email">Email address</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@lomashwood.co.uk"
            disabled={isPending}
          />
        </div>

        <div className="field">
          <div className="field-label-row">
            <label htmlFor="password">Password</label>
            <Link href="/forgot-password" tabIndex={-1}>
              Forgot password?
            </Link>
          </div>
          <div className="password-wrapper">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              placeholder="••••••••••••"
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
        </div>

        <button type="submit" className="btn-primary" disabled={isPending}>
          {isPending ? (
            <span className="btn-spinner" aria-hidden="true" />
          ) : null}
          {isPending ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');

        .login-header {
          margin-bottom: 36px;
        }

        .login-header h1 {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 2rem;
          font-weight: 700;
          color: #1A1A18;
          letter-spacing: -0.01em;
          margin-bottom: 8px;
        }

        .login-header p {
          font-size: 0.9375rem;
          color: #6B6B68;
          font-weight: 400;
        }

        .login-error {
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

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .field-label-row {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
        }

        .field-label-row a {
          font-size: 0.8125rem;
          color: #8B6914;
          text-decoration: none;
          font-weight: 500;
          transition: color 0.15s;
        }

        .field-label-row a:hover {
          color: #C9A84C;
        }

        label {
          font-size: 0.875rem;
          font-weight: 500;
          color: #1A1A18;
        }

        input[type="email"],
        input[type="password"],
        input[type="text"] {
          width: 100%;
          height: 48px;
          padding: 0 14px;
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

        .password-wrapper input {
          padding-right: 48px;
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

        .btn-primary {
          width: 100%;
          height: 50px;
          margin-top: 4px;
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
          transition: background 0.15s, transform 0.1s;
          position: relative;
          overflow: hidden;
        }

        .btn-primary::after {
          content: '';
          position: absolute;
          inset: 0;
          background: rgba(255,255,255,0);
          transition: background 0.15s;
        }

        .btn-primary:hover:not(:disabled)::after {
          background: rgba(255,255,255,0.07);
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
      `}</style>
    </>
  )
}