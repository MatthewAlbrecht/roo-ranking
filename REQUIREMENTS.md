# Bonnaroo Artist Ranking App

## Overview
A simple web app for ranking Bonnaroo artists with friends. Built with Next.js, Convex, shadcn/ui, and Tailwind.

## Tech Stack
- **Framework**: Next.js (App Router)
- **Database**: Convex
- **Components**: shadcn/ui
- **Styling**: Tailwind CSS

## Authentication
- Simple username/password (plaintext in DB)
- Admin account: `matt` / `bonnaroo`
- Admin provisions accounts manually

## Features

### 1. Artist Management (Admin)
- Add artists via newline-delimited list
- Support for yearly lineup (2025, 2026, etc.)
- Admin can set the "active year" for the main app flow

### 2. Account Management (Admin)
- Provision new user accounts
- Set username and password

### 3. Artist Grouping - "BALI" (Bonnaroo Artist Listening Initiative)
- Admin creates BALI groups (BALI 1, BALI 2, etc.)
- Groups have a status: "current" or "next" (or neither)
- BALI tab shows grouped artists using same ArtistListItem component
- Supports weekly listening sessions workflow

### 4. Ranking System
- Rate artists 1-10
- UI: shadcn Drawer from bottom
- Layout: 3 columns (1,2,3 | 4,5,6 | 7,8,9 | 10)
- **Bias prevention**: Users cannot see others' rankings for an artist until they've ranked it themselves
- **Editable**: Users can change their ranking at any time

### 5. Social Features
- View other users' rankings (only for artists you've already ranked)
- Avatars: colored circles with initials

### 6. Aggregate View
- Average all users' rankings
- Display aggregated artist rankings sorted by score
- Accessible to everyone at any time
- Artists with no rankings appear at bottom in a separate "No Data" section

### 7. Historical View
- Separate route for viewing previous years' rankings
- Not part of main app flow
- Read-only archive of past lineups and rankings

---

## Data Model

### Users
- id, username, password, isAdmin, avatarColor, createdAt

### Artists
- id, name, year

### Groups (BALI)
- id, name (e.g., "BALI 1"), year, status (null | "current" | "next"), artistIds[], order

### Rankings
- id, userId, artistId, score (1-10), updatedAt

### Settings
- activeYear

---

## Key Components

### ArtistListItem (reusable)
- Artist name
- Your ranking (if exists)
- Other users' avatars (only visible if you've ranked)
- Tap to open ranking drawer
- Used on: main artist list, BALI tab, aggregate view, historical view

---

## Routes (Draft)

- `/` - Login
- `/artists` - Main artist list for active year
- `/artists?tab=bali` - BALI groups view
- `/aggregate` - Aggregate rankings
- `/history` - Previous years
- `/admin` - Admin panel (artists, users, groups, settings)

---

## Phases
- See PRD.md
