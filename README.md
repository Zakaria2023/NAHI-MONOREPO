# Nahi ERP — MVP

Monorepo for the contractor ERP covering Mobily and STC project workflows,
procurement, warehouse, custody and finance.

| App           | URL                     | Who                                    |
| ------------- | ----------------------- | -------------------------------------- |
| `apps/admin`  | http://localhost:3001   | Internal staff                         |
| `apps/client` | http://localhost:3000   | Mobily / STC reps and subcontractors   |

```bash
pnpm install
pnpm dev        # both apps
pnpm test       # business-rule tests
pnpm db:reset   # rebuild the demo data
```

No database and no auth provider yet — see CLAUDE.md, "Data store" and "Auth".
