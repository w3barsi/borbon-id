# borbon-id

## Migration Plan: Next.js to SvelteKit

This document outlines the comprehensive migration plan from Next.js to SvelteKit, leveraging SvelteKit's remote functions and async Svelte features for improved performance and developer experience.

### Executive Summary

This plan migrates a Next.js application with tRPC, Drizzle ORM, Clerk auth, and Radix UI components to SvelteKit, leveraging SvelteKit's remote functions and async Svelte features for improved performance and developer experience.

### Current Tech Stack
- **Framework**: Next.js with App Router
- **API**: tRPC for type-safe API calls
- **Database**: Drizzle ORM with Turso
- **Auth**: Clerk authentication
- **UI**: Tailwind CSS + Radix UI components (shadcn/ui)
- **State**: Zustand for global state management
- **Forms**: React Hook Form with Zod validation

### Target Tech Stack
- **Framework**: SvelteKit with file-based routing
- **API**: SvelteKit load functions and form actions (remote functions)
- **Database**: Drizzle ORM (compatible)
- **Auth**: Clerk SvelteKit integration
- **UI**: Tailwind CSS + shadcn-svelte components
- **State**: Svelte stores
- **Forms**: Native Svelte forms with validation

### Migration Phases

## Phase 1: Foundation & Setup (Week 1)

### 1.1 Project Initialization
- Create new SvelteKit project: `npm create svelte@latest borbon-id-svelte`
- Choose TypeScript, Playwright for testing, Tailwind for styling
- Set up project structure mirroring Next.js layout

### 1.2 Core Dependencies Migration
- **Database**: Migrate Drizzle config and schema (compatible)
- **Styling**: Install `@tailwindcss/vite` and configure Tailwind
- **Forms**: Remove React Hook Form (use native Svelte forms + actions)
- **State**: Remove Zustand (use Svelte stores)

### 1.3 UI Component Decision
**Recommendation: shadcn-svelte**
- Similar API to current shadcn/ui
- Direct component mapping possible
- Install: `npx shadcn-svelte@latest init`

## Phase 2: Authentication Migration (Week 2)

### 2.1 Clerk SvelteKit Integration
- Install `@clerk/sveltekit`
- Configure environment variables
- Replace Next.js auth patterns:
  - `currentUser()` → Clerk SvelteKit load functions
  - `UserButton` → Clerk SvelteKit components
  - Auth middleware → SvelteKit hooks

### 2.2 Auth Guards Implementation
- Create `hooks.server.js` for session validation
- Implement protected routes using SvelteKit's routing
- Migrate admin access control logic

## Phase 3: Database & API Layer Migration (Weeks 3-4)

### 3.1 Drizzle ORM Setup
- Copy existing schema and config
- Update connection strings for SvelteKit environment
- Test database connectivity

### 3.2 tRPC to SvelteKit Functions Migration

**Current tRPC Procedures → SvelteKit Equivalents:**

| tRPC Procedure | SvelteKit Equivalent | Location |
|---|---|---|
| `getStudents` | `+page.server.js` load function | `src/routes/+page.server.js` |
| `createStudent` | Form action in `+page.server.js` | `src/routes/+page.server.js` |
| `editStudent` | Form action in `+page.server.js` | `src/routes/+page.server.js` |
| `deleteStudent` | Form action in `+page.server.js` | `src/routes/+page.server.js` |
| `getStudent` | Load function for edit page | `src/routes/edit/[id]/+page.server.js` |

**Migration Pattern:**
```typescript
// Instead of tRPC procedure
export const getStudents = publicProcedure.query(async () => {
  return db.select().from(students);
});

// Use SvelteKit load function
export async function load({ locals }) {
  const students = await db.select().from(students);
  return { students };
}
```

### 3.3 Form Actions Implementation
Replace tRPC mutations with SvelteKit form actions:
```typescript
// +page.server.js
export const actions = {
  createStudent: async ({ request }) => {
    const data = await request.formData();
    // Process form data and save to database
    return { success: true };
  }
};
```

## Phase 4: Component Migration (Weeks 5-6)

### 4.1 UI Components Mapping

**Radix UI → shadcn-svelte Migration:**

| Current Component | New Component | Notes |
|---|---|---|
| `Dialog` | `Dialog` | Direct equivalent |
| `Table` | `Table` | Direct equivalent |
| `Button` | `Button` | Direct equivalent |
| `Input` | `Input` | Direct equivalent |
| `Form` (react-hook-form) | Native `<form>` + actions | Major change |
| `DropdownMenu` | `DropdownMenu` | Direct equivalent |
| `AlertDialog` | `AlertDialog` | Direct equivalent |

### 4.2 Page Components Migration

**Admin Page (`src/app/admin/page.tsx`):**
- Convert to `src/routes/admin/+page.svelte`
- Replace tRPC queries with load functions
- Migrate auth checks to server-side

**Main Page (`src/app/page.tsx`):**
- Convert to `src/routes/+page.svelte`
- Replace `HydrateClient` with SvelteKit's data loading
- Migrate dialogs to Svelte components

### 4.3 Form Components Migration

**Create/Edit Dialogs:**
- Remove React Hook Form
- Use native Svelte form validation
- Implement form actions for submission
- Use Svelte's `$state` for form state

## Phase 5: File Upload Migration (Week 7)

### 5.1 UploadThing SvelteKit Integration
- Install `@uploadthing/sveltekit`
- Configure UploadThing routes
- Replace tRPC upload procedures with SvelteKit actions

### 5.2 File Handling Components
- Migrate `TakePictureButton` and `UploadPictureButton`
- Update file upload flows to use SvelteKit patterns
- Implement progress indicators using async Svelte features

## Phase 6: State Management & Advanced Features (Week 8)

### 6.1 State Management Migration
Replace Zustand with Svelte stores:
```typescript
// Instead of Zustand store
const useViewPhotoDialogStore = create((set) => ({
  isOpen: false,
  url: '',
  setIsOpen: (isOpen) => set({ isOpen }),
  setUrl: (url) => set({ url })
}));

// Use Svelte store
import { writable } from 'svelte/store';
export const viewPhotoDialog = writable({ isOpen: false, url: '' });
```

### 6.2 Async Svelte Features Implementation
Leverage Svelte 5 async features:
- Use async components for loading states
- Implement `$effect` for side effects
- Use `$derived` for computed values
- Add streaming for better UX

## Phase 7: Routing & Layout Migration (Week 9)

### 7.1 Route Structure
```
src/routes/
├── +layout.svelte (root layout)
├── +page.svelte (home page)
├── +page.server.js (home load/actions)
├── admin/
│   ├── +page.svelte
│   └── +page.server.js
├── edit/
│   └── [id]/
│       ├── +page.svelte
│       └── +page.server.js
└── sign-in/
    └── [[...sign-in]]/
        └── +page.svelte
```

### 7.2 Layout Migration
- Convert `src/app/layout.tsx` to `src/routes/+layout.svelte`
- Implement auth-aware layouts
- Migrate global providers to SvelteKit hooks

## Phase 8: Testing & Deployment (Week 10)

### 8.1 Testing Setup
- Configure Playwright for E2E testing
- Set up Vitest for unit tests
- Migrate component tests to Svelte testing patterns

### 8.2 Deployment Configuration
- Choose SvelteKit adapter (likely `@sveltejs/adapter-vercel` for Vercel)
- Configure build settings
- Set up environment variables
- Test deployment pipeline

## Phase 9: Optimization & Polish (Week 11)

### 9.1 Performance Optimization
- Implement SvelteKit's streaming features
- Add loading states with async components
- Optimize bundle size

### 9.2 Feature Parity Verification
- Test all CRUD operations
- Verify file uploads work
- Confirm auth flows function
- Validate admin access controls

## Phase 10: Go-Live & Monitoring (Week 12)

### 10.1 Deployment
- Deploy to staging environment
- Conduct thorough testing
- Performance benchmarking vs Next.js version

### 10.2 Monitoring Setup
- Configure error tracking
- Set up analytics
- Monitor performance metrics

## Risk Mitigation

### High-Risk Areas
1. **tRPC Migration**: Complex procedure-to-action conversion
2. **Form Handling**: React Hook Form to native forms is major paradigm shift
3. **Auth Integration**: Clerk SvelteKit patterns may differ significantly

### Mitigation Strategies
- Create comprehensive test suite before migration
- Migrate components incrementally
- Maintain feature parity checks at each phase
- Have rollback plan to Next.js version

## Success Criteria

- ✅ All CRUD operations functional
- ✅ Authentication working
- ✅ File uploads operational
- ✅ UI components responsive and accessible
- ✅ Performance equal or better than Next.js
- ✅ Type safety maintained
- ✅ All tests passing

## Timeline & Resources

**Duration**: 12 weeks
**Team**: 1-2 developers
**Key Dependencies**:
- shadcn-svelte documentation
- Clerk SvelteKit docs
- UploadThing SvelteKit integration
- SvelteKit migration guides

## Todo Checklist

- [ ] **Phase 1.1**: Create new SvelteKit project with TypeScript, Playwright, and Tailwind
- [ ] **Phase 1.2**: Set up project structure mirroring Next.js layout
- [ ] **Phase 1.3**: Migrate Drizzle config and schema to SvelteKit
- [ ] **Phase 1.4**: Configure Tailwind CSS with @tailwindcss/vite
- [ ] **Phase 1.5**: Install and initialize shadcn-svelte for UI components
- [ ] **Phase 2.1**: Install and configure @clerk/sveltekit
- [ ] **Phase 2.2**: Create hooks.server.js for session validation
- [ ] **Phase 2.3**: Migrate auth middleware to SvelteKit patterns
- [ ] **Phase 2.4**: Implement protected routes and admin access control
- [ ] **Phase 3.1**: Test Drizzle database connectivity in SvelteKit
- [ ] **Phase 3.2**: Create +page.server.js with load function for getStudents
- [ ] **Phase 3.3**: Implement form actions for createStudent, editStudent, deleteStudent
- [ ] **Phase 3.4**: Create edit/[id] route with load function for getStudent
- [ ] **Phase 3.5**: Migrate file upload procedures to SvelteKit actions
- [ ] **Phase 4.1**: Migrate admin page component to Svelte
- [ ] **Phase 4.2**: Migrate main page component to Svelte
- [ ] **Phase 4.3**: Convert create/edit dialogs to Svelte with native forms
- [ ] **Phase 4.4**: Migrate data table component to Svelte
- [ ] **Phase 4.5**: Replace React Hook Form with native Svelte form validation
- [ ] **Phase 5.1**: Install and configure @uploadthing/sveltekit
- [ ] **Phase 5.2**: Migrate TakePictureButton and UploadPictureButton to Svelte
- [ ] **Phase 5.3**: Implement file upload progress with async Svelte features
- [ ] **Phase 6.1**: Replace Zustand stores with Svelte stores
- [ ] **Phase 6.2**: Implement async components for loading states
- [ ] **Phase 6.3**: Use $effect and $derived for reactive computations
- [ ] **Phase 7.1**: Create root +layout.svelte with global providers
- [ ] **Phase 7.2**: Implement auth-aware layouts and navigation
- [ ] **Phase 7.3**: Set up sign-in/sign-up routes with Clerk components
- [ ] **Phase 8.1**: Configure Playwright for E2E testing
- [ ] **Phase 8.2**: Set up Vitest for unit tests
- [ ] **Phase 8.3**: Choose and configure SvelteKit adapter (Vercel recommended)
- [ ] **Phase 8.4**: Configure environment variables for production
- [ ] **Phase 9.1**: Implement SvelteKit streaming features
- [ ] **Phase 9.2**: Optimize bundle size and loading performance
- [ ] **Phase 9.3**: Test all CRUD operations for feature parity
- [ ] **Phase 10.1**: Deploy to staging environment
- [ ] **Phase 10.2**: Conduct thorough testing and performance benchmarking
- [ ] **Phase 10.3**: Set up monitoring and error tracking

This plan provides a structured approach to migrate your Next.js application to SvelteKit while leveraging modern Svelte features and maintaining all existing functionality.

---

## Original T3 Stack Documentation

This is a [T3 Stack](https://create.t3.gg/) project bootstrapped with `create-t3-app`.

## What's next? How do I make an app with this?

We try to keep this project as simple as possible, so you can start with just the scaffolding we set up for you, and add additional things later when they become necessary.

If you are not familiar with the different technologies used in this project, please refer to the respective docs. If you still are in the wind, please join our [Discord](https://t3.gg/discord) and ask for help.

- [Next.js](https://nextjs.org)
- [NextAuth.js](https://next-auth.js.org)
- [Prisma](https://prisma.io)
- [Drizzle](https://orm.drizzle.team)
- [Tailwind CSS](https://tailwindcss.com)
- [tRPC](https://trpc.io)

## Learn More

To learn more about the [T3 Stack](https://create.t3.gg/), take a look at the following resources:

- [Documentation](https://create.t3.gg/)
- [Learn the T3 Stack](https://create.t3.gg/en/faq#what-learning-resources-are-currently-available) — Check out these awesome tutorials

You can check out the [create-t3-app GitHub repository](https://github.com/t3-oss/create-t3-app) — your feedback and contributions are welcome!

## How do I deploy this?

Follow our deployment guides for [Vercel](https://create.t3.gg/en/deployment/vercel), [Netlify](https://create.t3.gg/en/deployment/netlify) and [Docker](https://create.t3.gg/en/deployment/docker) for more information.
