import { Pagination } from "antd";
import type { FormInstance, PaginationProps } from "antd";
import type { ReactElement, ReactNode } from "react";
import { Children, cloneElement, isValidElement, useCallback, useEffect, useMemo, useState } from "react";
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
const DEFAULT_QUERY: NePagedQuery = {
  pageNum: 1,
  pageSize: DEFAULT_PAGE_SIZE,
};

export interface NeTablePageProps<TQuery extends NePagedQuery> {
  request: (query: TQuery) => Promise<NeTablePageResult<object>>;
  searchForm?: FormInstance<TQuery>;
  children?: ReactNode;
  toolbar?: ReactNode;
  summary?: ReactNode | ((result: NeTablePageResult<object>, query: TQuery) => ReactNode);
  pageSizeOptions?: number[];
  paginationProps?: Partial<PaginationProps>;
  onRequestSuccess?: (result: NeTablePageResult<object>, query: TQuery) => void;
  onRequestFail?: (error: unknown, query: TQuery) => void;
  onLoadingChange?: (loading: boolean) => void;
  initialQuery?: Partial<TQuery>;
  reloadToken?: string | number;
  preservePageOnReload?: boolean;
}

interface TableLikeProps {
  columns?: unknown;
  dataSource?: unknown;
  loading?: boolean;
  pagination?: boolean | unknown;
  rowKey?: string | ((record: unknown) => string);
}

function isTableElement(child: ReactNode): child is ReactElement<TableLikeProps> {
  if (!isValidElement<TableLikeProps>(child)) {
    return false;
  }

  // Use props-based detection like NeTable does, more reliable than type reference comparison
  return "columns" in child.props;
}

function extractTableFromChildren(children: ReactNode): {
  tableElement: ReactElement<TableLikeProps> | null;
  otherChildren: ReactNode[];
} {
  const childArray = Children.toArray(children);
  const tableElement = childArray.find(isTableElement) as ReactElement<TableLikeProps> | undefined;

  if (!tableElement) {
    return {
      tableElement: null,
      otherChildren: childArray,
    };
  }

  return {
    tableElement,
    otherChildren: childArray.filter((child) => child !== tableElement),
  };
}

function buildQuery<TQuery extends NePagedQuery>(
  paginationQuery: Partial<TQuery> | undefined,
  searchValues: Partial<TQuery> | undefined,
  initialQuery: Partial<TQuery> | undefined,
): TQuery {
  return {
    ...DEFAULT_QUERY,
    ...initialQuery,
    ...searchValues,
    ...paginationQuery,
  } as TQuery;
}

export function NeTablePage<TQuery extends NePagedQuery>({
  request,
  searchForm,
  children,
  toolbar,
  summary,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  paginationProps,
  onRequestSuccess,
  onRequestFail,
  onLoadingChange,
  initialQuery,
  reloadToken,
  preservePageOnReload = false,
}: NeTablePageProps<TQuery>) {
  const { tableElement, otherChildren } = useMemo(
    () => extractTableFromChildren(children),
    [children],
  );

  const [paginationQuery, setPaginationQuery] = useState<Partial<TQuery>>(() => ({
    pageNum: initialQuery?.pageNum ?? DEFAULT_QUERY.pageNum,
    pageSize: initialQuery?.pageSize ?? DEFAULT_QUERY.pageSize,
  } as Partial<TQuery>));
  const [searchValues, setSearchValues] = useState<Partial<TQuery>>(() => searchForm?.getFieldsValue() ?? {});
  const [result, setResult] = useState<NeTablePageResult<object>>({ data: [], total: 0 });
  const [loading, setLoading] = useState(false);

  const query = useMemo(
    () => buildQuery<TQuery>(paginationQuery, searchValues, initialQuery),
    [initialQuery, paginationQuery, searchValues],
  );

  const reload = useCallback(
    (options?: { preservePage?: boolean }) => {
      const nextSearchValues = (searchForm?.getFieldsValue() ?? {}) as Partial<TQuery>;
      setSearchValues(nextSearchValues);
      setPaginationQuery((current) => ({
        ...current,
        pageNum: options?.preservePage ? current.pageNum ?? initialQuery?.pageNum ?? DEFAULT_QUERY.pageNum : initialQuery?.pageNum ?? DEFAULT_QUERY.pageNum,
      }));
    },
    [initialQuery, searchForm],
  );

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      onLoadingChange?.(true);
      try {
        const nextResult = await request(query);
        if (!active) {
          return;
        }
        setResult(nextResult);
        onRequestSuccess?.(nextResult, query);
      } catch (caughtError) {
        if (!active) {
          return;
        }
        setResult({ data: [], total: 0 });
        onRequestFail?.(caughtError, query);
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
  }, [onLoadingChange, onRequestFail, onRequestSuccess, query, request]);

  useEffect(() => {
    if (reloadToken === undefined) {
      return;
    }

    reload({ preservePage: preservePageOnReload });
  }, [preservePageOnReload, reload, reloadToken]);

  const resolvedSummary = useMemo(
    () => (typeof summary === "function" ? summary(result, query) : summary),
    [query, result, summary],
  );

  const hasSearchContent = otherChildren.length > 0;

  return (
    <>
      {hasSearchContent ? otherChildren : null}
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
              setPaginationQuery((current) => ({
                ...current,
                pageNum,
                pageSize,
              }));
            }}
            {...paginationProps}
          />
        }
      >
        {tableElement
          ? cloneElement(tableElement, {
              loading,
              dataSource: result.data,
              pagination: false,
            })
          : null}
      </NeTable>
    </>
  );
}
