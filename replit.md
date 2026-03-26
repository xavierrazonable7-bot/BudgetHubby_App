# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   └── api-server/         # Express API server
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts (single workspace package)
│   └── src/                # Individual .ts scripts, run via `pnpm --filter @workspace/scripts run <script>`
├── pnpm-workspace.yaml     # pnpm workspace (artifacts/*, lib/*, lib/integrations/*, scripts)
├── tsconfig.base.json      # Shared TS options (composite, bundler resolution, es2022)
├── tsconfig.json           # Root TS project references
└── package.json            # Root package with hoisted devDeps
```

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references. This means:

- **Always typecheck from the root** — run `pnpm run typecheck` (which runs `tsc --build --emitDeclarationOnly`). This builds the full dependency graph so that cross-package imports resolve correctly. Running `tsc` inside a single package will fail if its dependencies haven't been built yet.
- **`emitDeclarationOnly`** — we only emit `.d.ts` files during typecheck; actual JS bundling is handled by esbuild/tsx/vite...etc, not `tsc`.
- **Project references** — when package A depends on package B, A's `tsconfig.json` must list B in its `references` array. `tsc --build` uses this to determine build order and skip up-to-date packages.

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages that define it
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references

## Packages

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server. Routes live in `src/routes/` and use `@workspace/api-zod` for request and response validation and `@workspace/db` for persistence.

- Entry: `src/index.ts` — reads `PORT`, starts Express
- App setup: `src/app.ts` — mounts CORS, JSON/urlencoded parsing, routes at `/api`
- Routes: `src/routes/index.ts` mounts sub-routers; `src/routes/health.ts` exposes `GET /health` (full path: `/api/health`)
- Depends on: `@workspace/db`, `@workspace/api-zod`
- `pnpm --filter @workspace/api-server run dev` — run the dev server
- `pnpm --filter @workspace/api-server run build` — production esbuild bundle (`dist/index.cjs`)
- Build bundles an allowlist of deps (express, cors, pg, drizzle-orm, zod, etc.) and externalizes the rest

### `lib/db` (`@workspace/db`)

Database layer using Drizzle ORM with PostgreSQL. Exports a Drizzle client instance and schema models.

- `src/index.ts` — creates a `Pool` + Drizzle instance, exports schema
- `src/schema/index.ts` — barrel re-export of all models
- `src/schema/<modelname>.ts` — table definitions with `drizzle-zod` insert schemas (no models definitions exist right now)
- `drizzle.config.ts` — Drizzle Kit config (requires `DATABASE_URL`, automatically provided by Replit)
- Exports: `.` (pool, db, schema), `./schema` (schema only)

Production migrations are handled by Replit when publishing. In development, we just use `pnpm --filter @workspace/db run push`, and we fallback to `pnpm --filter @workspace/db run push-force`.

### `lib/api-spec` (`@workspace/api-spec`)

Owns the OpenAPI 3.1 spec (`openapi.yaml`) and the Orval config (`orval.config.ts`). Running codegen produces output into two sibling packages:

1. `lib/api-client-react/src/generated/` — React Query hooks + fetch client
2. `lib/api-zod/src/generated/` — Zod schemas

Run codegen: `pnpm --filter @workspace/api-spec run codegen`

### `lib/api-zod` (`@workspace/api-zod`)

Generated Zod schemas from the OpenAPI spec (e.g. `HealthCheckResponse`). Used by `api-server` for response validation.

### `lib/api-client-react` (`@workspace/api-client-react`)

Generated React Query hooks and fetch client from the OpenAPI spec (e.g. `useHealthCheck`, `healthCheck`).

### `scripts` (`@workspace/scripts`)

Utility scripts package. Each script is a `.ts` file in `src/` with a corresponding npm script in `package.json`. Run scripts via `pnpm --filter @workspace/scripts run <script>`. Scripts can import any workspace package (e.g., `@workspace/db`) by adding it as a dependency in `scripts/package.json`.

### `artifacts/mobile` (`@workspace/mobile`)

Expo React Native mobile app — **BudgetBuddy**. Philippine Peso budget tracker for students and teachers.

**Features**: wallet management (Cash, GCash, Maya, Bank, custom), income/expense tracking, debt/utang tracker, insights with pie charts, offline AI chat assistant, dark/light mode (default dark).

**Design system**: Neumorphic dark UI — primary `#E05A6D`, income `#2DD4BF`, expense `#E05A6D`, bg dark `#0E0E0E`. LinearGradient backgrounds on all screens (`ScreenWrapper`). Glow shadows on cards/icons/buttons.

**Key files**:
- `app/(tabs)/index.tsx` — Home (balance hero, spending card, quick actions, wallet chips, recent activity)
- `app/(tabs)/transactions.tsx` — Transactions (filter tabs, grouped by date, neumorphic cards)
- `app/(tabs)/wallets.tsx` — Wallets (gradient total card, per-wallet balance bars)
- `app/(tabs)/debts.tsx` — Debts/Utang tracker (lent/borrowed toggle, gradient cards)
- `app/(tabs)/insights.tsx` — Analytics (pie chart, category breakdown, smart insights)
- `app/(tabs)/assistant.tsx` — AI chat (offline response engine, indigo #6366F1 theme)
- `app/onboarding.tsx` — Onboarding (gradient logo, feature cards, name input)
- `app/add-transaction.tsx` — Add income/expense modal
- `app/add-debt.tsx` — Record debt modal
- `app/add-wallet.tsx` — Create wallet modal
- `app/transaction-detail.tsx` — Transaction detail/delete
- `context/AppContext.tsx` — Global state (AsyncStorage)
- `context/NotificationContext.tsx` — Notification system (in-app + device push)
- `context/ThemeContext.tsx` — Dark/light theme (default dark)
- `app/notifications.tsx` — Full-page notifications screen with settings
- `constants/colors.ts` — Color palette
- `components/ScreenWrapper.tsx` — 3-stop gradient background wrapper
- `components/ui/` — Button (LinearGradient glow), Input (focus glow), AmountInput (accent bar + 42px display), Card, CategoryPicker, EmptyState, WalletPicker
- `utils/format.ts` — formatCurrency (₱), generateId, date helpers
- `utils/categories.ts` — getCategoryColor, getCategoryIcon, getCategoryLabel

**Important conventions**:
- Never use `uuid` — use `generateId()` from utils/format.ts
- Web: `paddingTop 67` web-only guard with `Platform.OS === "web"`
- `expo-linear-gradient` installed; `react-native-chart-kit` in devDependencies
- Inter font family: 400/500/600/700 loaded in `_layout.tsx`
- AsyncStorage only (no backend); STORAGE_KEYS in utils/storage.ts
