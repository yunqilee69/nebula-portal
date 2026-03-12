# Nebula Portal

Frontend monorepo for the shell-based middle-platform architecture described in `中台前端架构完整方案 (1).docx`.

## Structure

- `apps/shell`: host shell with auth, layout, dynamic menus, and module loading.
- `apps/demo-business`: sample remote business module.
- `packages/core`: shared contracts, event bus, context, registries, permission helpers.
- `packages/ui`: shared UI building blocks.
- `templates/business-starter`: starter template for new business modules.
- `scripts/create-app.mjs`: scaffolds a new remote app from the template.

## Documentation

- `business-module-development-manual.md`: business module integration guide for shell capabilities, shared APIs, shared UI, routing, permissions, and storage reuse.

## Commands

```bash
pnpm install
pnpm dev
pnpm dev:federation
pnpm typecheck
pnpm build
pnpm create-app
```

## Local Startup Modes

- `pnpm dev`: starts only `apps/shell` and uses the default embedded module mode, so the shell and demo business module are packaged together for local preview.
- `pnpm dev:federation`: starts the shell and remote apps in parallel to verify the runtime Module Federation mode.
- `pnpm dev:demo`: starts the demo business remote alone on port `3001`.

## Environment

The shell reads backend and remote settings from Vite env vars. Copy values into `.env.local` files per app if needed.

- `VITE_API_BASE_URL`: request base URL used by the browser client; defaults to empty so local development uses relative paths and the Vite dev proxy
- `VITE_BACKEND_PROXY_TARGET`: shell dev proxy target, defaults to `http://127.0.0.1:8080`
- `VITE_MODULE_MODE`: `embedded` by default for single-package startup, or `federation` to load remote modules from remote entries
- `VITE_DEMO_REMOTE_URL`: remote entry URL for the demo app
- `VITE_STORAGE_UPLOAD_TASK_PATH`: create storage upload task path, defaults to `/storage/upload-tasks`
- `VITE_STORAGE_UPLOAD_SIMPLE_PATH_TEMPLATE`: simple upload path template, defaults to `/storage/upload-tasks/{id}/simple`
- `VITE_STORAGE_UPLOAD_COMPLETE_PATH_TEMPLATE`: upload complete path template, defaults to `/storage/upload-tasks/{id}/complete`
- `VITE_STORAGE_UPLOAD_BIND_PATH_TEMPLATE`: bind uploaded file path template, defaults to `/storage/upload-tasks/{id}/bind`
- `VITE_STORAGE_FILE_PAGE_PATH`: storage file page path, defaults to `/storage/files/page`
- `VITE_STORAGE_FILE_DETAIL_PATH_TEMPLATE`: storage file detail path template, defaults to `/storage/files/{id}`
- `VITE_STORAGE_FILE_CONTENT_PATH_TEMPLATE`: storage file content path template, defaults to `/storage/files/{id}/content`
