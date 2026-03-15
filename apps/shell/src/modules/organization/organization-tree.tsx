import { ApartmentOutlined, BankOutlined, TeamOutlined } from "@ant-design/icons";
import { Space, Typography } from "antd";
import type { OrganizationTreeItem } from "@platform/core";
import { useI18n } from "@platform/core";
import { NeTree } from "@platform/ui";
import { useEffect, useMemo, useState } from "react";
import type { Key } from "react";

type OrganizationType = NonNullable<OrganizationTreeItem["type"]>;

interface OrganizationTreeProps {
  className?: string;
  treeClassName?: string;
  data: OrganizationTreeItem[];
  mode?: "single" | "multiple";
  selectedIds?: string[];
  checkedIds?: string[];
  searchPlaceholder: string;
  onSelectIdsChange?: (ids: string[]) => void;
  onCheckIdsChange?: (ids: string[]) => void;
}

function getOrganizationTypeLabel(type: OrganizationType | undefined, t: (key: string, fallback?: string, variables?: Record<string, string | number>) => string) {
  if (type === "DEPARTMENT") {
    return t("organization.typeDepartment");
  }
  if (type === "TEAM") {
    return t("organization.typeTeam");
  }
  return t("organization.typeCompany");
}

function getOrganizationIcon(type: OrganizationTreeItem["type"]) {
  if (type === "COMPANY") {
    return <BankOutlined />;
  }
  if (type === "DEPARTMENT") {
    return <ApartmentOutlined />;
  }
  return <TeamOutlined />;
}

function renderHighlightedText(text: string | undefined, keyword: string) {
  if (!text) {
    return "-";
  }

  const normalizedKeyword = keyword.trim().toLowerCase();
  if (!normalizedKeyword) {
    return text;
  }

  const normalizedText = text.toLowerCase();
  const matchIndex = normalizedText.indexOf(normalizedKeyword);
  if (matchIndex < 0) {
    return text;
  }

  const start = text.slice(0, matchIndex);
  const match = text.slice(matchIndex, matchIndex + keyword.trim().length);
  const end = text.slice(matchIndex + keyword.trim().length);

  return (
    <>
      {start}
      <mark className="organization-tree__highlight">{match}</mark>
      {end}
    </>
  );
}

function filterOrganizationTree(nodes: OrganizationTreeItem[], keyword: string): OrganizationTreeItem[] {
  if (!keyword.trim()) {
    return nodes;
  }

  const normalized = keyword.trim().toLowerCase();
  return nodes.flatMap((node) => {
    const children = filterOrganizationTree(node.children ?? [], keyword);
    const matched = [node.name, node.code, node.leader].some((value) => value?.toLowerCase().includes(normalized));
    if (!matched && children.length === 0) {
      return [];
    }
    return [{ ...node, children }];
  });
}

function collectExpandedKeys(nodes: OrganizationTreeItem[]): Key[] {
  return nodes.flatMap((node) => {
    if (!node.children?.length) {
      return [];
    }
    return [node.id, ...collectExpandedKeys(node.children)];
  });
}

export function OrganizationTree(props: OrganizationTreeProps) {
  const { className, treeClassName, data, mode = "single", selectedIds = [], checkedIds = [], searchPlaceholder, onSelectIdsChange, onCheckIdsChange } = props;
  const { t } = useI18n();
  const [keyword, setKeyword] = useState("");
  const initialExpandedKeys = useMemo(() => collectExpandedKeys(data), [data]);
  const [expandedKeys, setExpandedKeys] = useState<Key[]>([]);

  useEffect(() => {
    setExpandedKeys(initialExpandedKeys);
  }, [initialExpandedKeys]);

  return (
    <NeTree<OrganizationTreeItem>
      className={["organization-tree", className, treeClassName].filter(Boolean).join(" ")}
      treeData={data}
      expandedKeys={expandedKeys}
      onExpand={(keys) => setExpandedKeys(keys)}
      searchable
      searchValue={keyword}
      onSearchChange={setKeyword}
      searchPlaceholder={searchPlaceholder}
      filterNode={filterOrganizationTreeNode}
      renderTitle={(node) => (
        <div className="organization-tree__node">
          <Space size={8} className="organization-tree__node-main">
            <span className="organization-tree__node-icon">{getOrganizationIcon(node.type)}</span>
            <div className="organization-tree__node-copy">
              <Typography.Text strong>{renderHighlightedText(node.name, keyword)}</Typography.Text>
              <Typography.Text type="secondary" className="organization-tree__node-meta">
                {getOrganizationTypeLabel(node.type, t)}
              </Typography.Text>
            </div>
          </Space>
          <Typography.Text type="secondary" className="organization-tree__node-code">
            {renderHighlightedText(node.code, keyword)}
          </Typography.Text>
        </div>
      )}
      checkable={mode === "multiple"}
      selectable={mode === "single"}
      selectedKeys={mode === "single" ? selectedIds : undefined}
      checkedKeys={mode === "multiple" ? checkedIds : undefined}
      onSelect={(keys, info) => {
        if (mode !== "single") {
          return;
        }
        const clickedId = String(info.node.key);
        if (selectedIds[0] === clickedId) {
          onSelectIdsChange?.([]);
          return;
        }
        onSelectIdsChange?.(keys.map(String));
      }}
      onCheck={(nextCheckedKeys) => {
        if (mode !== "multiple") {
          return;
        }
        onCheckIdsChange?.((Array.isArray(nextCheckedKeys) ? nextCheckedKeys : nextCheckedKeys.checked).map(String));
      }}
      emptyText={t("common.noData")}
    />
  );
}

function filterOrganizationTreeNode(node: OrganizationTreeItem, keyword: string) {
  const normalized = keyword.trim().toLowerCase();
  return [node.name, node.code, node.leader].some((value) => value?.toLowerCase().includes(normalized));
}
