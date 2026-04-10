import type { ReactNode } from "react";
import { type NeFileCardFile } from "../ne-file-card/ne-file-card";
export interface NeFileUploaderProps {
    value: NeFileCardFile[];
    accept?: string;
    multiple?: boolean;
    maxCount?: number;
    maxSize?: number;
    emptyTitle?: string;
    helperText?: ReactNode;
    onChange: (files: NeFileCardFile[]) => void;
    onUpload: (file: File) => Promise<NeFileCardFile>;
    onPreview?: (file: NeFileCardFile) => void;
    onDownload?: (file: NeFileCardFile) => void;
}
export declare function NeFileUploader({ value, accept, multiple, maxCount, maxSize, emptyTitle, helperText, onChange, onUpload, onPreview, onDownload, }: NeFileUploaderProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=ne-file-uploader.d.ts.map