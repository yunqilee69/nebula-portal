/**
 * Semantic tone options supported by {@link NeStatusTag}.
 */
export type NeStatusTagTone = "success" | "processing" | "warning" | "error";
/**
 * Props accepted by {@link NeStatusTag}.
 */
export interface NeStatusTagProps {
    /**
     * Semantic status tone mapped to the Ant Design tag color.
     */
    tone: NeStatusTagTone;
    /**
     * Text displayed inside the status tag.
     */
    label: string;
}
/**
 * Nebula status tag used to display concise state labels with consistent semantic colors.
 */
export declare function NeStatusTag({ tone, label }: NeStatusTagProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=ne-status-tag.d.ts.map