import {
  AppstoreOutlined,
  BarChartOutlined,
  ExportOutlined,
  FolderOutlined,
  TeamOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";
import type { ReactNode } from "react";

const iconMap: Record<string, ReactNode> = {
  AppstoreOutlined: <AppstoreOutlined />,
  BarChartOutlined: <BarChartOutlined />,
  ExportOutlined: <ExportOutlined />,
  FolderOutlined: <FolderOutlined />,
  TeamOutlined: <TeamOutlined />,
  UnorderedListOutlined: <UnorderedListOutlined />,
};

export function getMenuIcon(icon?: string) {
  if (!icon) {
    return <AppstoreOutlined />;
  }
  if (icon.startsWith("http") || icon.startsWith("data:image")) {
    return <img src={icon} width={16} height={16} alt="menu icon" style={{ objectFit: "contain" }} />;
  }
  return iconMap[icon] ?? <AppstoreOutlined />;
}
