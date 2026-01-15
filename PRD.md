# Bonnaroo Artist Ranking App (Roo Ranking)

## Overview

A web app for ranking Bonnaroo artists with friends. Users rank artists 1-10, see others' rankings (after submitting their own to prevent bias), and view aggregate community rankings. Supports yearly lineups and weekly "BALI" (Bonnaroo Artist Listening Initiative) listening sessions.

**Target**: Ready for Bonnaroo 2025 lineup ranking.

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Database**: Convex
- **Components**: shadcn/ui (install all components)
- **Styling**: Tailwind CSS
- **Auth**: Simple username/password (plaintext in DB, admin-provisioned accounts)

## Why This Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      Next.js App                        │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌───────────┐  │
│  │  Login  │  │ Artists │  │Aggregate│  │   Admin   │  │
│  └────┬────┘  └────┬────┘  └────┬────┘  └─────┬─────┘  │
│       │            │            │              │        │
│       └────────────┴────────────┴──────────────┘        │
│                         │                               │
│              ┌──────────▼──────────┐                    │
│              │   Convex Client     │                    │
│              └──────────┬──────────┘                    │
└─────────────────────────┼───────────────────────────────┘
                          │
              ┌───────────▼───────────┐
              │    Convex Backend     │
              │  ┌─────┐ ┌─────────┐  │
              │  │Users│ │ Artists │  │
              │  ├─────┤ ├─────────┤  │
              │  │Ranks│ │ Groups  │  │
              │  └─────┘ └─────────┘  │
              └───────────────────────┘
```

**Convex** handles real-time sync out of the box - when someone ranks an artist, others see updates instantly. No WebSocket setup, no polling, no cache invalidation.

**shadcn/ui** gives us polished, accessible components (Drawer for ranking, Tabs for navigation, etc.) without fighting a component library.

**Simple auth** is intentional - this is a friends-only app. Admin creates accounts manually. No OAuth complexity, no email verification, no password reset flow.

---

## Data Model

### Users

```typescript
users: defineTable({
  username: v.string(),        // unique, used for login
  password: v.string(),        // plaintext (friends-only app)
  isAdmin: v.boolean(),        // only matt initially
  avatarColor: v.string(),     // hex color for avatar circle
  createdAt: v.number(),       // timestamp
})
  .index("by_username", ["username"])
```

### Artists

```typescript
artists: defineTable({
  name: v.string(),
  year: v.number(),            // 2025, 2026, etc.
})
  .index("by_year", ["year"])
  .index("by_name_year", ["name", "year"])
```

### Groups (BALI)

```typescript
groups: defineTable({
  name: v.string(),            // "BALI 1", "BALI 2", etc.
  year: v.number(),
  artistIds: v.array(v.id("artists")),
  status: v.union(
    v.literal("current"),
    v.literal("next"),
    v.null()
  ),
  order: v.number(),           // for sorting groups
})
  .index("by_year", ["year"])
  .index("by_status", ["status"])
```

### Rankings

```typescript
rankings: defineTable({
  userId: v.id("users"),
  artistId: v.id("artists"),
  score: v.number(),           // 1-10
  updatedAt: v.number(),       // timestamp of last change
})
  .index("by_user", ["userId"])
  .index("by_artist", ["artistId"])
  .index("by_user_artist", ["userId", "artistId"])
```

### Settings

```typescript
settings: defineTable({
  key: v.string(),             // "activeYear"
  value: v.any(),              // 2025
})
  .index("by_key", ["key"])
```

---

## Key Components

### ArtistListItem

The core reusable component used everywhere artists are displayed.

```
┌─────────────────────────────────────────────────────────┐
│  Artist Name                          [7]  🔵 🟢 🟣     │
│                                       ▲    ▲            │
│                                       │    └─ Other users who ranked
│                                       └────── Your score (if ranked)
└─────────────────────────────────────────────────────────┘
```

**States:**
- **Unranked**: No score badge, no avatars visible
- **Ranked by you**: Shows your score badge, shows avatars of others who ranked
- **Others' avatars**: Only visible after you've ranked (bias prevention)

**Interactions:**
- Tap anywhere → opens RankingDrawer

### RankingDrawer

shadcn Drawer that slides up from bottom for ranking.

```
┌─────────────────────────────────────────────────────────┐
│                                                    ──   │
│                     Artist Name                         │
│                                                         │
│              ┌─────┐  ┌─────┐  ┌─────┐                  │
│              │  1  │  │  2  │  │  3  │                  │
│              └─────┘  └─────┘  └─────┘                  │
│              ┌─────┐  ┌─────┐  ┌─────┐                  │
│              │  4  │  │  5  │  │  6  │                  │
│              └─────┘  └─────┘  └─────┘                  │
│              ┌─────┐  ┌─────┐  ┌─────┐                  │
│              │  7  │  │  8  │  │  9  │                  │
│              └─────┘  └─────┘  └─────┘                  │
│                       ┌─────┐                           │
│                       │ 10  │                           │
│                       └─────┘                           │
│                                                         │
│                   [Clear Rating]                        │
└─────────────────────────────────────────────────────────┘
```

**Behavior:**
- Tap number → saves rating, closes drawer
- If already rated, current rating is highlighted
- "Clear Rating" removes existing rating

### UserAvatar

Simple colored circle with initials.

```
   ┌───┐
   │MA │  ← First letter of username, colored background
   └───┘
```

---

## Routes

| Route | Description | Auth |
|-------|-------------|------|
| `/` | Login page | Public |
| `/artists` | Main artist list for active year | User |
| `/artists?tab=bali` | BALI groups view | User |
| `/aggregate` | Community aggregate rankings | User |
| `/history` | Previous years archive | User |
| `/history/[year]` | Specific year's rankings | User |
| `/admin` | Admin panel | Admin |
| `/admin/artists` | Manage artists | Admin |
| `/admin/users` | Manage users | Admin |
| `/admin/groups` | Manage BALI groups | Admin |
| `/admin/settings` | App settings | Admin |

---

## Phase 1: Foundation

**Goal**: Get the app scaffolded with auth working. User can log in and see an empty shell.

### User Stories

- [ ] **US1.1**: User can access the login page at `/`
- [ ] **US1.2**: User can log in with username/password
- [ ] **US1.3**: Invalid credentials show error message
- [ ] **US1.4**: Logged-in user is redirected to `/artists`
- [ ] **US1.5**: Logged-out user accessing protected routes is redirected to `/`
- [ ] **US1.6**: Admin user (matt) exists and can log in
- [ ] **US1.7**: User can log out

### Technical Tasks

- [ ] Initialize Next.js project:
  ```bash
  npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
  ```

- [ ] Set up Convex:
  ```bash
  npm install convex
  npx convex dev
  ```

- [ ] Install and configure shadcn/ui:
  ```bash
  npx shadcn@latest init
  npx shadcn@latest add --all
  ```

- [ ] Create Convex schema (`convex/schema.ts`):
  - Users table with indexes
  - Artists table with indexes
  - Groups table with indexes
  - Rankings table with indexes
  - Settings table with indexes

- [ ] Create auth utilities:
  - `convex/users.ts`: `login` mutation, `getUser` query
  - Session stored in localStorage (simple token/userId)
  - Auth context provider for React

- [ ] Seed admin account:
  - `convex/seed.ts`: Create matt/bonnaroo user with `isAdmin: true`
  - Run on first deploy or via Convex dashboard

- [ ] Create basic layout:
  - `src/app/layout.tsx`: Convex provider wrapper
  - `src/components/Layout.tsx`: Nav bar with logout
  - Protected route wrapper component

- [ ] Create login page:
  - `src/app/page.tsx`: Login form
  - Username/password inputs
  - Error state for invalid credentials
  - Redirect to `/artists` on success

- [ ] Create placeholder pages:
  - `src/app/artists/page.tsx`: "Artists coming soon"
  - `src/app/aggregate/page.tsx`: "Aggregate coming soon"
  - `src/app/admin/page.tsx`: "Admin coming soon"

### Acceptance Criteria

- [ ] `npm run dev` starts the app without errors
- [ ] Login page renders at `/`
- [ ] Can log in as matt/bonnaroo
- [ ] Invalid credentials show error
- [ ] After login, redirected to `/artists`
- [ ] Nav bar shows username and logout button
- [ ] Logout returns to login page
- [ ] Accessing `/artists` while logged out redirects to `/`
- [ ] Convex dashboard shows users table with matt

---

## Phase 2: Admin - Artists & Users

**Goal**: Admin can manage the core data: add lineup, create users, configure settings.

### User Stories

- [ ] **US2.1**: Admin can navigate to admin panel via nav
- [ ] **US2.2**: Admin can paste newline-delimited artist names and save them for a year
- [ ] **US2.3**: Admin can view all artists for a given year
- [ ] **US2.4**: Admin can delete an artist
- [ ] **US2.5**: Admin can create a new user with username, password, and avatar color
- [ ] **US2.6**: Admin can view all users
- [ ] **US2.7**: Admin can delete a user (except themselves)
- [ ] **US2.8**: Admin can set the active year
- [ ] **US2.9**: Non-admin users cannot access admin routes

### Technical Tasks

- [ ] Create admin layout:
  - `src/app/admin/layout.tsx`: Admin check, redirect non-admins
  - Tab navigation: Artists | Users | Groups | Settings

- [ ] Create artists admin page (`src/app/admin/artists/page.tsx`):
  - Year selector dropdown
  - Textarea for bulk artist import (newline-delimited)
  - "Add Artists" button
  - List of existing artists for selected year
  - Delete button per artist

- [ ] Create Convex artist mutations:
  - `convex/artists.ts`:
    - `addArtists`: Takes array of names + year, creates records
    - `deleteArtist`: Removes artist by ID
    - `getArtistsByYear`: Query artists for a year

- [ ] Create users admin page (`src/app/admin/users/page.tsx`):
  - Form: username, password, avatar color picker
  - "Create User" button
  - List of existing users
  - Delete button per user (disabled for self)

- [ ] Create Convex user mutations:
  - `convex/users.ts`:
    - `createUser`: Creates new user with avatar color
    - `deleteUser`: Removes user by ID
    - `getAllUsers`: Returns all users

- [ ] Create settings admin page (`src/app/admin/settings/page.tsx`):
  - Active year dropdown (populated from years with artists)
  - Save button

- [ ] Create Convex settings mutations:
  - `convex/settings.ts`:
    - `setActiveYear`: Updates activeYear setting
    - `getActiveYear`: Returns current active year

- [ ] Create avatar color picker component:
  - Predefined palette of ~8 colors
  - Visual preview of avatar with selected color

### Acceptance Criteria

- [ ] Admin panel accessible at `/admin`
- [ ] Non-admin users redirected away from `/admin`
- [ ] Can paste artist list and save for 2025
- [ ] Artists appear in list after saving
- [ ] Can delete individual artists
- [ ] Can create new user with color
- [ ] New user appears in list
- [ ] Can delete users (except self)
- [ ] Can set active year
- [ ] Active year persists after refresh

---

## Phase 3: Core Ranking Experience

**Goal**: Users can browse artists and rank them. The main user flow is complete.

### User Stories

- [ ] **US3.1**: User sees all artists for the active year on `/artists`
- [ ] **US3.2**: Artists are sorted alphabetically by default
- [ ] **US3.3**: User can tap an artist to open ranking drawer
- [ ] **US3.4**: Ranking drawer shows 1-10 grid (rows of 3, 10 centered at bottom)
- [ ] **US3.5**: Tapping a number saves the rating and closes the drawer
- [ ] **US3.6**: If artist is already ranked, current score is highlighted in drawer
- [ ] **US3.7**: User can change their rating by tapping a different number
- [ ] **US3.8**: User can clear their rating via "Clear Rating" button
- [ ] **US3.9**: Artist list shows user's score badge if ranked

### Technical Tasks

- [ ] Create ArtistListItem component:
  - `src/components/ArtistListItem.tsx`
  - Props: artist, userRanking (optional), onTap
  - Shows name, score badge (if ranked)
  - Placeholder for avatars (Phase 5)

- [ ] Create RankingDrawer component:
  - `src/components/RankingDrawer.tsx`
  - Uses shadcn Drawer
  - Props: artist, currentRating, onRate, onClear, open, onOpenChange
  - 1-10 grid layout (3x3 + centered 10)
  - Highlights current rating if exists
  - "Clear Rating" button (only if rated)

- [ ] Create artists page:
  - `src/app/artists/page.tsx`
  - Fetches artists for active year
  - Fetches user's rankings
  - Maps to ArtistListItem components
  - Manages drawer open state and selected artist

- [ ] Create Convex ranking mutations:
  - `convex/rankings.ts`:
    - `setRanking`: Upsert ranking for user+artist
    - `clearRanking`: Delete ranking for user+artist
    - `getUserRankings`: Get all rankings for a user
    - `getRankingsForArtist`: Get all rankings for an artist

- [ ] Style the drawer:
  - Mobile-first design
  - Large tap targets for numbers
  - Clear visual feedback on selection

### Acceptance Criteria

- [ ] `/artists` shows all artists for active year
- [ ] Artists sorted alphabetically
- [ ] Tapping artist opens drawer from bottom
- [ ] Drawer shows artist name and 1-10 grid
- [ ] Tapping number saves rating (verify in Convex dashboard)
- [ ] Drawer closes after rating
- [ ] Re-opening drawer shows current rating highlighted
- [ ] Can change rating by tapping different number
- [ ] "Clear Rating" removes the rating
- [ ] Artist list item shows score badge after rating

---

## Phase 4: BALI Groups

**Goal**: Admin can create listening groups, users can view current/next batches.

### User Stories

- [ ] **US4.1**: Admin can create a new BALI group with selected artists
- [ ] **US4.2**: Admin can view all BALI groups for a year
- [ ] **US4.3**: Admin can edit a group's artists
- [ ] **US4.4**: Admin can set a group's status (current/next/none)
- [ ] **US4.5**: Admin can delete a BALI group
- [ ] **US4.6**: Only one group can be "current" at a time
- [ ] **US4.7**: Only one group can be "next" at a time
- [ ] **US4.8**: User sees tab switcher on `/artists`: All Artists | BALI
- [ ] **US4.9**: BALI tab shows "Current" group with its artists
- [ ] **US4.10**: BALI tab shows "Next" group below current
- [ ] **US4.11**: BALI view uses same ArtistListItem component (can rank from here)

### Technical Tasks

- [ ] Create groups admin page (`src/app/admin/groups/page.tsx`):
  - Year selector (matches artists admin)
  - "Create Group" button
  - List of existing groups with status badges
  - Edit/Delete buttons per group

- [ ] Create group form modal/drawer:
  - Group name input (default: "BALI {n+1}")
  - Multi-select for artists (checkbox list or transfer list)
  - Status selector: None | Current | Next
  - Save/Cancel buttons

- [ ] Create Convex group mutations:
  - `convex/groups.ts`:
    - `createGroup`: Creates group, enforces single current/next
    - `updateGroup`: Updates group, enforces single current/next
    - `deleteGroup`: Removes group
    - `getGroupsByYear`: Returns groups for year
    - `getCurrentAndNextGroups`: Returns current and next groups

- [ ] Add tab switcher to artists page:
  - shadcn Tabs component
  - "All Artists" tab (existing functionality)
  - "BALI" tab (new)
  - URL sync: `/artists` vs `/artists?tab=bali`

- [ ] Create BALI tab content:
  - `src/components/BALIView.tsx`
  - Shows "Current: BALI X" section with artists
  - Shows "Up Next: BALI Y" section below
  - Uses ArtistListItem for each artist
  - Empty state if no current/next groups

### Acceptance Criteria

- [ ] Admin can create BALI groups
- [ ] Admin can select artists for a group
- [ ] Admin can set current/next status
- [ ] Setting a group to "current" clears previous "current"
- [ ] Setting a group to "next" clears previous "next"
- [ ] Admin can edit and delete groups
- [ ] `/artists` shows tab switcher
- [ ] BALI tab shows current group's artists
- [ ] BALI tab shows next group's artists
- [ ] Can rank artists from BALI view
- [ ] Empty state shown if no current/next groups

---

## Phase 5: Social - See Others' Rankings

**Goal**: Users can see who else ranked an artist and what they rated it (only after ranking themselves).

### User Stories

- [ ] **US5.1**: After ranking an artist, user sees avatars of others who ranked
- [ ] **US5.2**: Before ranking, no avatars are visible (bias prevention)
- [ ] **US5.3**: Tapping an avatar shows that user's score for the artist
- [ ] **US5.4**: Avatar shows colored circle with first letter of username
- [ ] **US5.5**: If many users ranked, show first few avatars + "+N" overflow

### Technical Tasks

- [ ] Create UserAvatar component:
  - `src/components/UserAvatar.tsx`
  - Props: user (username, avatarColor), size
  - Renders colored circle with initial

- [ ] Create AvatarGroup component:
  - `src/components/AvatarGroup.tsx`
  - Props: users, maxVisible (default 4)
  - Shows avatars with overlap
  - "+N" badge if overflow

- [ ] Update ArtistListItem:
  - Accept `otherRankings` prop (only populated if user has ranked)
  - Show AvatarGroup on right side
  - On avatar tap, show tooltip/popover with username and score

- [ ] Create Convex query for other rankings:
  - `convex/rankings.ts`:
    - `getOtherRankingsForArtist`: Returns other users' rankings for an artist
    - Only returns data if requesting user has ranked that artist
    - Includes user info (username, avatarColor)

- [ ] Create score popover/tooltip:
  - Shows on avatar tap
  - Displays: "{username}: {score}/10"
  - Auto-dismisses or tap-away to close

### Acceptance Criteria

- [ ] Unranked artists show no avatars
- [ ] After ranking, avatars of other raters appear
- [ ] Avatars show correct colors and initials
- [ ] Tapping avatar shows that user's score
- [ ] More than 4 raters shows "+N" overflow
- [ ] Real-time: new ratings from others appear without refresh

---

## Phase 6: Aggregate View

**Goal**: Users can see community consensus rankings.

### User Stories

- [ ] **US6.1**: User can navigate to `/aggregate`
- [ ] **US6.2**: Artists are sorted by average score (highest first)
- [ ] **US6.3**: Each artist shows: name, average score, number of ratings
- [ ] **US6.4**: Artists with no ratings appear in "No Data" section at bottom
- [ ] **US6.5**: Aggregate is visible even if user hasn't ranked all artists

### Technical Tasks

- [ ] Create aggregate page:
  - `src/app/aggregate/page.tsx`
  - Fetches all artists for active year
  - Fetches aggregate data

- [ ] Create Convex aggregate query:
  - `convex/rankings.ts`:
    - `getAggregateRankings`: Returns artists with avg score and count
    - Sorted by avg score descending
    - Includes artists with zero rankings

- [ ] Create AggregateListItem component:
  - `src/components/AggregateListItem.tsx`
  - Shows: rank number, artist name, avg score (1 decimal), rating count
  - Visual indicator (bar, stars, or just the number)

- [ ] Create "No Data" section:
  - Separator with "No Rankings Yet" label
  - Lists unranked artists alphabetically
  - Muted styling to differentiate

- [ ] Add aggregate to nav:
  - Link in nav bar for logged-in users

### Acceptance Criteria

- [ ] `/aggregate` accessible from nav
- [ ] Artists sorted by average score
- [ ] Shows average score and number of ratings
- [ ] Unranked artists in separate section at bottom
- [ ] Updates in real-time as ratings come in

---

## Phase 7: Historical View

**Goal**: Users can browse past years' lineups and rankings.

### User Stories

- [ ] **US7.1**: User can navigate to `/history`
- [ ] **US7.2**: User sees list of past years (years with artists, excluding active year)
- [ ] **US7.3**: User can select a year to view its rankings
- [ ] **US7.4**: Historical view shows aggregate rankings (read-only)
- [ ] **US7.5**: Historical view indicates it's from a past year

### Technical Tasks

- [ ] Create history index page:
  - `src/app/history/page.tsx`
  - Lists years with artist data
  - Excludes current active year
  - Links to `/history/[year]`

- [ ] Create year history page:
  - `src/app/history/[year]/page.tsx`
  - Shows year in header
  - Reuses aggregate view components
  - Read-only (no ranking drawer)

- [ ] Create Convex queries:
  - `convex/artists.ts`:
    - `getYearsWithArtists`: Returns list of years that have artists
  - `convex/rankings.ts`:
    - `getAggregateRankingsForYear`: Aggregate for specific year

- [ ] Add history to nav:
  - Link in nav bar for logged-in users

### Acceptance Criteria

- [ ] `/history` shows list of past years
- [ ] Can click year to see that year's rankings
- [ ] Historical view shows aggregate scores
- [ ] Cannot rank artists in historical view
- [ ] Current active year not shown in history list

---

## Phase 8: Polish & QA

**Goal**: App feels polished, handles edge cases, works great on mobile.

### User Stories

- [ ] **US8.1**: App is fully usable on mobile (primary use case)
- [ ] **US8.2**: Loading states shown while data fetches
- [ ] **US8.3**: Empty states shown when no data exists
- [ ] **US8.4**: Errors are handled gracefully with user feedback
- [ ] **US8.5**: User can search/filter artists by name
- [ ] **US8.6**: User can sort artists (alphabetical, by their score, by avg score)

### Technical Tasks

- [ ] Mobile responsive audit:
  - Test all pages on mobile viewport
  - Ensure tap targets are 44px+ minimum
  - Test drawer behavior on mobile
  - Fix any overflow/scroll issues

- [ ] Add loading states:
  - Skeleton loaders for artist lists
  - Loading spinner for actions
  - Disable buttons during mutations

- [ ] Add empty states:
  - No artists for year
  - No rankings yet
  - No BALI groups
  - No users (except admin)

- [ ] Add error handling:
  - Toast notifications for errors
  - Retry buttons where appropriate
  - Graceful fallbacks

- [ ] Add search/filter:
  - Search input on artists page
  - Filters artist list as you type
  - Clear button

- [ ] Add sort options:
  - Dropdown or toggle buttons
  - Options: A-Z, Z-A, My Score (high-low), My Score (low-high)
  - Persists during session

- [ ] Final QA:
  - Test complete user flows
  - Test admin flows
  - Test edge cases (empty data, long names, etc.)
  - Cross-browser testing

### Acceptance Criteria

- [ ] All pages render correctly on mobile
- [ ] Loading states appear during data fetches
- [ ] Empty states guide users appropriately
- [ ] Errors show helpful messages
- [ ] Can search artists by name
- [ ] Can sort artists by different criteria
- [ ] No console errors in production build
- [ ] App feels snappy and responsive

---

## File Structure

```
roo-ranking/
├── convex/
│   ├── schema.ts           # Database schema
│   ├── users.ts            # User queries/mutations
│   ├── artists.ts          # Artist queries/mutations
│   ├── groups.ts           # BALI group queries/mutations
│   ├── rankings.ts         # Ranking queries/mutations
│   └── settings.ts         # Settings queries/mutations
├── src/
│   ├── app/
│   │   ├── layout.tsx      # Root layout with providers
│   │   ├── page.tsx        # Login page
│   │   ├── artists/
│   │   │   └── page.tsx    # Main artist list + BALI tabs
│   │   ├── aggregate/
│   │   │   └── page.tsx    # Aggregate rankings
│   │   ├── history/
│   │   │   ├── page.tsx    # Year list
│   │   │   └── [year]/
│   │   │       └── page.tsx # Year's rankings
│   │   └── admin/
│   │       ├── layout.tsx  # Admin layout with tabs
│   │       ├── page.tsx    # Admin index (redirect)
│   │       ├── artists/
│   │       │   └── page.tsx
│   │       ├── users/
│   │       │   └── page.tsx
│   │       ├── groups/
│   │       │   └── page.tsx
│   │       └── settings/
│   │           └── page.tsx
│   ├── components/
│   │   ├── ui/             # shadcn components
│   │   ├── Layout.tsx      # App shell with nav
│   │   ├── AuthProvider.tsx # Auth context
│   │   ├── ArtistListItem.tsx
│   │   ├── RankingDrawer.tsx
│   │   ├── UserAvatar.tsx
│   │   ├── AvatarGroup.tsx
│   │   ├── AggregateListItem.tsx
│   │   └── BALIView.tsx
│   └── lib/
│       └── utils.ts        # Utility functions
├── REQUIREMENTS.md
├── PRD.md
└── package.json
```

---

## Open Questions

- [ ] Should there be a way to see your own ranking history (what you've rated)?
- [ ] Do we want any notification when someone else ranks an artist in current BALI?
- [ ] Should aggregate show median as well as mean?

---

## Future Ideas (Out of Scope)

- Spotify integration to play artist samples
- Notes/comments on artists
- "Must see" / "Skip" quick tags
- Schedule builder once Bonnaroo releases set times
- Import previous year's ratings as starting point
- Export rankings to CSV/share image
