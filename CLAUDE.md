# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Roo Ranking is a Bonnaroo artist ranking web app where users rate artists 1-10, view friends' rankings (only after rating to prevent bias), and see aggregate community rankings. Built for small friend groups with admin-provisioned accounts.

## Commands

```bash
pnpm dev              # Start Next.js dev server (localhost:3000)
pnpm build            # Production build
pnpm lint             # Run ESLint
npx tsc               # Type check (no emit)
npx convex dev        # Start Convex dev server (required alongside Next.js)
```

Both `pnpm dev` and `npx convex dev` must run simultaneously during development.

**Important**: Use `npx` for Convex and TypeScript commands (e.g., `npx convex dev`, `npx tsc`), not `pnpm exec`.

## Architecture

### Tech Stack
- **Next.js 16** with App Router (`src/app/`)
- **Convex** for real-time database and backend functions (`convex/`)
- **shadcn/ui** components in `src/components/ui/`
- **Tailwind CSS v4** for styling
- **pnpm** as package manager (Node 22 per `.nvmrc`)

### Data Flow

```
Next.js Client → Convex React Hooks → Convex Backend → Database
     ↓
ConvexClientProvider (wraps app with Convex client)
     ↓
AuthProvider (manages user session in localStorage, exposes useAuth hook)
```

### Key Convex Tables (see `convex/schema.ts`)
- `users` - username, password (plaintext intentionally), isAdmin, avatarColor
- `artists` - name, year
- `groups` - BALI weekly listening groups with status (current/next/null)
- `rankings` - user+artist scores (1-10)
- `settings` - key-value store (activeYear)

### Auth Pattern
- Session stored in localStorage as user ID (`roo-ranking-user` key)
- `useAuth()` hook provides user, isLoading, login, logout
- No OAuth/JWT - simple username/password for friends-only app
- Use `ProtectedRoute` component for auth-gated pages

### Path Aliases
`@/*` maps to `./src/*` (configured in tsconfig.json)

### Convex File Conventions
- Queries/mutations in `convex/*.ts` (users.ts, artists.ts, etc.)
- Import API from `convex/_generated/api`
- Import types from `convex/_generated/dataModel`

## Route Structure

| Route | Purpose |
|-------|---------|
| `/` | Login page |
| `/artists` | Main artist list with BALI tab |
| `/aggregate` | Community average rankings |
| `/history` | Past years archive |
| `/admin/*` | Admin panel (artists, users, groups, settings) |

## Key Implementation Details

- **Bias prevention**: Users only see others' rankings after submitting their own rating for an artist
- **BALI groups**: Weekly listening batches - only one group can be "current" or "next" at a time
- **Real-time updates**: Convex handles WebSocket sync automatically - rankings appear instantly for all users
- **Avatars**: Colored circles with initials, color chosen at user creation
