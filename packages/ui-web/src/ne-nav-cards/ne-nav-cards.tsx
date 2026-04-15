import type { ReactNode } from "react";

/**
 * Navigation item rendered by {@link NeNavCards}.
 */
export interface NeNavCardItem {
  /**
   * Stable unique key used when rendering the navigation list.
   */
  key: string;
  /**
   * Main card title shown to the user.
   */
  title: string;
  /**
   * Supporting description that explains the destination or action.
   */
  description: string;
  /**
   * Callback executed when the card is clicked.
   */
  onClick: () => void;
  /**
   * Optional footer content rendered at the bottom of the card.
   */
  footer?: ReactNode;
}

/**
 * Props accepted by {@link NeNavCards}.
 */
export interface NeNavCardsProps {
  /**
   * Card items rendered in a responsive grid.
   */
  items: NeNavCardItem[];
}

/**
 * Nebula navigation card grid used for high-visibility entry points such as platform dashboards.
 */
export function NeNavCards({ items }: NeNavCardsProps) {
  return (
    <div className="ne-card-grid">
      {items.map((item) => (
        <button key={item.key} className="ne-nav-card" onClick={item.onClick} type="button">
          <strong>{item.title}</strong>
          <span className="ne-muted">{item.description}</span>
          {item.footer}
        </button>
      ))}
    </div>
  );
}
