import { Form, Pagination, Table } from "antd";
import type { FormInstance, FormProps, PaginationProps, TableProps } from "antd";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { NeSearchPanel, type NeSearchPanelProps } from "../ne-search-panel/ne-search-panel";
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

export interface NeTablePageProps<TQuery extends NePagedQuery, TRow extends object> {
  title: ReactNode;
  form: FormInstance<TQuery>;
  initialQuery: TQuery;
  request: (query: TQuery) => Promise<NeTablePageResult<TRow>>;
  columns: TableProps<TRow>["columns"];
  rowKey: TableProps<TRow>["rowKey"];
  toolbar?: ReactNode;
  labels?: NeSearchPanelProps["labels"];
  pageSizeOptions?: number[];
  formProps?: Omit<FormProps<TQuery>, "form" | "initialValues" | "onFinish">;
  searchContent: ReactNode;
  summary?: (result: NeTablePageResult<TRow>, query: TQuery) => ReactNode;
  tableProps?: Omit<TableProps<TRow>, "columns" | "dataSource" | "loading" | "pagination" | "rowKey">;
  paginationProps?: Partial<PaginationProps>;
  onQuerySuccess?: (result: NeTablePageResult<TRow>, query: TQuery) => void;
  onQueryError?: (error: unknown, query: TQuery) => void;
  onLoadingChange?: (loading: boolean) => void;
}

function NeTablePageInner<TQuery extends NePagedQuery, TRow extends object>({
  title,
  form,
  initialQuery,
  request,
  columns,
  rowKey,
  toolbar,
  labels,
  pageSizeOptions,
  formProps,
  searchContent,
  summary,
  tableProps,
  paginationProps,
  onQuerySuccess,
  onQueryError,
  onLoadingChange,
}: NeTablePageProps<TQuery, TRow>) {
  const [query, setQuery] = useState<TQuery>(initialQuery);
  const [result, setResult] = useState<NeTablePageResult<TRow>>({ data: [], total: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      onLoadingChange?.(true);
      setError(null);
      try {
        const nextResult = await request(query);
        if (!active) {
          return;
        }
        setResult(nextResult);
        onQuerySuccess?.(nextResult, query);
      } catch (caughtError) {
        if (!active) {
          return;
        }
        setResult({ data: [], total: 0 });
        setError(caughtError instanceof Error ? caughtError.message : "Request failed");
        onQueryError?.(caughtError, query);
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
  }, [onLoadingChange, onQueryError, onQuerySuccess, query, request]);

  const mergedLabels = labels ?? {
    expand: "Expand",
    collapse: "Collapse",
    reset: "Reset",
  };

  const resolvedSummary = useMemo(() => summary?.(result, query), [query, result, summary]);

  return (
    <>
      <NeSearchPanel
        title={title}
        labels={mergedLabels}
        onReset={() => {
          form.resetFields();
          setQuery(initialQuery);
        }}
      >
        <Form
          {...formProps}
          form={form}
          initialValues={initialQuery}
          onFinish={(values) => setQuery((current) => ({ ...current, ...values, pageNum: 1 }))}
        >
          {searchContent}
        </Form>
        {error ? <div style={{ color: "var(--nebula-danger, #ff4d4f)", marginTop: 16 }}>{error}</div> : null}
      </NeSearchPanel>

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
            onChange={(pageNum, pageSize) => setQuery((current) => ({ ...current, pageNum, pageSize }))}
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
    </>
  );
}

export function NeTablePage<TQuery extends NePagedQuery, TRow extends object>(props: NeTablePageProps<TQuery, TRow>) {
  return <NeTablePageInner {...props} />;
}