'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'

type Status = 'idle' | 'success' | 'error'

export default function ForgotPasswordPage() {
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [submittedEmail, setSubmittedEmail] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErrorMsg(null)
    const form = e.currentTarget
    const email = (form.elements.namedItem('email') as HTMLInputElement).value

    startTransition(async () => {
      try {
        const res = await fetch('/api/auth/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        })
        if (!res.ok) {
          const data = await res.json()
          setErrorMsg(data.message ?? 'Something went wrong. Please try again.')
          setStatus('error')
          return
        }
        setSubmittedEmail(email)
        setStatus('success')
      } catch {
        setErrorMsg('Something went wrong. Please try again.')
        setStatus('error')
      }
    })
  }

  if (status === 'success') {
    return (
      <>
        <div className="fp-success">
          <div className="fp-success__icon" aria-hidden="true">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
          </div>
          <h1>Check your inbox</h1>
          <p>
            We sent a password reset link to{' '}
            <strong>{submittedEmail}</strong>.
            It may take a minute to arrive.
          </p>
          <p className="fp-success__note">
            Did not receive it? Check your spam folder or{' '}
            <button
              type="button"
              className="fp-link-btn"
              onClick={() => setStatus('idle')}
            >
              try a different email address
            </button>
            .
          </p>
          <Link href="/login" className="fp-back-link">
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

  return (
    <>
      <div className="fp-header">
        <h1>Reset your password</h1>
        <p>
          Enter the email address linked to your account and we will send you
          a link to reset your password.
        </p>
      </div>

      {errorMsg && (
        <div className="fp-error" role="alert">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="8" cy="8" r="7.25" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M8 4.5V8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <circle cx="8" cy="11" r="0.75" fill="currentColor"/>
          </svg>
          {errorMsg}
        </div>
      )}

      <form className="fp-form" onSubmit={handleSubmit} noValidate>
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

        <button type="submit" className="btn-primary" disabled={isPending}>
          {isPending && <span className="btn-spinner" aria-hidden="true" />}
          {isPending ? 'Sending link…' : 'Send reset link'}
        </button>
      </form>

      <Link href="/login" className="fp-back-link">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        Back to sign in
      </Link>

      <style>{`${sharedStyles}`}</style>
    </>
  )
}

const sharedStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');

  .fp-header {
    margin-bottom: 36px;
  }

  .fp-header h1 {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 2rem;
    font-weight: 700;
    color: #1A1A18;
    letter-spacing: -0.01em;
    margin-bottom: 10px;
  }

  .fp-header p {
    font-size: 0.9375rem;
    color: #6B6B68;
    line-height: 1.6;
  }

  .fp-error {
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

  .fp-form {
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

  input[type="email"] {
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
    transition: background 0.15s, transform 0.1s;
    position: relative;
    overflow: hidden;
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

  .fp-back-link {
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

  .fp-back-link:hover {
    color: #1A1A18;
  }

  .fp-success {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .fp-success__icon {
    width: 60px;
    height: 60px;
    border-radius: 14px;
    background: #F5F0E8;
    border: 1.5px solid #E8E0D0;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #8B6914;
    margin-bottom: 4px;
  }

  .fp-success h1 {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 2rem;
    font-weight: 700;
    color: #1A1A18;
    letter-spacing: -0.01em;
  }

  .fp-success p {
    font-size: 0.9375rem;
    color: #6B6B68;
    line-height: 1.6;
  }

  .fp-success strong {
    color: #1A1A18;
    font-weight: 600;
  }

  .fp-success__note {
    font-size: 0.875rem;
  }

  .fp-link-btn {
    background: none;
    border: none;
    padding: 0;
    font-family: inherit;
    font-size: inherit;
    color: #8B6914;
    font-weight: 500;
    cursor: pointer;
    text-decoration: underline;
    text-underline-offset: 2px;
    transition: color 0.15s;
  }

  .fp-link-btn:hover {
    color: #C9A84C;
  }
`