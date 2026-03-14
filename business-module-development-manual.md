# Business Module Development Manual

This manual describes what the Nebula shell base already provides and how a business module should integrate with it.

## 1. Base Platform Capabilities

The shell already provides these platform responsibilities and pages:

- Authentication and session bootstrap
- Backend-driven menus and dynamic route assembly
- Unified shell layout with sidebar, breadcrumbs, workspace tabs, and exception handling
- Theme configuration and shared Nebula visual language
- Unified request helpers exposed through `AppContext`
- Shared storage preview and download URL helpers
- Shared `NePermission` guard and `usePermission`

Current platform pages:

- `Menu Management` -> `/menu/list`
- `Organization Management` -> `/organization/list`
- `Organization Permissions` -> `/org-permission/list`
- `Menu Permissions` -> `/menu-permission/list`
- `Button Permissions` -> `/button-permission/list`
- `System Parameters` -> `/system-param/list`
- `Notifications` -> `/notification/list`
- `Access Mapping` -> `/role-access/list`
- `Storage Center` -> `/storage/list`

## 2. Workspace Structure

- `apps/shell`: shell host, layout, auth, platform pages, runtime bootstrap
- `apps/demo-business`: example business module implementation
- `packages/core`: shell contracts, registries, routing, permission helpers, event bus
- `packages/ui`: Nebula shared UI components
- `templates/business-starter`: scaffold template for a new business module

## 3. Naming Rules

Follow `AGENTS.md` exactly:

- package directories use `kebab-case`
- source directories use `kebab-case`
- source file names use `kebab-case`
- React components and TypeScript types use `PascalCase`
- shared UI components live in independent directories under `packages/ui`

## 4. What a Business Module Should Own

Business modules should focus on:

- module-specific pages
- module-specific menu definitions
- component loader mappings
- optional bootstrap logic for module initialization
- module-local API integration and domain state

Business modules should avoid reimplementing:

- login and token handling
- layout chrome
- common page containers
- permission primitives
- storage URL resolution
- shell navigation state

## 5. Module Registration Contract

Each module exports a `PlatformModule`.

```ts
import type { PlatformModule } from "@platform/core";

const module: PlatformModule = {
  id: "@business/demo",
  name: "Demo CRM",
  version: "0.1.0",
  components: {
    "crm/CustomerList": async () => ({
      default: (await import("./pages/customer-list-page")).CustomerListPage,
    }),
  },
  menus: [
    {
      id: "crm-root",
      name: "客户管理",
      type: 1,
      visible: 1,
      children: [
        {
          id: "crm-list",
          name: "客户列表",
          type: 2,
          path: "/crm/list",
          component: "crm/CustomerList",
          linkType: 1,
          visible: 1,
        },
      ],
    },
  ],
  routes: [{ path: "/crm/list", componentKey: "crm/CustomerList" }],
};

export default module;
```

Reference files:

- `apps/demo-business/src/register.ts`
- `apps/demo-business/src/app.tsx`
- `templates/business-starter/src/register.ts`

## 6. Shared APIs from `@platform/core`

Use `useAppContext()` or the provided app context hooks to access base capabilities.

### `auth`

- `getToken()`
- `getSession()`
- `hasPermission(code)`
- `redirectToLogin()`
- `logout()`

### `dict`

- `get(key)`
- `all()`

### `config`

- `get(key)`
- `all()`

### `notifications`

- `all()`
- `unreadCount()`

### `request`

- `get(url, params)`
- `post(url, payload)`
- `put(url, payload)`
- `delete(url)`

### `storage`

- `previewUrl(file)`
- `downloadUrl(file)`

### `i18n`

- `getLocale()`
- `setLocale(locale)`
- `t(key, fallback?, variables?)`

### `bus`

- `on(event, handler)`
- `emit(event, payload)`
- `off(event, handler)`

Reference files:

- `packages/core/src/types.ts`
- `packages/core/src/app-context.tsx`
- `apps/shell/src/modules/runtime/bootstrap.ts`

## 7. NePermission Access Pattern

Use the shell permission helpers instead of manual permission branching.

```tsx
import { NePermission, usePermission } from "@platform/core";

function ExampleActions() {
  const canCreate = usePermission("crm:customer:create");

  return (
    <NePermission code="crm:customer:create">
      <button disabled={!canCreate}>Create</button>
    </NePermission>
  );
}
```

Reference files:

- `packages/core/src/ne-permission.tsx`
- `packages/core/src/use-permission.ts`
- `apps/shell/src/pages/role-access-page.tsx`

## 8. Shared UI Components from `@platform/ui`

Prefer shared UI components first:

- `NePage`
- `NePanel`
- `NeSearchPanel`
- `NeFormDrawer`
- `NeDetailDrawer`
- `NeTablePanel`
- `NeNavCards`
- `NeStatusTag`
- `NeBreadcrumbs`
- `NeWorkspaceTabs`
- `NeEmptyState`
- `NeExceptionResult`
- `NeFileCard`
- `NeFileUploader`

Each component has its own README under `packages/ui/src/<component>/README.md`.

Typical list page composition:

```tsx
import { Pagination } from "antd";
import { NePage, NeSearchPanel, NeTablePanel } from "@platform/ui";

export function CustomerListPage() {
  return (
    <NePage>
      <NeSearchPanel title="Filters" labels={{ expand: "Expand", collapse: "Collapse" }}>
        ...search form...
      </NeSearchPanel>
      <NeTablePanel
        toolbar={...table actions...}
        summary="32 records"
        pagination={<Pagination current={1} pageSize={10} total={32} />}
      >
        ...table body...
      </NeTablePanel>
    </NePage>
  );
}
```

Standard shell guidance for list pages:

- Do not repeat page title/description when workspace tabs already identify the page
- Do not add page-level refresh buttons when tab refresh is available in the workspace
- Prefer `NeSearchPanel` for top filter areas, with expand/collapse support
- Prefer `NeTablePanel` for the combined action toolbar, table body, and pagination summary region

## 9. Routing and Menus

Business routes are mounted from module metadata. The shell combines:

- backend menus
- built-in platform pages
- registered business module routes

Useful references:

- `packages/core/src/routes.tsx`
- `packages/core/src/platform-pages.ts`
- `apps/shell/src/app.tsx`

## 10. Data Fetching Pattern

For business APIs, follow the shell page pattern:

1. create a small API file under your module
2. map backend payloads into typed frontend objects
3. keep page state in the page or module-local store
4. use `NeFormDrawer` / `NeDetailDrawer` for CRUD flows

Reference files:

- `apps/shell/src/api/menu-admin-api.ts`
- `apps/shell/src/api/organization-api.ts`
- `apps/shell/src/api/button-api.ts`
- `apps/shell/src/api/permission-api.ts`

## 11. Storage Integration

The shell already aligns with the backend storage module.

Shared frontend flow:

1. create upload task
2. upload file content
3. complete upload task
4. bind upload task to business entity
5. use returned file data for preview/download

Key types and files:

- `StorageUploadPayload`
- `StorageFileItem`
- `apps/shell/src/api/storage-api.ts`
- `apps/shell/src/pages/storage-center-page.tsx`
- `packages/ui/src/ne-file-uploader/ne-file-uploader.tsx`

## 12. Recommended Development Flow for a New Module

1. scaffold from `templates/business-starter`
2. define your `PlatformModule`
3. add page components in `kebab-case` files
4. register `componentKey -> page` mappings
5. define menus and routes
6. use `@platform/ui` layout primitives
7. consume base capabilities from `@platform/core`
8. verify with `pnpm typecheck` and `pnpm build`

## 13. I18n Extension Architecture

The shell now keeps i18n in a dedicated module so future backend locale APIs can be connected without changing page components.

- Core provider primitives: `packages/core/src/i18n.tsx`
- Shell locale store: `apps/shell/src/modules/i18n/i18n-store.ts`
- Shell locale service: `apps/shell/src/modules/i18n/i18n-service.ts`
- Shell provider wrapper: `apps/shell/src/modules/i18n/shell-i18n-provider.tsx`
- Shell message catalog: `apps/shell/src/modules/i18n/shell-messages.ts`
- Future backend API adapter: `apps/shell/src/api/i18n-api.ts`

Reserved backend env vars:

- `VITE_I18N_CURRENT_LOCALE_PATH`
- `VITE_I18N_SWITCH_LOCALE_PATH`

Current behavior:

- default locale is `zh-CN`
- locale changes update shell state first
- if backend locale endpoints are configured later, the service layer is the only integration point that needs to change
- built-in platform menus are rebuilt after locale switching so base navigation can follow the active language

## 14. Example References

- sample module: `apps/demo-business/src/`
- starter template: `templates/business-starter/src/`
- shell platform pages: `apps/shell/src/pages/`
- shell runtime bootstrap: `apps/shell/src/modules/runtime/bootstrap.ts`

## 15. Verification Commands

```bash
pnpm typecheck
pnpm build
pnpm dev
pnpm dev:federation
```
