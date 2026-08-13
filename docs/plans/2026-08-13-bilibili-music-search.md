# Bilibili Music Search Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a `/music` route that searches Bilibili videos twelve at a time and presents normalized, responsive search results.

**Architecture:** A Next.js client page calls a same-origin App Router API. The API validates pagination, fetches Bilibili from the Node.js runtime, and normalizes upstream records through pure helpers that are covered by unit tests.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, Lucide React, Node test runner through `tsx`.

---

### Task 1: Search data model and normalization

**Files:**
- Create: `src/lib/bilibili.ts`
- Test: `src/lib/bilibili.test.ts`

**Step 1:** Add failing tests for HTML-title cleanup, image URL normalization, count formatting inputs, pagination validation, and malformed-record filtering.

**Step 2:** Run `pnpm exec tsx --test src/lib/bilibili.test.ts` and confirm the missing module failure.

**Step 3:** Implement exported types, `parseSearchParams`, and `normalizeSearchResponse` with no network side effects.

**Step 4:** Run the focused test and confirm all cases pass.

### Task 2: Server-side Bilibili search API

**Files:**
- Create: `src/app/api/bilibili/search/route.ts`

**Step 1:** Implement `GET` parameter parsing with `keyword`, `page`, and `pageSize`.

**Step 2:** Fetch Bilibili's video search endpoint with an 8-second abort signal, browser-compatible headers, and Next.js short-term caching.

**Step 3:** Convert upstream failures into concise 400, 502, and 504 JSON responses.

**Step 4:** Test the endpoint locally with `curl` and verify the response contains at most 12 normalized items.

### Task 3: Music search page

**Files:**
- Create: `src/app/music/page.tsx`
- Create: `src/app/music/music.css`

**Step 1:** Build the search form and accessible labels with submit-only requests.

**Step 2:** Add loading, error, initial, empty, result, and load-more states.

**Step 3:** Create responsive result cards showing cover, title, author, duration, views, date, Bilibili link, and disabled MP3 action.

**Step 4:** Add a cohesive dark music-console visual system with responsive rules and reduced-motion handling.

### Task 4: Verification

**Files:**
- Modify only implementation files if verification reveals issues.

**Step 1:** Run `pnpm exec tsx --test src/lib/bilibili.test.ts`.

**Step 2:** Run `pnpm lint`.

**Step 3:** Run `pnpm exec tsc --noEmit`.

**Step 4:** Run `pnpm build`.

**Step 5:** Start the production server, exercise `/api/bilibili/search`, and visually inspect `/music` at desktop and mobile widths.
