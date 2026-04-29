# MODULE LAYER KNOWLEDGE BASE

## OVERVIEW
`src/modules` holds the main product screens rendered inside the root shell. These files behave like pages, but most of them are not direct URLs.

## STRUCTURE
```text
src/modules/
├── <business-domain>/page.tsx   # main user-facing module entry
├── openclaw/*                   # developer-only AI Ops views
├── ops-conductor/page.tsx       # orchestration cockpit
└── docs/page.tsx                # in-app operator guide
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Add a feature screen | `src/modules/<feature>/page.tsx` | Default export is the screen entry |
| Make a module reachable | `../types/index.ts`, `../app/page.tsx`, `../components/app-sidebar.tsx` | Folder alone is not enough |
| Add role gating | `../components/app-sidebar.tsx` | Groups and items carry role lists |
| Change OpenClaw developer views | `openclaw/*` | Pairs with `/api/v1/openclaw/*` |
| Change ops conductor | `ops-conductor/page.tsx` | Pairs with `/api/v1/ops/*` |
| Change product guidance/docs | `docs/page.tsx` | Large in-repo guide surface |

## CONVENTIONS
- Module IDs must stay aligned across folder name, `ViewId`, shell switch cases, and sidebar items.
- A module screen usually exports one default component from `page.tsx`.
- Many modules are intentionally large container files; only extract shared logic when it will be reused outside the module.
- Shared state, auth, API clients, and domain helpers belong in `src/stores`, `src/lib`, or `src/components`, not duplicated inside multiple modules.
- Developer-only surfaces live under `openclaw/*` and `ops-conductor/page.tsx`; those modules depend on `/api/v1/openclaw/*` and `/api/v1/ops/*`.
- `asnafpreneur` is special: it exists here as a shell module and also under `src/app/asnafpreneur`.
- `docs/page.tsx` is a real source of operator guidance; keep product docs changes close to the module behavior they describe.

## ANTI-PATTERNS
- Do not assume a new folder in `src/modules` is reachable without shell + sidebar wiring.
- Do not move shared primitive styling into modules; use `src/components/ui` or `src/components`.
- Do not change a module ID in one place only.
- Do not turn every module into a separate route segment unless the product explicitly needs a real URL boundary.
