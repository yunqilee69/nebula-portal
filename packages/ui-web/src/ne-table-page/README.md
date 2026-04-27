# NeTablePage

## 提供的功能

- 提供统一的分页列表容器，内置数据请求、表格、分页和底部汇总
- 支持通过 `children` 组合模式传入 `<NeSearch>` 和 `<Table>` 元素
- 支持通过 `searchForm` prop 让父页面持有并复用 `FormInstance`
- 支持通过 `reloadToken` 触发重新加载，并可控制刷新后是否保留当前页码

## 参数说明

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `request` | `(query) => Promise<{ data; total; }>` | 分页请求函数，返回标准 `{ data, total }` 结构 |
| `searchForm` | `FormInstance<TQuery>` | 可选外部表单实例，便于父页面继续使用搜索值 |
| `children` | `ReactNode` | 搜索区内容 `<NeSearch>` 和 `<Table>` 元素，NeTablePage 会自动提取并注入数据 |
| `toolbar` | `ReactNode` | 表格工具栏内容 |
| `summary` | `ReactNode \| ((result, query) => ReactNode)` | 底部汇总内容 |
| `initialQuery` | `Partial<TQuery>` | 初始查询参数，同时用于初始化搜索区默认值 |
| `reloadToken` | `string \| number` | 外部刷新令牌，变化时自动重查 |
| `preservePageOnReload` | `boolean` | 刷新时是否保留当前页码，默认 `false` |

**注意**: 表格的 `columns`、`rowKey` 等配置直接写在 `<Table>` 元素上，不再作为 NeTablePage 的 props 传递。

## 怎么用

### 1. 完整组合模式（推荐）

适合标准后台列表页，把 `<NeSearch>` 和 `<Table>` 作为 children 放进 `<NeTablePage>`。

```tsx
import { SearchOutlined } from "@ant-design/icons";
import { Button, Form, Input, Select, Table } from "antd";
import { NeTablePage, NeSearch } from "@nebula/ui-web";

type UserQuery = {
  pageNum: number;
  pageSize: number;
  username?: string;
  status?: number;
};

interface UserRow {
  id: number;
  username: string;
  status: number;
}

const [form] = Form.useForm<UserQuery>();
const [reloadSeed, setReloadSeed] = useState(0);

const columns = [
  { title: "用户名", dataIndex: "username" },
  {
    title: "状态",
    render: (_: unknown, row: UserRow) =>
      row.status === 1 ? <Tag color="success">启用</Tag> : <Tag color="error">停用</Tag>,
  },
];

<NeTablePage<UserQuery>
  searchForm={form}
  request={fetchUserPage}
  initialQuery={{ pageNum: 1, pageSize: 20 }}
  reloadToken={reloadSeed}
  toolbar={<Button type="primary" icon={<PlusOutlined />}>新增</Button>}
  summary={(result) => `共 ${result.total} 条记录`}
>
  <NeSearch
    title="用户筛选"
    labels={{ expand: "展开", collapse: "收起", reset: "重置" }}
    onReset={() => {
      form.resetFields();
      setReloadSeed((current) => current + 1);
    }}
  >
    <Form form={form} layout="inline" initialValues={{ pageNum: 1, pageSize: 20 }} onFinish={() => setReloadSeed((current) => current + 1)}>
      <Form.Item name="username" label="用户名">
        <Input allowClear />
      </Form.Item>
      <Form.Item name="status" label="状态">
        <Select
          allowClear
          style={{ width: 140 }}
          options={[
            { label: "启用", value: 1 },
            { label: "停用", value: 0 },
          ]}
        />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
          查询
        </Button>
      </Form.Item>
    </Form>
  </NeSearch>
  <Table<UserRow> rowKey="id" columns={columns} />
</NeTablePage>
```

### 2. 仅表格模式

不传 `<NeSearch>` 时，NeTablePage 只渲染表格和分页。

```tsx
<NeTablePage<UserQuery>
  request={fetchUserPage}
  initialQuery={{ pageNum: 1, pageSize: 20 }}
>
  <Table<UserRow> rowKey="id" columns={columns} />
</NeTablePage>
```

### 3. 自定义搜索区模式

适合有复杂联动、需要额外提示的场景，可以在 children 里放自定义搜索区组件。

```tsx
<NeTablePage<UserQuery>
  searchForm={form}
  request={fetchUserPage}
  initialQuery={{ pageNum: 1, pageSize: 20 }}
  reloadToken={reloadSeed}
>
  <MyCustomSearchPanel form={form} onSubmit={() => setReloadSeed((current) => current + 1)} />
  <Table<UserRow> rowKey="id" columns={columns} />
</NeTablePage>
```

## 设计说明

- **表格配置由 `<Table>` 元素控制**: `columns`、`rowKey`、`scroll`、`size` 等属性直接写在 `<Table>` 上
- **NeTablePage 自动注入**: `loading`、`dataSource`、`pagination={false}` 会自动注入到提取的 `<Table>` 元素
- **组合模式更灵活**: 符合 React 组合直觉，表格配置完全由页面控制，后续可扩展更多子元素
- **父页面需要表单数据**: 通过 `searchForm` prop 拿到 `FormInstance`，页面继续用
- 刷新后默认会回到第一页；如果希望保留当前页码，可以配合 `preservePageOnReload`