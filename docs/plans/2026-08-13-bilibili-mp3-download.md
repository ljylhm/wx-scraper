# Bilibili MP3 Download Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Convert the first part of an eligible Bilibili video into a streamed 192 kbps MP3 download from the existing music search page.

**Architecture:** A Node.js App Router endpoint resolves trusted Bilibili metadata and DASH audio, pipes the upstream audio through a bundled FFmpeg process, and streams MP3 bytes to the client. The client reads the stream with progress feedback and saves the completed Blob locally.

**Tech Stack:** Next.js 16, TypeScript, Axios, Node streams and child processes, ffmpeg-static, React 19.

---

### Task 1: Pure conversion metadata helpers

**Files:**
- Create: `src/lib/bilibiliMp3.ts`
- Create: `src/lib/bilibiliMp3.test.ts`

**Steps:**
1. Write failing tests for BV validation, first-part selection, ten-minute rejection, audio selection, and safe filenames.
2. Run the focused tests and confirm failure.
3. Implement the smallest pure helpers and typed upstream structures.
4. Run the focused tests and confirm all cases pass.

### Task 2: FFmpeg dependency and deployment tracing

**Files:**
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`
- Modify: `next.config.ts`

**Steps:**
1. Add `ffmpeg-static` as a production dependency.
2. Include the binary in Next.js output file tracing for the MP3 route.
3. Verify the resolved binary exists and prints its version locally.

### Task 3: Streaming MP3 API

**Files:**
- Create: `src/app/api/bilibili/mp3/route.ts`
- Optionally refactor shared Bilibili visitor utilities if duplication becomes material.

**Steps:**
1. Resolve trusted video metadata and enforce the first-part ten-minute rule.
2. Resolve DASH playback data and select the highest-bandwidth audio stream.
3. Fetch the audio stream with Bilibili headers and pipe it into FFmpeg.
4. Stream FFmpeg stdout as `audio/mpeg` with safe attachment headers.
5. Map validation, upstream, timeout, process, and concurrency errors to concise responses.

### Task 4: Download interaction

**Files:**
- Modify: `src/app/music/page.tsx`
- Modify: `src/app/music/music.css`

**Steps:**
1. Enable the per-card MP3 button and allow only one active task.
2. Read streamed bytes and display received megabytes.
3. Save the completed Blob using the server-provided filename.
4. Add per-card success/error feedback and the first-P/copyright notice.

### Task 5: Verification

**Steps:**
1. Run helper unit tests and route-focused ESLint.
2. Run TypeScript and a production build.
3. Convert a short public test video and validate output with FFprobe/FFmpeg.
4. Verify desktop and mobile UI states, then commit only MP3-related files.
