interface ExportButtonProps {
  label?: string
}

export function ExportButton({ label = 'Export' }: ExportButtonProps) {
  return (
    <button
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '7px',
        height: '38px',
        padding: '0 16px',
        background: '#FFFFFF',
        color: '#1A1A18',
        border: '1.5px solid #E8E6E1',
        borderRadius: '8px',
        fontFamily: "'DM Sans', system-ui, sans-serif",
        fontSize: '0.875rem',
        fontWeight: 600,
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  )
}