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
export declare function NePage({ title, subtitle, extra, children, className }: NePageProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=ne-page.d.ts.map