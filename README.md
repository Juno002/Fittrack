# Fittrack

Fittrack is a local-first workout prototype focused on real training data, recovery signals, nutrition logging, and sleep tracking. Every visible surface in the app is backed by persisted state instead of mock data.

## What works today

- Start, pause, resume, discard, and finish workout drafts.
- Build sessions from the shared exercise catalog or custom exercises.
- Persist workout history, nutrition entries, sleep logs, targets, and profile data in browser storage.
- Drive dashboard, timeline, stats, and recovery views from the same state model.

## Run locally

**Prerequisites:** Node.js 20+

1. Install dependencies with `npm install`
2. Start the dev server with `npm run dev`
3. Open [http://localhost:3000](http://localhost:3000)

## Quality commands

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- `npm run verify`
