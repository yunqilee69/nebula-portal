export interface PlatformPageDefinition {
  id: string;
  title: string;
  titleKey?: string;
  description: string;
  descriptionKey?: string;
  path: string;
  menuName: string;
  menuNameKey?: string;
  componentKey: string;
  sort: number;
}

export const platformPageDefinitions: PlatformPageDefinition[] = [];
