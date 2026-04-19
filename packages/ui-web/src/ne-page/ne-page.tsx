import type { ReactNode } from "react";

/**
 * Props accepted by {@link NePage}.
 */
export interface NePageProps {
  /**
   * Primary page heading rendered at the top of the page.
   */
  title?: string;
  /**
   * Secondary text shown under the page title to explain the current view.
   */
  subtitle?: string;
  /**
   * Extra actions rendered on the right side of the page header, such as buttons or status tags.
   */
  extra?: ReactNode;
  /**
   * Main page content rendered under the page header.
   */
  children: ReactNode;
  /**
   * Optional custom class name appended to the default `ne-page` class.
   */
  className?: string;
}

export function NePage({ title, subtitle, extra, children, className }: NePageProps) {
  const pageClassName = ["ne-page", className].filter(Boolean).join(" ");
  const hasHeader = Boolean(title || subtitle || extra);

  return (
    <section className={pageClassName}>
      {hasHeader ? (
        <header
          style={{
            display: "flex",
            alignItems: "start",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          <div>
            {title ? <h1 style={{ margin: 0, fontSize: 24 }}>{title}</h1> : null}
            {subtitle ? <p style={{ margin: title ? "8px 0 0" : 0, color: "var(--nebula-text-muted, #667085)" }}>{subtitle}</p> : null}
          </div>
          {extra}
        </header>
      ) : null}
      {children}
    </section>
  );
}
