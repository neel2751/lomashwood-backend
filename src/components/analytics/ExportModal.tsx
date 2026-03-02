'use client'

import { useState } from 'react'

export type ExportModalProps = {
  open: boolean
  onClose: () => void
}

export function ExportModal({ open, onClose }: ExportModalProps) {
  const [format, setFormat] = useState<'csv' | 'excel' | 'json'>('csv')

  if (!open) return null

  return (
    <div className="export-modal-overlay" onClick={onClose}>
      <div className="export-modal" onClick={(e) => e.stopPropagation()}>
        <div className="export-modal__header">
          <h2 className="export-modal__title">New Export</h2>
          <button className="export-modal__close" onClick={onClose} aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="export-modal__body">
          <label className="export-modal__label">Format</label>
          <div className="export-modal__formats">
            {(['csv', 'excel', 'json'] as const).map((f) => (
              <button
                key={f}
                className={`export-modal__format-btn ${format === f ? 'active' : ''}`}
                onClick={() => setFormat(f)}
              >
                {f.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="export-modal__footer">
          <button className="em-btn-ghost" onClick={onClose}>Cancel</button>
          <button className="em-btn-primary">Export</button>
        </div>

        <style>{`
          .export-modal-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.35);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 999;
          }
          .export-modal {
            background: #fff;
            border-radius: 14px;
            width: 100%;
            max-width: 420px;
            padding: 24px;
            display: flex;
            flex-direction: column;
            gap: 20px;
            box-shadow: 0 8px 40px rgba(0,0,0,0.12);
          }
          .export-modal__header {
            display: flex;
            align-items: center;
            justify-content: space-between;
          }
          .export-modal__title {
            font-size: 1rem;
            font-weight: 700;
            color: #1A1A18;
            margin: 0;
          }
          .export-modal__close {
            width: 30px;
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: none;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            color: #6B6B68;
          }
          .export-modal__close:hover { background: #F0EDE8; color: #1A1A18; }
          .export-modal__label {
            font-size: 0.75rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: #6B6B68;
            display: block;
            margin-bottom: 8px;
          }
          .export-modal__formats {
            display: flex;
            gap: 8px;
          }
          .export-modal__format-btn {
            flex: 1;
            height: 36px;
            border: 1.5px solid #E8E6E1;
            border-radius: 8px;
            background: #fff;
            font-size: 0.8125rem;
            font-weight: 600;
            color: #6B6B68;
            cursor: pointer;
            transition: all 0.15s;
          }
          .export-modal__format-btn.active {
            border-color: #1A1A18;
            color: #1A1A18;
            background: #F5F3EF;
          }
          .export-modal__footer {
            display: flex;
            justify-content: flex-end;
            gap: 8px;
          }
          .em-btn-primary {
            height: 38px;
            padding: 0 16px;
            background: #1A1A18;
            color: #F5F0E8;
            border: none;
            border-radius: 8px;
            font-size: 0.875rem;
            font-weight: 600;
            cursor: pointer;
          }
          .em-btn-primary:hover { background: #2E2E2A; }
          .em-btn-ghost {
            height: 38px;
            padding: 0 12px;
            background: none;
            border: none;
            font-size: 0.875rem;
            font-weight: 500;
            color: #6B6B68;
            cursor: pointer;
          }
          .em-btn-ghost:hover { color: #1A1A18; }
        `}</style>
      </div>
    </div>
  )
}