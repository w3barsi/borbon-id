<!-- intent-skills:start -->
## Skill Loading

Before editing files for a substantial task:
- Run `pnpm dlx @tanstack/intent@latest list` from the workspace root to see available local skills.
- If a listed skill matches the task, run `pnpm dlx @tanstack/intent@latest load <package>#<skill>` before changing files.
- Use the loaded `SKILL.md` guidance while making the change.
- Monorepos: when working across packages, run the skill check from the workspace root and prefer the local skill for the package being changed.
- Multiple matches: prefer the most specific local skill for the package or concern you are changing; load additional skills only when the task spans multiple packages or concerns.
<!-- intent-skills:end -->

# Repository Guide

## Tooling and verification

- Use pnpm; the repository pins `pnpm@9.10.0` and has only a `pnpm-lock.yaml`.
- Run `pnpm lint`, `pnpm exec tsc --noEmit`, then `pnpm build` for full verification. There is no test suite or `typecheck` script.
- `pnpm lint` currently succeeds with existing warnings. Do not treat unrelated warnings as regressions.
- Format touched files with `pnpm exec prettier --write <files>`. A repository-wide Prettier check currently fails on existing files and repeatedly warns that `importOrderCaseSensitive` is unknown, so do not bulk-format as incidental cleanup.
- The React Compiler is enabled in both `next.config.js` and ESLint. Avoid adding manual memoization solely as a default optimization.

## Environment

- `src/env.js` is the source of truth, not `.env.example`: the example still names obsolete `DATABASE_URL` and omits required Turso variables.
- Local runtime needs `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, the four Pusher keys in `src/env.js`, Clerk's `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`, and `UPLOADTHING_TOKEN`. Local `.env` also sets Clerk sign-in/sign-up URLs.
- `next.config.js` validates `src/env.js` during `dev` and `build`. `SKIP_ENV_VALIDATION=1` bypasses only that schema validation; it does not make Clerk, Turso, Pusher, or UploadThing functionality available.

## Architecture and authorization

- This is one Next.js App Router app. `/` is the authenticated student workflow; `/admin` is a separate administrative view. Both server-prefetch `student.getStudents` and hydrate the client tRPC cache.
- `src/proxy.ts` protects every dynamic route except Clerk sign-in/sign-up and the UploadThing transport. UploadThing performs its own Clerk check in `src/app/api/uploadthing/core.ts`.
- Authorization belongs in tRPC procedure types from `src/server/api/trpc.ts`, not only in pages or UI. `protectedProcedure` accepts any Clerk user; `adminProcedure` checks the hard-coded Clerk IDs in `src/server/admin.ts`.
- Add server routers under `src/server/api/routers/` and register each one manually in `src/server/api/root.ts`. Client calls use `~/trpc/react`; React Server Components use `~/trpc/server`.
- Student writes are observed across clients through Pusher channel `students`, event `changed`. After a database/upload mutation, preserve `publishStudentsChanged()`; mutation callers also invalidate the relevant tRPC query for immediate local refresh.

## Database and uploads

- The Drizzle schema is `src/server/db/schema.ts`; generated SQL and snapshots live in `drizzle/`. All tables are prefixed `borbon-id_` through `createTable`, and `drizzle.config.ts` filters on that prefix.
- For schema changes, edit the schema, run `pnpm db:generate`, review generated SQL, then run `pnpm db:migrate`. `pnpm db:push` bypasses migration generation.
- Do not run `pnpm db:push-prod`: its referenced `drizzle-prod.config.ts` is absent from this repository.
- Picture/signature metadata is stored in Turso, while file bytes are managed by UploadThing. Deletion paths must keep both stores in sync and publish the Pusher change event.
