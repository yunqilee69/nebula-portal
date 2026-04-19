import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useLocation, useOutlet } from "react-router-dom";
import { useNavigationStore } from "@nebula/core";

function buildRouteKey(pathname: string, search: string, hash: string) {
  return `${pathname}${search}${hash}`;
}

export function CachedOutlet() {
  const location = useLocation();
  const outlet = useOutlet();
  const tabs = useNavigationStore((state) => state.tabs);
  const refreshKeys = useNavigationStore((state) => state.refreshKeys);
  const [cache, setCache] = useState<Record<string, ReactNode>>({});

  const currentPath = useMemo(() => buildRouteKey(location.pathname, location.search, location.hash), [location.hash, location.pathname, location.search]);
  const currentRefreshKey = refreshKeys[currentPath] ?? 0;
  const currentNode = useMemo(() => <div key={`${currentPath}:${currentRefreshKey}`} className="shell-content-route">{outlet}</div>, [currentPath, currentRefreshKey, outlet]);

  useEffect(() => {
    setCache((previous) => {
      const next: Record<string, ReactNode> = {};

      for (const tab of tabs) {
        if (tab.path === currentPath) {
          next[tab.path] = currentNode;
          continue;
        }

        if (previous[tab.path]) {
          next[tab.path] = previous[tab.path];
        }
      }

      if (!tabs.some((tab) => tab.path === currentPath)) {
        next[currentPath] = currentNode;
      }

      return next;
    });
  }, [currentNode, currentPath, tabs]);

  const orderedPaths = useMemo(() => {
    const nextPaths = tabs.map((tab) => tab.path);

    if (!nextPaths.includes(currentPath)) {
      nextPaths.push(currentPath);
    }

    return nextPaths;
  }, [currentPath, tabs]);

  return (
    <div className="shell-content-stack">
      {orderedPaths.map((path) => {
        const node = cache[path] ?? (path === currentPath ? currentNode : null);

        if (!node) {
          return null;
        }

        return (
          <section key={path} className="nebula-content-stack__item" style={{ display: path === currentPath ? "block" : "none" }}>
            {node}
          </section>
        );
      })}
    </div>
  );
}
