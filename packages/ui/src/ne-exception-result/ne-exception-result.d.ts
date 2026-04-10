export interface NeExceptionResultProps {
    status?: "403" | "404" | "500" | "warning" | "error" | "info" | "success";
    title: string;
    subtitle?: string;
    actionText?: string;
    onAction?: () => void;
}
export declare function NeExceptionResult({ status, title, subtitle, actionText, onAction }: NeExceptionResultProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=ne-exception-result.d.ts.map