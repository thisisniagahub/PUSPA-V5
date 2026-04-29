# API SURFACE KNOWLEDGE BASE

## OVERVIEW
`src/app/api` is the real HTTP surface. `/api/route.ts` is a trivial placeholder; application behavior lives under `/api/auth/[...nextauth]` and `/api/v1/*`.

## STRUCTURE
```text
src/app/api/
├── route.ts                 # placeholder root response
├── auth/[...nextauth]/      # credentials auth + rate limiting
└── v1/                      # domain routes: donors, ops, tapsecure, upload, volunteers, ...
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Change login/auth flow | `auth/[...nextauth]/route.ts`, `../../lib/auth.ts` | Node runtime + rate limiting |
| Add business endpoints | `v1/<domain>/route.ts` | Keep versioning explicit |
| Add upload handling | `v1/upload/*` | Existing upload routes already pin `runtime = 'nodejs'` |
| Change OpenClaw bridge behavior | `v1/openclaw/*`, `../../lib/openclaw.ts` | Preserve graceful fallback payloads |
| Change ops orchestration APIs | `v1/ops/*` | Used by `src/modules/ops-conductor/page.tsx` |

## CONVENTIONS
- New app endpoints go under `v1`; do not grow `route.ts` at the API root.
- Response shape is typically JSON with `success`, plus `data`, `error`, or pagination metadata.
- Request validation uses Zod when bodies are non-trivial; copy that pattern instead of hand-rolling checks.
- Prisma access goes through `@/lib/db`.
- Auth-sensitive endpoints should rely on server session / role helpers from `@/lib/auth`, not client-supplied role fields.
- Auth and upload handlers pin Node runtime explicitly when they need it.
- OpenClaw endpoints favor resilient fallback responses instead of hard failures when the bridge is offline.

## ANTI-PATTERNS
- Do not put new business handlers in `/api/route.ts`.
- Do not trust client state for authorization or role decisions.
- Do not remove auth rate limiting or its response headers from the credentials POST flow.
- Do not hardcode bridge or gateway URLs in multiple handlers; use env/default constants.
- Do not mix unrelated domain groups into a single route file just because the path is adjacent.
