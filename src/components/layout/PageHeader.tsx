import Link from "next/link";

interface PageHeaderProps {
  title: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
  actionLabel?: string;
  actionHref?: string;
}

export function PageHeader({ title, description, backHref, backLabel, actionLabel, actionHref }: PageHeaderProps) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px" }}>
      <div>
        {backHref && (
          <a href={backHref} style={{ fontSize: "0.875rem", color: "#6B6B68", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "4px", marginBottom: "6px" }}>
            ← {backLabel ?? "Back"}
          </a>
        )}
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#1A1A18", margin: 0 }}>
          {title}
        </h1>
        {description && (
          <p style={{ fontSize: "0.875rem", color: "#6B6B68", margin: "4px 0 0" }}>
            {description}
          </p>
        )}
      </div>
      {actionLabel && actionHref && (
        <Link href={actionHref} style={{ display: "inline-flex", alignItems: "center", height: "36px", padding: "0 16px", borderRadius: "8px", backgroundColor: "#1A1A18", color: "#fff", fontSize: "0.875rem", fontWeight: 500, textDecoration: "none", whiteSpace: "nowrap" }}>
          + {actionLabel}
        </Link>
      )}
    </div>
  );
}