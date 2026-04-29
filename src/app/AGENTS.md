# APP ROUTER KNOWLEDGE BASE

## OVERVIEW
`src/app` is a thin App Router layer: `/` is the authenticated shell, `/login` handles credentials, `/asnafpreneur` is the only extra real page route, and `/api/*` hosts HTTP handlers.

## STRUCTURE
```text
src/app/
├── layout.tsx          # global fonts + providers
├── page.tsx            # authenticated shell and module switcher
├── login/page.tsx      # credentials login UI
├── asnafpreneur/page.tsx
└── api/                # auth route, placeholder root API, v1 endpoints
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Change global providers or fonts | `layout.tsx` | Keep it thin; no feature logic |
| Change shell rendering | `page.tsx` | Dynamic imports, `viewLabels`, `ViewRenderer` |
| Add a new internal screen | `page.tsx` plus `src/modules/*` | Most screens do not become routes |
| Change login UX | `login/page.tsx` | Credentials flow only |
| Change route protection | `../proxy.ts`, `../lib/auth.ts` | Protection is not owned solely here |

## CONVENTIONS
- `page.tsx` is a SPA-like shell inside App Router; it reads `currentView` from Zustand and renders modules dynamically.
- New internal features usually belong in `src/modules/*`, not as new `src/app/<segment>/page.tsx`.
- If a module becomes selectable from the shell, update `ViewId`, `viewLabels`, dynamic imports, `ViewRenderer`, and the sidebar config together.
- `layout.tsx` owns `AuthProvider` and `ThemeProvider`; keep page-specific state out of it.
- `page.tsx` redirects unauthenticated users to `/login`; do not duplicate auth gating ad hoc in module files.
- `asnafpreneur` is special because it exists both as a dedicated route and as a shell view.

## ANTI-PATTERNS
- Do not add a filesystem route when the feature is supposed to live behind sidebar navigation.
- Do not bury feature-specific API calls or business rules in `layout.tsx`.
- Do not treat `src/proxy.ts.bak` or deleted `src/middleware.ts` as the active route guard.
- Do not rename module IDs in `page.tsx` without updating `src/types/index.ts` and `src/components/app-sidebar.tsx`.
