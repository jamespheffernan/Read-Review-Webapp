# Read/Review Web App

Read/Review is a local-first progressive web app for capturing articles, PDFs, and notes, then moving them through a focused reading workflow.

The product combines a fast inbox with offline storage, keyboard navigation, bulk triage, readable article snapshots, PDF viewing, tags, and installable PWA behaviour. Saved library data lives in the current browser through IndexedDB; there is no account or cloud-sync service.

## Current capabilities

- Capture URLs and text from the quick-add interface
- Store items, tags, snapshots, highlights, and preferences in IndexedDB
- Move work through Inbox, Later, Shortlist, and Archived states
- Navigate and select items with keyboard shortcuts
- Extract readable article content through an opt-in server route
- Read saved HTML or PDFs in a focused reader
- Install the app and retain its shell for offline use
- Accept content through the Web Share Target API

## Repository layout

- `read-review-webapp` — the Next.js application
- `docs` — the original product plan, conversion notes, roadmap, and scratchpad

The documents record the product's development history. The implementation and this README are the current source of truth where an older plan differs from the code.

## Run locally

Requirements: Node.js 20 or newer.

```bash
cd read-review-webapp
npm ci
npm run dev
```

Open `http://localhost:3000`.

Remote article extraction is disabled by default. To opt in for a trusted local environment:

```bash
ALLOW_REMOTE_EXTRACTION=1 npm run dev
```

The extraction boundary accepts only public HTTP and HTTPS hosts on standard ports, rechecks redirects, limits responses to 2 MB, and sanitizes extracted HTML. It is not intended to be exposed as an unauthenticated public scraping service.

## Verify

```bash
cd read-review-webapp
npm run lint
npx tsc --noEmit
npm run build
npm audit --audit-level=high
```

## Status and privacy

This is a working prototype rather than a hosted service. Browser data is local to the current profile and is not encrypted by the app. Clearing site data removes the library. URL extraction necessarily sends the requested URL to the application's server and causes that server to fetch the remote page; keep the feature disabled when that behaviour is not wanted.

There is no authentication or multi-device sync. Some planned review, export, and collaboration features remain incomplete.

## Licence

No open-source licence has been selected. The source is public for inspection; default copyright rules apply.
