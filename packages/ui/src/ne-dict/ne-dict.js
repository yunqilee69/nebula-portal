import { jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { useAppContext } from "@nebula/core";
import { Space, Spin, Tag } from "antd";
import { useEffect, useMemo, useRef, useState } from "react";
function normalizeValues(value) {
    if (value === null || value === undefined) {
        return [];
    }
    if (Array.isArray(value)) {
        return value.map((item) => String(item));
    }
    return [String(value)];
}
function buildRecordKey(record, matchBy) {
    return matchBy === "itemCode" ? record.extra?.itemCode ?? record.value : record.value;
}
function renderAsTags(records) {
    return (_jsx(Space, { size: [8, 8], wrap: true, children: records.map((record) => (_jsx(Tag, { color: record.extra?.tagColor, children: record.label }, `${record.value}:${record.extra?.itemCode ?? record.label}`))) }));
}
export function NeDict({ dictCode, value, matchBy = "value", variant = "text", placeholder = "-", loadingPlaceholder, separator = ", ", preserveUnknownValue = false, render, }) {
    const ctx = useAppContext();
    const hasExplicitValue = value !== undefined;
    const values = useMemo(() => normalizeValues(value), [value]);
    const dictRef = useRef(ctx.dict);
    const busRef = useRef(ctx.bus);
    const [records, setRecords] = useState(() => (dictCode ? ctx.dict.get(dictCode) : []));
    const [loading, setLoading] = useState(false);
    useEffect(() => {
        dictRef.current = ctx.dict;
        busRef.current = ctx.bus;
    }, [ctx]);
    useEffect(() => {
        if (!dictCode) {
            setRecords([]);
            setLoading(false);
            return;
        }
        let active = true;
        const dict = dictRef.current;
        const bus = busRef.current;
        const cached = dict.get(dictCode);
        setRecords(cached);
        setLoading(cached.length === 0);
        const dispose = bus.on("dict:loaded", ({ keys }) => {
            if (!active || !keys.includes(dictCode)) {
                return;
            }
            setRecords(dictRef.current.get(dictCode));
            setLoading(false);
        });
        void dict.ensure(dictCode)
            .then((nextRecords) => {
            if (!active) {
                return;
            }
            setRecords(nextRecords);
        })
            .catch(() => {
            if (!active) {
                return;
            }
            setRecords([]);
        })
            .finally(() => {
            if (active) {
                setLoading(false);
            }
        });
        return () => {
            active = false;
            dispose();
        };
    }, [dictCode]);
    const matchedRecords = useMemo(() => {
        if (!hasExplicitValue) {
            return records;
        }
        if (values.length === 0 || records.length === 0) {
            return [];
        }
        const recordMap = new Map(records.map((record) => [buildRecordKey(record, matchBy), record]));
        return values.map((item) => recordMap.get(item)).filter((record) => Boolean(record));
    }, [hasExplicitValue, matchBy, records, values]);
    const unknownValues = useMemo(() => {
        if (!hasExplicitValue || !preserveUnknownValue) {
            return [];
        }
        const matchedKeys = new Set(matchedRecords.map((record) => buildRecordKey(record, matchBy)));
        return values.filter((item) => !matchedKeys.has(item));
    }, [hasExplicitValue, matchBy, matchedRecords, preserveUnknownValue, values]);
    if (hasExplicitValue && values.length === 0) {
        return _jsx(_Fragment, { children: placeholder });
    }
    if (loading && records.length === 0) {
        return loadingPlaceholder ? _jsx(_Fragment, { children: loadingPlaceholder }) : _jsx(Spin, { size: "small" });
    }
    if (render) {
        return _jsx(_Fragment, { children: render(records, matchedRecords) });
    }
    if (matchedRecords.length === 0 && unknownValues.length === 0) {
        return _jsx(_Fragment, { children: placeholder });
    }
    if (variant === "tag") {
        const tagRecords = [
            ...matchedRecords,
            ...unknownValues.map((item) => ({ label: item, value: item })),
        ];
        return renderAsTags(tagRecords);
    }
    const labels = matchedRecords.map((record) => record.label);
    return _jsx(_Fragment, { children: [...labels, ...unknownValues].join(separator) || placeholder });
}
