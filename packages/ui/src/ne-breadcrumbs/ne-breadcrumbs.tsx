import { Breadcrumb } from "antd";

export interface NeBreadcrumbItem {
  key: string;
  title: string;
  href?: string;
}

export interface NeBreadcrumbsProps {
  items: NeBreadcrumbItem[];
}

export function NeBreadcrumbs({ items }: NeBreadcrumbsProps) {
  if (items.length === 0) {
    return null;
  }

  return <Breadcrumb className="ne-breadcrumbs" items={items.map((item) => ({ key: item.key, title: item.title, href: item.href }))} />;
}
