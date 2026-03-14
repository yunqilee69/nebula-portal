import { DeleteOutlined, EditOutlined, PlusOutlined, SearchOutlined } from "@ant-design/icons";
import { Button, Descriptions, Form, Input, InputNumber, Pagination, Popconfirm, Select, Space, Table, Tag } from "antd";
import type { ButtonItem, ButtonMutationPayload, MenuItem, OrganizationItem, PermissionItem, PermissionMutationPayload, RoleItem } from "@platform/core";
import { NePermission, useI18n } from "@platform/core";
import { useEffect, useMemo, useState } from "react";
import { createButton, deleteButton, fetchButtonPage, updateButton } from "../api/button-api";
import { fetchMenuTree } from "../api/menu-admin-api";
import { fetchOrganizationList } from "../api/organization-api";
import { createPermission, deletePermission, fetchPermissionPage, updatePermission } from "../api/permission-api";
import { fetchRolePage } from "../api/role-api";
import { NeFormDrawer, NePage, NePanel, NeSearchPanel, NeTablePanel } from "@platform/ui";

function flattenMenus(items: MenuItem[]): Array<{ label: string; value: string }> {
  return items.flatMap((item) => [
    { label: `${item.name}${item.path ? ` (${item.path})` : ""}`, value: String(item.id) },
    ...flattenMenus(item.children ?? []),
  ]);
}

export function ButtonPermissionPage() {
  const { t } = useI18n();
  const [filterForm] = Form.useForm<{ menuId?: string; name?: string; code?: string; status?: number }>();
  const [buttonForm] = Form.useForm<ButtonMutationPayload>();
  const [permissionForm] = Form.useForm<PermissionMutationPayload>();
  const [buttons, setButtons] = useState<ButtonItem[]>([]);
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [organizations, setOrganizations] = useState<OrganizationItem[]>([]);
  const [query, setQuery] = useState({ pageNum: 1, pageSize: 10, menuId: undefined as string | undefined, name: undefined as string | undefined, code: undefined as string | undefined, status: undefined as number | undefined });
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedButton, setSelectedButton] = useState<ButtonItem | null>(null);
  const [permissions, setPermissions] = useState<PermissionItem[]>([]);
  const [buttonDrawerOpen, setButtonDrawerOpen] = useState(false);
  const [permissionDrawerOpen, setPermissionDrawerOpen] = useState(false);
  const [editingButton, setEditingButton] = useState<ButtonItem | null>(null);
  const [editingPermission, setEditingPermission] = useState<PermissionItem | null>(null);
  const [submittingButton, setSubmittingButton] = useState(false);
  const [submittingPermission, setSubmittingPermission] = useState(false);
  const initialQuery = { pageNum: 1, pageSize: 10, menuId: undefined as string | undefined, name: undefined as string | undefined, code: undefined as string | undefined, status: undefined as number | undefined };
  const menuOptions = useMemo(() => flattenMenus(menus), [menus]);
  const permissionSubjectType = Form.useWatch("subjectType", permissionForm) ?? editingPermission?.subjectType ?? "ROLE";
  const subjectOptions = useMemo(
    () =>
      permissionSubjectType === "ORG"
        ? organizations.map((item) => ({ label: `${item.name} (${item.code})`, value: item.id }))
        : roles.map((item) => ({ label: `${item.name} (${item.code})`, value: item.id })),
    [organizations, permissionSubjectType, roles],
  );

  async function loadBase() {
    const [menuResult, roleResult, orgResult] = await Promise.all([fetchMenuTree(), fetchRolePage(), fetchOrganizationList()]);
    setMenus(menuResult);
    setRoles(roleResult);
    setOrganizations(orgResult);
  }

  async function loadButtons() {
    setLoading(true);
    try {
      const result = await fetchButtonPage(query);
      setButtons(result.data);
      setTotal(result.total);
      setSelectedButton((current) => current ?? result.data[0] ?? null);
    } finally {
      setLoading(false);
    }
  }

  async function loadPermissions(buttonId: string) {
    const result = await fetchPermissionPage({ pageNum: 1, pageSize: 200, resourceType: "BUTTON", resourceId: buttonId });
    setPermissions(result.data);
  }

  useEffect(() => {
    loadBase().catch(() => undefined);
  }, []);

  useEffect(() => {
    loadButtons().catch(() => undefined);
  }, [query]);

  useEffect(() => {
    if (!selectedButton?.id) {
      setPermissions([]);
      return;
    }
    loadPermissions(selectedButton.id).catch(() => undefined);
  }, [selectedButton?.id]);

  const buttonColumns = useMemo(
    () => [
      { title: t("common.name"), dataIndex: "name" },
      { title: t("common.code"), dataIndex: "code" },
      { title: t("common.type"), dataIndex: "type", render: (value: string | undefined) => value ?? "-" },
      { title: t("common.menu"), render: (_: unknown, row: ButtonItem) => menuOptions.find((item) => item.value === row.menuId)?.label ?? row.menuId ?? "-" },
      { title: t("common.status"), render: (_: unknown, row: ButtonItem) => row.status === 1 ? <Tag color="success">{t("common.enabled")}</Tag> : <Tag color="error">{t("common.disabled")}</Tag> },
      {
        title: t("common.actions"),
        render: (_: unknown, row: ButtonItem) => (
          <Space>
            <NePermission code="platform:button:edit">
              <Button size="small" icon={<EditOutlined />} onClick={(event) => {
                event.stopPropagation();
                setEditingButton(row);
                buttonForm.setFieldsValue({ menuId: row.menuId ?? "", code: row.code, name: row.name, type: row.type, sort: row.sort, status: row.status ?? 1 });
                setButtonDrawerOpen(true);
              }}>{t("common.edit")}</Button>
            </NePermission>
            <NePermission code="platform:button:delete">
              <Popconfirm title={t("common.confirmDelete")} onConfirm={async (event) => {
                event?.stopPropagation();
                await deleteButton(row.id);
                if (selectedButton?.id === row.id) {
                  setSelectedButton(null);
                }
                await loadButtons();
              }}>
                <Button size="small" danger icon={<DeleteOutlined />}>{t("common.delete")}</Button>
              </Popconfirm>
            </NePermission>
          </Space>
        ),
      },
    ],
    [buttonForm, menuOptions, selectedButton?.id, t],
  );

  const permissionColumns = useMemo(
    () => [
      { title: t("common.subjectType"), render: (_: unknown, row: PermissionItem) => <Tag color={row.subjectType === "ORG" ? "geekblue" : "gold"}>{row.subjectType === "ORG" ? t("common.organization") : t("common.role")}</Tag> },
      {
        title: t("common.subject"),
        render: (_: unknown, row: PermissionItem) =>
          row.subjectType === "ORG"
            ? organizations.find((item) => item.id === row.subjectId)?.name ?? row.subjectId
            : roles.find((item) => item.id === row.subjectId)?.name ?? row.subjectId,
      },
      { title: t("common.effect"), render: (_: unknown, row: PermissionItem) => <Tag color={row.effect === "Allow" ? "success" : "error"}>{row.effect === "Allow" ? t("permission.allow") : t("permission.deny")}</Tag> },
      { title: t("common.scope"), dataIndex: "scope", render: (value: string | undefined) => value === "CURRENT_ROLE" ? t("permission.scope.currentRole") : value === "CURRENT_ORG" ? t("permission.scope.currentOrg") : value === "ALL" ? t("permission.scope.all") : value ?? t("permission.scope.all") },
      {
        title: t("common.actions"),
        render: (_: unknown, row: PermissionItem) => (
          <Space>
            <NePermission code="platform:button-permission:edit">
              <Button size="small" icon={<EditOutlined />} onClick={() => {
                setEditingPermission(row);
                permissionForm.setFieldsValue(row);
                setPermissionDrawerOpen(true);
              }}>{t("common.edit")}</Button>
            </NePermission>
            <NePermission code="platform:button-permission:delete">
              <Popconfirm title={t("common.confirmDelete")} onConfirm={async () => {
                await deletePermission(row.id);
                if (selectedButton?.id) {
                  await loadPermissions(selectedButton.id);
                }
              }}>
                <Button size="small" danger icon={<DeleteOutlined />}>{t("common.delete")}</Button>
              </Popconfirm>
            </NePermission>
          </Space>
        ),
      },
    ],
    [organizations, permissionForm, roles, selectedButton?.id, t],
  );

  return (
    <NePage>
      <NeSearchPanel
        title={t("common.buttonFilter")}
        labels={{ expand: t("common.expand"), collapse: t("common.collapse"), reset: t("common.reset") }}
        onReset={() => {
          filterForm.resetFields();
          setQuery(initialQuery);
        }}
      >
        <Form form={filterForm} layout="inline" initialValues={query} onFinish={(values) => setQuery((current) => ({ ...current, ...values, pageNum: 1 }))}>
          <Form.Item name="menuId" label={t("common.menu")}><Select allowClear style={{ width: 240 }} options={menuOptions} showSearch optionFilterProp="label" /></Form.Item>
          <Form.Item name="name" label={t("common.name")}><Input allowClear placeholder={t("common.button")} /></Form.Item>
          <Form.Item name="code" label={t("common.code")}><Input allowClear placeholder="crm:customer:create" /></Form.Item>
          <Form.Item name="status" label={t("common.status")}><Select allowClear style={{ width: 140 }} options={[{ label: t("common.enabled"), value: 1 }, { label: t("common.disabled"), value: 0 }]} /></Form.Item>
          <Form.Item><Button type="primary" htmlType="submit" icon={<SearchOutlined />}>{t("common.search")}</Button></Form.Item>
        </Form>
      </NeSearchPanel>
      <div className="shell-split-grid">
        <NeTablePanel
          toolbar={
            <Space>
              <NePermission code="platform:button:create">
                <Button type="primary" icon={<PlusOutlined />} onClick={() => {
                  setEditingButton(null);
                  buttonForm.setFieldsValue({ menuId: query.menuId ?? "", code: "", name: "", type: "", sort: 0, status: 1 });
                  setButtonDrawerOpen(true);
                }}>{t("common.newButton")}</Button>
              </NePermission>
              <NePermission code="platform:button-permission:create">
                <Button type="default" icon={<PlusOutlined />} disabled={!selectedButton} onClick={() => {
                  setEditingPermission(null);
                  permissionForm.setFieldsValue({ subjectType: "ROLE", resourceType: "BUTTON", resourceId: selectedButton!.id, effect: "Allow", scope: "ALL" });
                  setPermissionDrawerOpen(true);
                }}>{t("common.newGrant")}</Button>
              </NePermission>
            </Space>
          }
          summary={t("common.recordCount", undefined, { count: total })}
          pagination={<Pagination align="end" current={query.pageNum} pageSize={query.pageSize} total={total} onChange={(pageNum, pageSize) => setQuery((current) => ({ ...current, pageNum, pageSize }))} />}
        >
          <Table<ButtonItem>
            rowKey="id"
            loading={loading}
            dataSource={buttons}
            columns={buttonColumns}
            onRow={(record) => ({ onClick: () => setSelectedButton(record) })}
            pagination={false}
          />
        </NeTablePanel>
        <NePanel title={t("common.currentButton")}>
          {selectedButton ? (
            <Descriptions column={1} bordered>
              <Descriptions.Item label={t("common.name")}>{selectedButton.name}</Descriptions.Item>
              <Descriptions.Item label={t("common.code")}>{selectedButton.code}</Descriptions.Item>
              <Descriptions.Item label={t("common.type")}>{selectedButton.type ?? "-"}</Descriptions.Item>
              <Descriptions.Item label={t("common.menu")}>{menuOptions.find((item) => item.value === selectedButton.menuId)?.label ?? selectedButton.menuId ?? "-"}</Descriptions.Item>
              <Descriptions.Item label={t("common.status")}>{selectedButton.status === 1 ? t("common.enabled") : t("common.disabled")}</Descriptions.Item>
            </Descriptions>
          ) : null}
        </NePanel>
      </div>
      <NeTablePanel toolbar={t("common.buttonGrantList")} summary={t("common.recordCount", undefined, { count: permissions.length })}>
        <Table<PermissionItem> rowKey="id" dataSource={permissions} columns={permissionColumns} pagination={false} />
      </NeTablePanel>
      <NeFormDrawer title={editingButton ? t("common.editButton") : t("common.newButton")} open={buttonDrawerOpen} onClose={() => setButtonDrawerOpen(false)} onSubmit={() => buttonForm.submit()} submitting={submittingButton}>
        <Form
          form={buttonForm}
          layout="vertical"
          onFinish={async (values) => {
            setSubmittingButton(true);
            try {
              if (editingButton) {
                await updateButton(editingButton.id, values);
              } else {
                await createButton(values);
              }
              setButtonDrawerOpen(false);
              await loadButtons();
            } finally {
              setSubmittingButton(false);
            }
          }}
        >
          <Form.Item name="menuId" label={t("common.menu")} rules={[{ required: true, message: t("validation.selectField", undefined, { field: t("common.menu") }) }]}><Select options={menuOptions} showSearch optionFilterProp="label" /></Form.Item>
          <Form.Item name="name" label={t("common.name")} rules={[{ required: true, message: t("validation.enterField", undefined, { field: t("common.button") }) }]}><Input /></Form.Item>
          <Form.Item name="code" label={t("common.code")} rules={[{ required: true, message: t("validation.enterField", undefined, { field: t("common.code") }) }]}><Input /></Form.Item>
          <Form.Item name="type" label={t("common.type")}><Input placeholder={t("common.typeExample")} /></Form.Item>
          <Form.Item name="sort" label={t("common.sort")}><InputNumber min={0} style={{ width: "100%" }} /></Form.Item>
          <Form.Item name="status" label={t("common.status")}><Select options={[{ label: t("common.enabled"), value: 1 }, { label: t("common.disabled"), value: 0 }]} /></Form.Item>
        </Form>
      </NeFormDrawer>
      <NeFormDrawer title={editingPermission ? t("buttonPermission.editGrant") : t("buttonPermission.createGrant")} open={permissionDrawerOpen} onClose={() => setPermissionDrawerOpen(false)} onSubmit={() => permissionForm.submit()} submitting={submittingPermission}>
        <Form
          form={permissionForm}
          layout="vertical"
          onFinish={async (values) => {
            setSubmittingPermission(true);
            try {
              if (editingPermission) {
                await updatePermission(editingPermission.id, values);
              } else {
                await createPermission(values);
              }
              setPermissionDrawerOpen(false);
              if (selectedButton?.id) {
                await loadPermissions(selectedButton.id);
              }
            } finally {
              setSubmittingPermission(false);
            }
          }}
        >
          <Form.Item name="subjectType" label={t("common.subjectType")} rules={[{ required: true, message: t("validation.selectField", undefined, { field: t("common.subjectType") }) }]}><Select options={[{ label: t("common.role"), value: "ROLE" }, { label: t("common.organization"), value: "ORG" }]} /></Form.Item>
          <Form.Item name="subjectId" label={t("common.subject")} rules={[{ required: true, message: t("validation.selectField", undefined, { field: t("common.subject") }) }]}><Select options={subjectOptions} showSearch optionFilterProp="label" /></Form.Item>
          <Form.Item name="resourceType" initialValue="BUTTON" hidden><Select /></Form.Item>
          <Form.Item name="resourceId" label={t("common.button")} rules={[{ required: true, message: t("validation.selectField", undefined, { field: t("common.button") }) }]}><Select options={buttons.map((item) => ({ label: `${item.name} (${item.code})`, value: item.id }))} showSearch optionFilterProp="label" /></Form.Item>
          <Form.Item name="effect" label={t("common.effect")} initialValue="Allow"><Select options={[{ label: t("permission.allow"), value: "Allow" }, { label: t("permission.deny"), value: "Deny" }]} /></Form.Item>
          <Form.Item name="scope" label={t("common.scope")} initialValue="ALL"><Select options={[{ label: t("permission.scope.all"), value: "ALL" }, { label: t("permission.scope.currentRole"), value: "CURRENT_ROLE" }, { label: t("permission.scope.currentOrg"), value: "CURRENT_ORG" }]} /></Form.Item>
        </Form>
      </NeFormDrawer>
    </NePage>
  );
}
