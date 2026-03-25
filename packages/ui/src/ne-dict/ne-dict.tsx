import { useAppContext } from "@platform/core";
import type { DictRecord } from "@platform/core";
import { Space, Spin, Tag } from "antd";
import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

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

function normalizeValues(value: NeDictValue) {
  if (value === null || value === undefined) {
    return [] as string[];
  }

  if (Array.isArray(value)) {
    return value.map((item) => String(item));
  }

  return [String(value)];
}

function buildRecordKey(record: DictRecord, matchBy: NeDictMatchBy) {
  return matchBy === "itemCode" ? record.extra?.itemCode ?? record.value : record.value;
}

function renderAsTags(records: DictRecord[]) {
  return (
    <Space size={[8, 8]} wrap>
      {records.map((record) => (
        <Tag key={`${record.value}:${record.extra?.itemCode ?? record.label}`} color={record.extra?.tagColor}>
          {record.label}
        </Tag>
      ))}
    </Space>
  );
}

export function NeDict({
  dictCode,
  value,
  matchBy = "value",
  variant = "text",
  placeholder = "-",
  loadingPlaceholder,
  separator = ", ",
  preserveUnknownValue = false,
  render,
}: NeDictProps) {
  const ctx = useAppContext();
  const hasExplicitValue = value !== undefined;
  const values = useMemo(() => normalizeValues(value), [value]);
  const dictRef = useRef(ctx.dict);
  const busRef = useRef(ctx.bus);
  const [records, setRecords] = useState<DictRecord[]>(() => (dictCode ? ctx.dict.get(dictCode) : []));
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
      return [] as DictRecord[];
    }

    const recordMap = new Map(records.map((record) => [buildRecordKey(record, matchBy), record]));
    return values.map((item) => recordMap.get(item)).filter((record): record is DictRecord => Boolean(record));
  }, [hasExplicitValue, matchBy, records, values]);

  const unknownValues = useMemo(() => {
    if (!hasExplicitValue || !preserveUnknownValue) {
      return [] as string[];
    }

    const matchedKeys = new Set(matchedRecords.map((record) => buildRecordKey(record, matchBy)));
    return values.filter((item) => !matchedKeys.has(item));
  }, [hasExplicitValue, matchBy, matchedRecords, preserveUnknownValue, values]);

  if (hasExplicitValue && values.length === 0) {
    return <>{placeholder}</>;
  }

  if (loading && records.length === 0) {
    return loadingPlaceholder ? <>{loadingPlaceholder}</> : <Spin size="small" />;
  }

  if (render) {
    return <>{render(records, matchedRecords)}</>;
  }

  if (matchedRecords.length === 0 && unknownValues.length === 0) {
    return <>{placeholder}</>;
  }

  if (variant === "tag") {
    const tagRecords = [
      ...matchedRecords,
      ...unknownValues.map<DictRecord>((item) => ({ label: item, value: item })),
    ];
    return renderAsTags(tagRecords);
  }

  const labels = matchedRecords.map((record) => record.label);
  return <>{[...labels, ...unknownValues].join(separator) || placeholder}</>;
}
