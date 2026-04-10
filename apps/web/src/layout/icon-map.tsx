import {
  AppstoreOutlined,
  BarChartOutlined,
  ExportOutlined,
  FolderOutlined,
  HomeOutlined,
  SettingOutlined,
  TeamOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";
import type { ReactNode } from "react";

const iconMap: Record<string, ReactNode> = {
  AppstoreOutlined: <AppstoreOutlined />,
  BarChartOutlined: <BarChartOutlined />,
  ExportOutlined: <ExportOutlined />,
  FolderOutlined: <FolderOutlined />,
  HomeOutlined: <HomeOutlined />,
  SettingOutlined: <SettingOutlined />,
  TeamOutlined: <TeamOutlined />,
  UnorderedListOutlined: <UnorderedListOutlined />,
};

const localIconModules = import.meta.glob("../assets/menu-icons/**/*.{svg,png,jpg,jpeg,webp}", {
  eager: true,
  import: "default",
}) as Record<string, string>;

const localIconMap = Object.fromEntries(
  Object.entries(localIconModules).map(([path, source]) => {
    const iconName = path
      .replace("../assets/menu-icons/", "")
      .replace(/\.[^.]+$/, "")
      .split("/")
      .join("-");
    return [iconName, source];
  }),
);

function renderImageIcon(source: string, alt: string) {
  return <img src={source} width={16} height={16} alt={alt} style={{ objectFit: "contain" }} />;
}

export function getMenuIcon(icon?: string) {
  if (!icon) {
    return <AppstoreOutlined />;
  }
  const localIconSource = localIconMap[icon];
  if (localIconSource) {
    return renderImageIcon(localIconSource, `${icon} icon`);
  }
  if (icon.startsWith("http") || icon.startsWith("data:image")) {
    return renderImageIcon(icon, "menu icon");
  }
  return iconMap[icon] ?? <AppstoreOutlined />;
}
