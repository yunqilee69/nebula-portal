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
export declare function NeNavCards({ items }: NeNavCardsProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=ne-nav-cards.d.ts.map