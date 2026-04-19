# Nebula Portal

Frontend monorepo for the Nebula web and mobile clients described in `中台前端架构完整方案 (1).docx`.

## Structure

- `apps/web`: web app entry with auth, layout, dynamic menus, and module loading.
- `apps/mobile`: mobile client entry built on the shared runtime contracts.
- `packages/core`: shared contracts, event bus, context, registries, permission helpers.
- `packages/ui`: shared web UI building blocks.
- `packages/pages-web`: shared web page layer consumed by `apps/web`.
- `packages/pages-mobile`: shared mobile page/navigation layer consumed by `apps/mobile`.

## Documentation

- `business-module-development-manual.md`: business module integration guide for web platform capabilities, shared APIs, shared UI, routing, permissions, and storage reuse.

## Commands

```bash
pnpm install
pnpm dev
pnpm typecheck
pnpm build
pnpm create-app
```

## Local Startup

- `pnpm dev`: starts `apps/web` for local preview.

## Environment

The web app reads backend settings from Vite env vars. Copy values into `.env.local` files per app if needed.

- `VITE_API_BASE_URL`: request base URL used by the browser client; defaults to empty so local development uses relative paths and the Vite dev proxy
- `VITE_BACKEND_PROXY_TARGET`: web dev proxy target, defaults to `http://127.0.0.1:8080`
- `VITE_STORAGE_UPLOAD_TASK_PATH`: create chunk upload task path, defaults to `/api/storage/upload-tasks`
- `VITE_STORAGE_UPLOAD_PATH`: simple upload path, defaults to `/api/storage/upload`
- `VITE_STORAGE_UPLOAD_COMPLETE_PATH_TEMPLATE`: chunk upload complete path template, defaults to `/api/storage/upload-tasks/{id}/complete`
- `VITE_STORAGE_UPLOAD_BIND_PATH_TEMPLATE`: bind uploaded file path template, defaults to `/api/storage/upload-tasks/{id}/bind`
- `VITE_STORAGE_FILE_PAGE_PATH`: storage file page path, defaults to `/api/storage/files/page`
- `VITE_STORAGE_FILE_DETAIL_PATH_TEMPLATE`: storage file detail path template, defaults to `/api/storage/files/{id}`
- `VITE_STORAGE_DOWNLOAD_PATH`: storage download path, defaults to `/api/storage/download`
- `VITE_STORAGE_SIGNED_DOWNLOAD_PATH`: signed storage download path, defaults to `/api/storage/download-signed`
- `VITE_STORAGE_GENERATE_SIGNED_URL_PATH`: signed download generation path, defaults to `/api/storage/generate-signed-url`
