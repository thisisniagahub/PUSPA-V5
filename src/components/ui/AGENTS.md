# UI PRIMITIVES KNOWLEDGE BASE

## OVERVIEW
`src/components/ui` is the shared primitive layer generated around shadcn/Radix patterns. Keep it reusable, style-token driven, and free of PUSPA business logic.

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Add a new primitive | `src/components/ui/*` | Follow existing shadcn file shape |
| Change token-driven styling | `../../app/globals.css` | Colors come from CSS variables |
| Change class merging | `../../lib/utils.ts` | `cn()` is the common entry point |
| Build product-level composition | `../` | App-specific wrappers belong in `src/components`, not here |

## FILE SHAPE
- Typical files export one primitive or a small primitive cluster.
- Shared ingredients are `@radix-ui/*`, `class-variance-authority`, `@/lib/utils`, and sometimes `Slot`.
- Existing files use `data-slot` attributes and shallow wrappers instead of deep abstraction stacks.

## CONVENTIONS
- Preserve local shadcn style in this subtree: double quotes, semicolons, `cva`, Radix `Slot`, and `data-slot` patterns.
- Use `@/lib/utils` for class merging instead of local helpers.
- Keep primitives generic: inputs, dialogs, cards, menus, badges, charts, and related wrappers.
- Theme values come from CSS variables with the `new-york` / neutral shadcn setup in `components.json`.
- Prefer extending existing primitives over introducing near-duplicates with slightly different branding.
- When a component needs business-specific copy, icons, or data loading, stop here and move up to `src/components`.

## ANTI-PATTERNS
- Do not import feature stores, Prisma, fetch clients, or business-specific copy into this subtree.
- Do not hardcode alternate theme systems here; change shared tokens in `globals.css` when the primitive layer needs a design adjustment.
- Do not "normalize" these files to the quote/semicolon style used elsewhere in the repo; preserve local generated style.
- Do not add one-off product wrappers here when they belong in `src/components`.

## NOTES
- `components.json` points this subtree at the `new-york` shadcn preset with neutral base color and CSS variables enabled.
- This subtree is heavily reused across the shell and large modules, so small API changes here have wide blast radius.
- Prefer additive extension over breaking prop changes unless you are ready to update many call sites in the same change.
