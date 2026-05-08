# AGENTS.md

## Frontend Naming Convention

This naming convention follows industry best practices from [shadcn/ui](https://github.com/shadcn-ui/ui), [Next.js](https://nextjs.org), and [Feature-Sliced Design](https://feature-sliced.design). The pattern of `kebab-case` files with `PascalCase` exports is widely adopted in modern frontend projects for cross-platform compatibility, URL-friendliness, and CLI tooling convenience.

### File and Directory Naming

| Type | Convention | Example |
|------|------------|---------|
| Package directories | `kebab-case` | `ui-web`, `pages-web` |
| Source directories | `kebab-case` | `components/`, `features/auth/` |
| Source files | `kebab-case` | `ne-page.tsx`, `auth-store.ts` |
| React component exports | `PascalCase` | `NePage`, `AuthStore` |
| TypeScript type names | `PascalCase` | `NePageProps`, `AuthState` |
| Global style files | `lowercase` or `kebab-case` | `global.css`, `nebula.css` |
| CSS Modules | `kebab-case` + `.module.css` | `button.module.css` |

### Identifier Naming

| Type | Convention | Example |
|------|------------|---------|
| Constants | `UPPER_SNAKE_CASE` | `API_BASE_URL`, `MAX_RETRIES` |
| Functions/Methods | `camelCase` | `fetchData()`, `handleSubmit()` |
| Variables/Properties | `camelCase` | `userId`, `isLoading` |
| Boolean variables | `is/has/can` prefix | `isVisible`, `hasPermission`, `canEdit` |
| Event handlers | `handle` prefix | `handleClick()`, `handleFormSubmit()` |
| Hooks | `use` prefix | `useAuth`, `useTheme` |

## Current Project Rule

### Shared UI Components (`packages/ui-web`)

- Each shared component must use an independent directory
- Component directory names must use `kebab-case` with `ne-` prefix: `ne-page/`, `ne-form-drawer/`, `ne-table/`
- Each component directory must contain:
  - Component implementation file (same name as directory): `ne-page.tsx`
  - `README.md` documenting usage and props
  - Optional: `index.ts` for clean exports
- Exported component identifiers use `PascalCase`: `NePage`, `NeFormDrawer`
- Example structure:
  ```
  packages/ui-web/src/
  ├── ne-page/
  │   ├── ne-page.tsx       # export NePage
  │   ├── README.md
  │   └── index.ts          # optional barrel export
  ├── ne-form-drawer/
  │   ├── ne-form-drawer.tsx
  │   └── README.md
  ```

### Business Modules (`apps/*/src/modules`)

- Each business capability keeps an independent `kebab-case` module directory: `auth/`, `runtime/`, `theme/`
- All module files use `kebab-case`: `auth-store.ts`, `theme-config.ts`, `notification-panel.tsx`
- Module directory may contain:
  - State management: `xxx-store.ts`
  - Configuration: `xxx-config.ts`
  - UI components: `xxx-panel.tsx`
  - Helper utilities: `xxx-helpers.ts`

### Page Routing Convention (URL-to-File Mapping)

Pages follow a file-system routing pattern similar to [Next.js App Router](https://nextjs.org/docs/app):

- **Route Root**: `pages/` directory is the root for all page routes
- **URL Mapping**: Each URL segment maps to one directory segment
- **Page Entry**: The leaf `index.tsx` file defines the page component

| URL Path | Recommended File Path | Alternative |
|----------|----------------------|-------------|
| `/dashboard` | `pages/dashboard/index.tsx` | - |
| `/menu/list` | `pages/menu/list/index.tsx` | - |
| `/param/config` | `pages/param/config/index.tsx` | `pages/param/config.tsx` (flat) |
| `/user/profile/edit` | `pages/user/profile/edit/index.tsx` | - |

**Recommended Pattern** (directory with `index.tsx`):

```
pages/
├── dashboard/
│   ├── index.tsx           # Page component for /dashboard
│   ├── dashboard-header.tsx # Helper component (only used here)
│   └── dashboard.module.css # Page-specific styles
├── menu/
│   ├── list/
│   │   ├── index.tsx       # Page component for /menu/list
│   │   └── menu-item.tsx   # Helper component
│   └── create/
│   │   └── index.tsx       # Page component for /menu/create
├── param/
│   ├── config/
│   │   ├── index.tsx       # Page component for /param/config
│   │   ├── config-api.ts   # Page-specific API calls
│   │   └── config.types.ts # Page-specific types
```

**Why directory wrapping is recommended**:
- Allows co-locating page-specific CSS, helper components, and API files
- Cleaner imports: `import { DashboardPage } from '@/pages/dashboard'`
- Easier refactoring: move entire directory without breaking references

### Dynamic Route Parameters

For dynamic route segments (e.g., `/user/:id`), use the following patterns:

| URL Pattern | File Path |
|-------------|-----------|
| `/user/:id` | `pages/user/[id]/index.tsx` or `pages/user/$id/index.tsx` |
| `/product/:category/:id` | `pages/product/[category]/[id]/index.tsx` |

### Route Configuration Registration

All route definitions must be centralized in the `routes/` directory for easier debugging and maintenance:

- **Root Registration**: `routes/index.ts` aggregates all route configurations from sub-modules
- **Module Routes**: Each business module exports its route config via `routes/模块/index.ts`
- **Benefits**: Single source of truth, easier route conflict detection, simplified debugging

**Directory Structure**:

```
routes/
├── index.ts                # Root: aggregates all module routes
├── dashboard/
│   └── index.ts            # Dashboard module route config
├── menu/
│   └── index.ts            # Menu module route config (includes list, create)
├── param/
│   └── index.ts            # Param module route config (includes config, dict, oauth2)
└── user/
    └── index.ts            # User module route config
```

**Module Route Config Example** (`routes/menu/index.ts`):

```typescript
// routes/menu/index.ts
import { RouteConfig } from '@/core/routing/types';
import MenuListPage from '@/pages/menu/list';
import MenuCreatePage from '@/pages/menu/create';

export const menuRoutes: RouteConfig[] = [
  {
    path: '/menu/list',
    element: <MenuListPage />,
    title: '菜单列表',
    permissions: ['menu:view'],
  },
  {
    path: '/menu/create',
    element: <MenuCreatePage />,
    title: '创建菜单',
    permissions: ['menu:create'],
  },
];
```

**Root Registration** (`routes/index.ts`):

```typescript
// routes/index.ts
import { dashboardRoutes } from './dashboard';
import { menuRoutes } from './menu';
import { paramRoutes } from './param';
import { userRoutes } from './user';

export const allRoutes = [
  ...dashboardRoutes,
  ...menuRoutes,
  ...paramRoutes,
  ...userRoutes,
];
```

**Why centralized registration**:
- Easy to locate all routes when debugging navigation issues
- Prevents route path conflicts (same path defined in multiple places)
- Simplifies permission checking at route level
- Clear ownership: each module owns its route config

### Shared Entry Files

Conventional runtime-only entry files may remain as-is:
- `index.ts` (package entry points)
- `main.tsx` (app entry)
- `register.ts` (module registration)

## Execution Note

- For existing legacy files that do not yet follow this rule, prefer the above convention for all new files and all files touched during refactors
- When refactoring, rename files first, then update imports systematically
- Use ESLint rules to enforce naming conventions (see below)

## ESLint Enforcement (Recommended)

Add the following rules to `.eslintrc.js` to enforce naming conventions:

```javascript
'check-file/filename-naming-convention': [
  'error',
  {
    '**/*.{ts,tsx}': 'KEBAB_CASE',
  },
  { ignoreMiddleExtensions: true },
],
'check-file/folder-naming-convention': [
  'error',
  {
    'src/**/!(__tests__|__mocks__)': 'KEBAB_CASE',
  },
],
```
