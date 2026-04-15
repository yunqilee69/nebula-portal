import React from "react";

export interface NebulaNavigatorOptions {
  extraScreens?: Array<{ name: string; component: React.ComponentType }>;
  overrides?: Record<string, React.ComponentType>;
}

export function NebulaNavigator(options?: NebulaNavigatorOptions) {
  void options;
  return null;
}
