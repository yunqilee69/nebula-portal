# AGENTS.md

## Frontend Naming Convention

- Frontend package directories use `kebab-case`
- Frontend source directories use `kebab-case`
- Frontend source file names use `kebab-case`
- React component names and TypeScript type names use `PascalCase`
- Global style files use lowercase or `kebab-case`, such as `global.css` and `nebula.css`
- CSS Modules use `kebab-case` with the `.module.css` suffix

## Current Project Rule

- In `packages/ui`, each shared component must use an independent directory
- Each component directory must contain the component implementation file and a `README.md`
- Component directory names must use `kebab-case`, such as `ne-page` and `ne-form-drawer`
- Component implementation file names must use `kebab-case`, such as `ne-page.tsx` and `ne-form-drawer.tsx`
- Exported component identifiers remain `PascalCase`, such as `NePage` and `NeFormDrawer`
- In `apps/shell/src/modules`, each business capability keeps an independent lower-case module directory, such as `auth`, `runtime`, and `theme`
- Files inside `apps/shell/src/modules` must continue using `kebab-case`, such as `auth-store.ts`, `theme-config.ts`, and `notification-panel.tsx`
- Shared runtime-only entry files that are conventional and already standardized, such as `index.ts`, `main.tsx`, and `register.ts`, may remain as-is

## Execution Note

- For existing legacy files that do not yet follow this rule, prefer the above convention for all new files and all files touched during refactors
