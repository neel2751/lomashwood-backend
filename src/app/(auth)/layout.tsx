import type { Metadata } from 'next'
import Image from 'next/image'

export const metadata: Metadata = {
  title: {
    template: '%s | Lomash Wood Admin',
    default: 'Lomash Wood Admin',
  },
  robots: { index: false, follow: false },
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="auth-shell">
      <aside className="auth-panel">
        <div className="auth-panel__brand">
          <Image
            src="/logo-dark.svg"
            alt="Lomash Wood"
            width={160}
            height={38}
            priority
          />
        </div>
        <div className="auth-panel__body">
          <blockquote className="auth-panel__quote">
            <p>
              &ldquo;Crafted with purpose.<br />Built to last a lifetime.&rdquo;
            </p>
            <cite>Lomash Wood Design Studio</cite>
          </blockquote>
        </div>
        <div className="auth-panel__grain" aria-hidden="true" />
        <div className="auth-panel__overlay" aria-hidden="true" />
      </aside>

      <main className="auth-content">
        <div className="auth-content__inner">
          {children}
        </div>
      </main>

      <style>{`
        *,
        *::before,
        *::after {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        :root {
          --color-bg: #FAFAF8;
          --color-surface: #FFFFFF;
          --color-panel-bg: #111110;
          --color-text: #1A1A18;
          --color-muted: #6B6B68;
          --color-border: #E8E6E1;
          --color-accent: #8B6914;
          --color-accent-light: #C9A84C;
          --color-error: #C0392B;
          --font-display: 'Playfair Display', Georgia, serif;
          --font-body: 'DM Sans', system-ui, sans-serif;
        }

        html, body {
          height: 100%;
          background: var(--color-bg);
          color: var(--color-text);
          font-family: var(--font-body);
          -webkit-font-smoothing: antialiased;
        }

        .auth-shell {
          display: grid;
          grid-template-columns: 480px 1fr;
          min-height: 100dvh;
        }

        @media (max-width: 900px) {
          .auth-shell {
            grid-template-columns: 1fr;
          }
        }

        .auth-panel {
          position: relative;
          background: var(--color-panel-bg);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 48px;
          overflow: hidden;
        }

        @media (max-width: 900px) {
          .auth-panel {
            display: none;
          }
        }

        .auth-panel__brand {
          position: relative;
          z-index: 2;
        }

        .auth-panel__body {
          position: relative;
          z-index: 2;
          flex: 1;
          display: flex;
          align-items: flex-end;
          padding-bottom: 24px;
        }

        .auth-panel__quote {
          list-style: none;
        }

        .auth-panel__quote p {
          font-family: var(--font-display);
          font-size: 2rem;
          font-weight: 400;
          line-height: 1.35;
          color: #F5F0E8;
          margin-bottom: 20px;
          font-style: italic;
        }

        .auth-panel__quote cite {
          font-style: normal;
          font-size: 0.8125rem;
          font-weight: 500;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--color-accent-light);
        }

        .auth-panel__overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            160deg,
            rgba(139, 105, 20, 0.18) 0%,
            transparent 55%,
            rgba(26, 26, 16, 0.6) 100%
          );
          z-index: 1;
        }

        .auth-panel__grain {
          position: absolute;
          inset: 0;
          z-index: 1;
          opacity: 0.045;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
          background-size: 200px 200px;
        }

        .auth-content {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 48px 24px;
          background: var(--color-bg);
        }

        .auth-content__inner {
          width: 100%;
          max-width: 420px;
        }
      `}</style>
    </div>
  )
}