# NeUserPicker

## 提供的功能

- 提供统一的用户选择能力，支持单选和多选两种模式
- 支持按组织、角色、状态筛选用户，并支持关键字搜索用户名、昵称、邮箱、手机号
- 默认使用内置触发器展示已选用户，适合直接作为表单输入组件使用
- 同时导出 `NeUserPickerModal`，便于在自定义按钮、自定义表单布局中复用选择弹窗

## 组件列表

- `NeUserPicker`：带触发器的完整用户选择组件，适合直接放在页面或表单中使用
- `NeUserPickerModal`：仅包含选择弹窗本体，适合与自定义按钮或自定义触发区域组合使用

## 使用方式

### 多选模式（默认）

```tsx
import { useState } from "react";
import type { UserItem } from "@nebula/core";
import { NeUserPicker } from "@nebula/ui-web";

export function MultiUserPickerDemo() {
  const [value, setValue] = useState<string[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);

  return (
    <NeUserPicker
      value={value}
      onChange={(nextValue, nextUsers) => {
        setValue(Array.isArray(nextValue) ? nextValue : nextValue ? [nextValue] : []);
        setUsers(nextUsers);
      }}
      placeholder="请选择协作成员"
      maxTagCount={3}
    />
  );
}
```

### 单选模式

```tsx
import { useState } from "react";
import { NeUserPicker } from "@nebula/ui-web";

export function SingleUserPickerDemo() {
  const [value, setValue] = useState<string | undefined>();

  return (
    <NeUserPicker
      mode="single"
      value={value}
      onChange={(nextValue) => {
        setValue(typeof nextValue === "string" ? nextValue : nextValue?.[0]);
      }}
      placeholder="请选择负责人"
      modalTitle="选择负责人"
    />
  );
}
```

### 表单字段用法

```tsx
import { Form } from "antd";
import { NeUserPicker } from "@nebula/ui-web";

export function UserFormDemo() {
  return (
    <Form layout="vertical" initialValues={{ approverId: undefined, memberIds: [] }}>
      <Form.Item label="审批人" name="approverId">
        <NeUserPicker mode="single" placeholder="请选择审批人" />
      </Form.Item>

      <Form.Item label="参与成员" name="memberIds">
        <NeUserPicker placeholder="请选择参与成员" showStatusFilter excludeUserIds={["1"]} />
      </Form.Item>
    </Form>
  );
}
```

### 自定义触发器配合 NeUserPickerModal

```tsx
import { Button, Space, Typography } from "antd";
import { useMemo, useState } from "react";
import type { UserItem } from "@nebula/core";
import { NeUserPickerModal } from "@nebula/ui-web";

export function CustomTriggerDemo() {
  const [open, setOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<UserItem[]>([]);

  const selectedNames = useMemo(
    () => selectedUsers.map((user) => user.nickname || user.username).join("、"),
    [selectedUsers],
  );

  return (
    <Space direction="vertical" size={12}>
      <Typography.Text>当前已选：{selectedNames || "未选择"}</Typography.Text>

      <Button type="primary" onClick={() => setOpen(true)}>选择成员</Button>

      <NeUserPickerModal
        open={open}
        onOpenChange={setOpen}
        mode="multiple"
        selectedIds={selectedIds}
        onSelectedIdsChange={setSelectedIds}
        onComplete={(users) => {
          setSelectedUsers(users);
          setSelectedIds(users.map((user) => user.id));
        }}
        title="选择项目成员"
      />
    </Space>
  );
}
```

## NeUserPicker Props

| 参数 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `mode` | `"single" \| "multiple"` | `"multiple"` | 选择模式，控制触发器展示方式和弹窗选择行为 |
| `value` | `string \| string[] \| undefined` | `undefined` | 当前选中的用户 ID；单选时传 `string`，多选时传 `string[]` |
| `onChange` | `(value: UserPickerValue, users: UserItem[]) => void` | `undefined` | 选中结果变化时触发，返回最新的值和已解析的用户列表 |
| `placeholder` | `string` | `"请选择用户"` | 未选择任何用户时触发器显示的占位文案 |
| `disabled` | `boolean` | `false` | 是否禁用触发器点击和标签移除操作 |
| `maxTagCount` | `number \| "responsive"` | `3` | 多选模式下触发器中最多展示多少个标签；超出后折叠显示 |
| `showOrgFilter` | `boolean` | `true` | 是否在弹窗顶部显示组织筛选 |
| `showRoleFilter` | `boolean` | `true` | 是否在弹窗顶部显示角色筛选 |
| `showStatusFilter` | `boolean` | `false` | 是否在弹窗顶部显示状态筛选 |
| `defaultOrgId` | `string` | `undefined` | 弹窗每次打开时默认应用的组织 ID |
| `defaultRoleId` | `string` | `undefined` | 弹窗每次打开时默认应用的角色 ID |
| `modalTitle` | `string` | `undefined` | 透传给内置 `NeUserPickerModal` 的弹窗标题 |
| `modalWidth` | `number \| string` | `600` | 透传给内置 `NeUserPickerModal` 的弹窗宽度 |
| `excludeUserIds` | `string[]` | `undefined` | 需要从选择结果中排除的用户 ID 列表 |
| `includeUserIds` | `string[]` | `undefined` | 当外部存在筛选限制时，仍然强制保留可选的用户 ID 列表 |
| `fetchUsers` | `(query: UserPageQuery) => Promise<UserPageResult>` | `fetchUserPage` | 获取用户分页数据的方法；默认使用 pages-web 的 fetchUserPage |
| `fetchOrganizations` | `() => Promise<OrganizationItem[]>` | `fetchOrganizationList` | 获取组织筛选选项的方法；默认使用 pages-web 的 fetchOrganizationList |
| `fetchRoles` | `() => Promise<RoleItem[]>` | `fetchRoleList` | 获取角色筛选选项的方法；默认使用 pages-web 的 fetchRoleList |

## NeUserPickerModal Props

| 参数 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `open` | `boolean` | 必填 | 控制弹窗显示和隐藏 |
| `onOpenChange` | `(open: boolean) => void` | 必填 | 弹窗打开状态变化时触发 |
| `mode` | `"single" \| "multiple"` | `"single"` | 选择模式，单选使用单选框，多选使用复选框 |
| `selectedIds` | `string[]` | 必填 | 当前在弹窗中选中的用户 ID 列表 |
| `onSelectedIdsChange` | `(selectedIds: string[]) => void` | 必填 | 弹窗中勾选状态变化时触发 |
| `onComplete` | `(users: UserItem[]) => void` | 必填 | 点击确认后触发，返回当前确认的完整用户列表 |
| `showOrgFilter` | `boolean` | `true` | 是否显示组织筛选下拉框 |
| `showRoleFilter` | `boolean` | `true` | 是否显示角色筛选下拉框 |
| `showStatusFilter` | `boolean` | `true` | 是否显示状态筛选下拉框 |
| `defaultOrgId` | `string` | `undefined` | 弹窗打开后默认选中的组织 ID |
| `defaultRoleId` | `string` | `undefined` | 弹窗打开后默认选中的角色 ID |
| `title` | `string` | `undefined` | 弹窗标题；未传时回退为国际化的“选择”文案 |
| `width` | `number \| string` | `860` | 弹窗宽度；内部会在未传数值时回退到 `860` |
| `excludeUserIds` | `string[]` | `undefined` | 需要从当前结果中移除的用户 ID 列表 |
| `includeUserIds` | `string[]` | `undefined` | 仅允许出现在结果中的用户 ID 列表；有值时会对列表做白名单过滤 |
| `fetchUsers` | `(query: UserPageQuery) => Promise<UserPageResult>` | `fetchUserPage` | 获取用户分页数据的方法；默认使用 pages-web 的 fetchUserPage |
| `fetchOrganizations` | `() => Promise<OrganizationItem[]>` | `fetchOrganizationList` | 获取组织选项的方法；默认使用 pages-web 的 fetchOrganizationList |
| `fetchRoles` | `() => Promise<RoleItem[]>` | `fetchRoleList` | 获取角色选项的方法；默认使用 pages-web 的 fetchRoleList |

## 依赖

- `@nebula/core`：提供 `UserItem`、`OrganizationItem`、`RoleItem`、`UserPageQuery`、国际化等核心类型与运行时能力
- `antd`：提供 `Select`、`Input.Search`、`Table`、`Pagination`、`Avatar` 等基础 UI 组件
- `@nebula/ui-web`：业务侧通常从统一入口导入 `NeUserPicker` 和 `NeUserPickerModal`
