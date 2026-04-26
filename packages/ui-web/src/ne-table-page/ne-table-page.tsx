import { Pagination, Table } from "antd";
import type { FormInstance, PaginationProps, TableProps } from "antd";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { NeTable } from "../ne-table/ne-table";

export interface NePagedQuery {
  pageNum: number;
  pageSize: number;
  orderName?: string;
  orderType?: string;
}

export interface NeTablePageResult<TRow> {
  data: TRow[];
  total: number;
}

const DEFAULT_PAGE_SIZE = 20;
const DEFAULT_PAGE_SIZE_OPTIONS = [10, 20, 50];

export interface NeTablePageProps<TQuery extends NePagedQuery, TRow extends object> {
  request: (query: TQuery) => Promise<NeTablePageResult<TRow>>;
  columns: TableProps<TRow>["columns"];
  rowKey?: TableProps<TRow>["rowKey"];
  searchForm?: FormInstance<TQuery>;
  toolbar?: ReactNode;
  summary?: ReactNode | ((result: NeTablePageResult<TRow>, query: TQuery) => ReactNode);
  pageSizeOptions?: number[];
  tableProps?: Omit<TableProps<TRow>, "columns" | "dataSource" | "loading" | "pagination" | "rowKey">;
  paginationProps?: Partial<PaginationProps>;
  onRequestSuccess?: (result: NeTablePageResult<TRow>, query: TQuery) => void;
  onRequestFail?: (error: unknown, query: TQuery) => void;
  onLoadingChange?: (loading: boolean) => void;
}

export function NeTablePage<TQuery extends NePagedQuery, TRow extends object>({
  request,
  columns,
  rowKey = "id",
  searchForm,
  toolbar,
  summary,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  tableProps,
  paginationProps,
  onRequestSuccess,
  onRequestFail,
  onLoadingChange,
}: NeTablePageProps<TQuery, TRow>) {
  const [query, setQuery] = useState<TQuery>({
    pageNum: 1,
    pageSize: DEFAULT_PAGE_SIZE,
  } as TQuery);
  const [result, setResult] = useState<NeTablePageResult<TRow>>({ data: [], total: 0 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      onLoadingChange?.(true);
      const formValues = searchForm?.getFieldsValue() ?? {};
      const mergedQuery = { ...formValues, pageNum: query.pageNum, pageSize: query.pageSize } as TQuery;
      try {
        const nextResult = await request(mergedQuery);
        if (!active) {
          return;
        }
        setResult(nextResult);
        onRequestSuccess?.(nextResult, mergedQuery);
      } catch (caughtError) {
        if (!active) {
          return;
        }
        setResult({ data: [], total: 0 });
        onRequestFail?.(caughtError, mergedQuery);
      } finally {
        if (active) {
          setLoading(false);
          onLoadingChange?.(false);
        }
      }
    };

    load().catch(() => undefined);

    return () => {
      active = false;
    };
  }, [onLoadingChange, onRequestFail, onRequestSuccess, query, request, searchForm]);

  const resolvedSummary = useMemo(
    () => (typeof summary === "function" ? summary(result, query) : summary),
    [query, result, summary]
  );

  return (
    <NeTable
      toolbar={toolbar}
      summary={resolvedSummary}
      pageSizeOptions={pageSizeOptions}
      pagination={
        <Pagination
          align="end"
          current={query.pageNum}
          pageSize={query.pageSize}
          total={result.total}
          onChange={(pageNum, pageSize) => {
            const formValues = searchForm?.getFieldsValue() ?? {};
            setQuery({ ...formValues, pageNum, pageSize } as TQuery);
          }}
          {...paginationProps}
        />
      }
    >
      <Table<TRow>
        {...tableProps}
        rowKey={rowKey}
        loading={loading}
        dataSource={result.data}
        columns={columns}
        pagination={false}
      />
    </NeTable>
  );
}