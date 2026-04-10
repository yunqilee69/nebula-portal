import type { DictRecord } from "@nebula/core";
import type { ReactNode } from "react";
export type NeDictMatchBy = "value" | "itemCode";
export type NeDictVariant = "text" | "tag";
export type NeDictValue = string | number | null | undefined | Array<string | number>;
export interface NeDictProps {
    dictCode: string;
    value?: NeDictValue;
    matchBy?: NeDictMatchBy;
    variant?: NeDictVariant;
    placeholder?: ReactNode;
    loadingPlaceholder?: ReactNode;
    separator?: string;
    preserveUnknownValue?: boolean;
    render?: (records: DictRecord[], matchedRecords: DictRecord[]) => ReactNode;
}
export declare function NeDict({ dictCode, value, matchBy, variant, placeholder, loadingPlaceholder, separator, preserveUnknownValue, render, }: NeDictProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=ne-dict.d.ts.map