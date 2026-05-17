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
        <header className="ne-page__header">
          <div className="ne-page__heading">
            {title ? <h1 className="ne-page__title">{title}</h1> : null}
            {subtitle ? <p className="ne-page__subtitle">{subtitle}</p> : null}
          </div>
          {extra ? <div className="ne-page__extra">{extra}</div> : null}
        </header>
      ) : null}
      {children}
    </section>
  );
}
