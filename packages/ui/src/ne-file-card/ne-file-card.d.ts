import type { ReactNode } from "react";
export interface NeFileCardFile {
    id: string;
    fileName: string;
    previewUrl?: string;
    thumbnailUrl?: string;
    contentType?: string;
    extension?: string;
    size?: number;
    createdAt?: string;
}
export interface NeFileCardProps {
    file: NeFileCardFile;
    extra?: ReactNode;
    onPreview?: (file: NeFileCardFile) => void;
    onDownload?: (file: NeFileCardFile) => void;
    onRemove?: (file: NeFileCardFile) => void;
}
export declare function NeFileCard({ file, extra, onPreview, onDownload, onRemove }: NeFileCardProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=ne-file-card.d.ts.map