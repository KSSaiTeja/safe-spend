# Graph Report - safe-spend-october  (2026-09-01)

## Corpus Check
- 31 files · ~7,854 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 249 nodes · 382 edges · 17 communities (13 shown, 4 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `6083200b`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- cn
- safe-spend-app.tsx
- compilerOptions
- components.json
- dependencies
- devDependencies
- finance.ts
- dialog.tsx
- package.json
- layout.tsx
- README.md
- AGENTS.md
- eslint.config.mjs
- next.config.ts
- postcss.config.mjs

## God Nodes (most connected - your core abstractions)
1. `cn()` - 71 edges
2. `compilerOptions` - 16 edges
3. `SafeSpendApp()` - 10 edges
4. `generateMonthPreviews()` - 10 edges
5. `include` - 7 edges
6. `tailwind` - 6 edges
7. `aliases` - 6 edges
8. `scripts` - 6 edges
9. `Button()` - 6 edges
10. `calculateMonthlyPlan()` - 6 edges

## Surprising Connections (you probably didn't know these)
- `StatusBadge()` --calls--> `cn()`  [EXTRACTED]
  src/components/safe-spend-app.tsx → src/lib/utils.ts
- `ForecastBadge()` --calls--> `cn()`  [EXTRACTED]
  src/components/safe-spend-app.tsx → src/lib/utils.ts
- `MetricCard()` --calls--> `cn()`  [EXTRACTED]
  src/components/safe-spend-app.tsx → src/lib/utils.ts
- `AlertAction()` --calls--> `cn()`  [EXTRACTED]
  src/components/ui/alert.tsx → src/lib/utils.ts
- `DialogOverlay()` --calls--> `cn()`  [EXTRACTED]
  src/components/ui/dialog.tsx → src/lib/utils.ts

## Import Cycles
- None detected.

## Communities (17 total, 4 thin omitted)

### Community 0 - "cn"
Cohesion: 0.09
Nodes (32): Card(), CardAction(), CardContent(), CardDescription(), CardFooter(), CardHeader(), CardTitle(), Select() (+24 more)

### Community 1 - "safe-spend-app.tsx"
Cohesion: 0.09
Nodes (26): ForecastBadge(), loadEntries(), loadIncomeStatus(), MetricCard(), paymentMethods, StatusBadge(), usePersistedEntries(), usePersistedIncomeStatus() (+18 more)

### Community 2 - "compilerOptions"
Cohesion: 0.07
Nodes (28): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+20 more)

### Community 3 - "components.json"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 4 - "dependencies"
Cohesion: 0.10
Nodes (21): class-variance-authority, clsx, lucide-react, next, dependencies, class-variance-authority, clsx, lucide-react (+13 more)

### Community 5 - "devDependencies"
Cohesion: 0.10
Nodes (21): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node (+13 more)

### Community 6 - "finance.ts"
Cohesion: 0.09
Nodes (29): getSeptemberDay(), SafeSpendApp(), addMonths(), calculateMonthlyPlan(), calculateSafeSpendPace(), CreditCard, Emi, EmiDirection (+21 more)

### Community 7 - "dialog.tsx"
Cohesion: 0.16
Nodes (8): Button(), buttonVariants, DialogContent(), DialogDescription(), DialogFooter(), DialogHeader(), DialogOverlay(), DialogTitle()

### Community 8 - "package.json"
Cohesion: 0.20
Nodes (9): name, private, scripts, build, dev, lint, start, test (+1 more)

### Community 9 - "layout.tsx"
Cohesion: 0.33
Nodes (4): geistMono, geistSans, metadata, viewport

### Community 10 - "README.md"
Cohesion: 0.50
Nodes (3): Deploy on Vercel, Getting Started, Learn More

## Knowledge Gaps
- **96 isolated node(s):** `$schema`, `style`, `rsc`, `tsx`, `config` (+91 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `cn` to `safe-spend-app.tsx`, `dialog.tsx`?**
  _High betweenness centrality (0.123) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `package.json`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `devDependencies` to `package.json`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **What connects `$schema`, `style`, `rsc` to the rest of the system?**
  _96 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `cn` be split into smaller, more focused modules?**
  _Cohesion score 0.08717948717948718 - nodes in this community are weakly interconnected._
- **Should `safe-spend-app.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08636977058029689 - nodes in this community are weakly interconnected._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.06896551724137931 - nodes in this community are weakly interconnected._