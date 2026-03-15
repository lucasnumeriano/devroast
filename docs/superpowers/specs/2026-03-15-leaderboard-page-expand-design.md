# Leaderboard Page: Code Expand Functionality

**Date:** 2026-03-15
**Status:** Approved

## Problem

The leaderboard page (`/leaderboard`) renders 20 entries with truncated code previews but no way to view the full code. The homepage leaderboard preview already has this capability via `CodeExpandButton` + `CodeModal`, but the full leaderboard page does not.

## Solution

Add the `CodeExpandButton` below each `LeaderboardEntry` on the leaderboard page, reusing the exact pattern from the homepage leaderboard preview.

## Architecture

### Backend

No changes. Existing tRPC procedures cover all needs:

- `leaderboard.getEntries({ limit: 20 })` — fetches the 20 worst-scored roasts
- `leaderboard.getStats()` — fetches total submissions + average score
- `roast.getHighlightedCode({ id })` — lazy-loads Shiki-highlighted HTML (called client-side when modal opens)

### Frontend

**File changed:** `src/app/leaderboard/page.tsx`

The page remains a server component (async RSC). The only change is importing `CodeExpandButton` and rendering it below each `LeaderboardEntry`.

**Before:**
```
LeaderboardPage (RSC)
  for each entry:
    LeaderboardEntry (RSC)
```

**After:**
```
LeaderboardPage (RSC)
  for each entry:
    LeaderboardEntry (RSC)
    CodeExpandButton (client component)
```

### Data Flow

1. Page loads as RSC, fetches 20 entries + stats via server-side `caller`
2. Each entry renders `LeaderboardEntry` with server-side Shiki highlighting for truncated preview
3. Below each entry, `CodeExpandButton` renders as a client island with `roastId={entry.id}`
4. User clicks "expand" -> `CodeExpandButton` opens `CodeModal` dialog
5. `CodeModal` triggers `roast.getHighlightedCode` via tRPC client -> shows full highlighted code

### Components Reused

| Component | Source | Role |
|---|---|---|
| `LeaderboardEntry` | `@/components/ui/leaderboard-entry` | Truncated code preview with rank/score/language |
| `CodeExpandButton` | `@/app/code-expand-button` | Client component: "expand" button + dialog state |
| `CodeModal` | `@/components/ui/code-modal` | Full-screen dialog showing highlighted code |

### No New Components

Everything is already built. The task is wiring existing components together on the leaderboard page.

## Scope

- **1 file changed:** `src/app/leaderboard/page.tsx`
- **0 new files**
- **0 tRPC changes**
- **0 DB changes**
