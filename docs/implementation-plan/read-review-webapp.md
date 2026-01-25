# Read/Review Web Application - Implementation Plan

## Background and Motivation

Converting the iOS Read/Review GTD-aligned capture and triage tool into a web application to enable cross-platform access while maintaining the core principles of zero-friction capture, simple triage flow, and offline-first functionality. The web app will preserve the iPad-first design philosophy while adapting to web browser capabilities and constraints.

### Core Value Proposition
- **Zero-friction capture** from browser bookmarklets, drag/drop, paste
- **Simple triage flow** (Inbox → Later → Shortlist → Archive) with keyboard shortcuts
- **Lightweight reader** with article extraction and PDF viewing
- **Review Mode** for focused reading sessions
- **Local-first privacy** with optional cloud sync

## Key Challenges and Analysis

### Technical Challenges
1. **Article Extraction**: Need web-based Readability implementation instead of iOS native
2. **Offline Functionality**: Service Workers and IndexedDB instead of Core Data
3. **Share/Capture**: Browser extension and bookmarklet instead of iOS Share Sheet
4. **PDF Handling**: PDF.js instead of PDFKit
5. **Storage**: IndexedDB for local storage, optional backend for sync
6. **Responsive Design**: Adapt iPad-first design to work on all screen sizes

### Web-Specific Advantages
1. **Universal Access**: Works on any device with a modern browser
2. **No App Store**: Direct deployment via web URL
3. **Easier Updates**: Instant updates without app review process
4. **Browser Integration**: Bookmarklets and extensions for capture
5. **Web Standards**: Progressive Web App capabilities

## Technology Stack Decision

### Frontend
- **Framework**: Next.js 14+ with App Router (for SSR/SSG capabilities)
- **UI Library**: React with TypeScript
- **Styling**: Tailwind CSS (utility-first, responsive by default)
- **State Management**: Zustand (lightweight, TypeScript-friendly)
- **Data Persistence**: IndexedDB via Dexie.js
- **PDF Viewer**: PDF.js
- **Article Parser**: Readability.js
- **Icons**: Lucide React (consistent icon set)

### Backend (Phase 2)
- **Framework**: Next.js API Routes initially
- **Database**: PostgreSQL with Prisma ORM
- **Auth**: NextAuth.js
- **File Storage**: Local filesystem initially, S3-compatible later
- **Queue**: Bull/BullMQ for background jobs

### Infrastructure
- **Hosting**: Vercel (optimal for Next.js)
- **CDN**: Vercel Edge Network
- **Monitoring**: Vercel Analytics

## High-level Task Breakdown

### Phase 0: Project Setup & Foundation
**Branch Name**: `feature/project-setup`

#### Task 0.1: Initialize Next.js Project
- [ ] Create Next.js 14+ project with TypeScript
- [ ] Configure Tailwind CSS with custom design tokens
- [ ] Set up ESLint and Prettier
- [ ] Create basic folder structure
- **Success Criteria**: 
  - Project runs with `npm run dev`
  - Tailwind classes work
  - TypeScript compilation succeeds

#### Task 0.2: Design System Implementation
- [ ] Convert iOS design tokens to CSS variables
- [ ] Create color palette with light/dark mode support
- [ ] Implement typography scale
- [ ] Create spacing and sizing utilities
- **Success Criteria**:
  - Theme toggle works
  - All semantic colors defined
  - Responsive text sizing works

#### Task 0.3: Core Component Library
- [ ] StatusChip component
- [ ] TimeChip component
- [ ] TagPill component
- [ ] Button variants
- [ ] Card component
- **Success Criteria**:
  - Storybook or component preview page shows all states
  - Components responsive on mobile/tablet/desktop

### Phase 1: Local Data & State Management
**Branch Name**: `feature/data-layer`

#### Task 1.1: Data Models & IndexedDB Setup
- [ ] Define TypeScript interfaces for all entities
- [ ] Set up Dexie.js with IndexedDB schema
- [ ] Create data access layer with CRUD operations
- [ ] Implement migration system
- **Success Criteria**:
  - Can create, read, update, delete items in browser
  - Data persists across browser sessions
  - Schema migrations work

#### Task 1.2: State Management Setup
- [ ] Configure Zustand stores for items, tags, settings
- [ ] Implement store persistence with IndexedDB
- [ ] Create hooks for data access
- **Success Criteria**:
  - State updates reflect immediately in UI
  - State persists on refresh
  - TypeScript types fully integrated

### Phase 2: Core UI - List Views
**Branch Name**: `feature/list-views`

#### Task 2.1: Layout Structure
- [ ] Create responsive layout with sidebar navigation
- [ ] Implement main content area with list/detail split
- [ ] Add mobile-responsive navigation
- **Success Criteria**:
  - Sidebar collapses on mobile
  - Split view works on tablet/desktop
  - Navigation accessible via hamburger on mobile

#### Task 2.2: Item List Component
- [ ] Create ItemRow component with all visual states
- [ ] Implement virtual scrolling for performance
- [ ] Add multi-select with checkboxes
- [ ] Implement keyboard navigation (j/k)
- **Success Criteria**:
  - List renders 1000+ items smoothly
  - Selection state persists
  - Keyboard shortcuts work

#### Task 2.3: Status-based Views
- [ ] Create Inbox view
- [ ] Create Later view
- [ ] Create Shortlist view
- [ ] Create Archive view
- [ ] Add item counts to navigation
- **Success Criteria**:
  - Items filter correctly by status
  - Counts update in real-time
  - Views maintain scroll position

### Phase 3: Capture Mechanisms
**Branch Name**: `feature/capture`

#### Task 3.1: Quick Add Bar
- [ ] Create floating add button and input field
- [ ] Implement URL detection and validation
- [ ] Add clipboard detection with permission handling
- [ ] Create keyboard shortcut (Cmd/Ctrl+K)
- **Success Criteria**:
  - Can add URLs quickly
  - Clipboard suggestion appears when URL detected
  - Duplicate detection works

#### Task 3.2: Drag and Drop
- [ ] Implement drop zones on lists
- [ ] Handle URL drops from browser
- [ ] Handle file drops (PDF, images)
- [ ] Visual feedback during drag
- **Success Criteria**:
  - Can drag URLs from address bar
  - PDF files upload and store locally
  - Drop indicators clear

#### Task 3.3: Browser Extension/Bookmarklet
- [ ] Create bookmarklet for one-click capture
- [ ] Add current page metadata extraction
- [ ] Handle selected text as note
- **Success Criteria**:
  - Bookmarklet captures current page
  - Selected text saved as note
  - Works across major browsers

### Phase 4: Reader & Content Extraction
**Branch Name**: `feature/reader`

#### Task 4.1: Article Reader View
- [ ] Integrate Readability.js
- [ ] Create clean reader layout
- [ ] Add font size controls
- [ ] Implement reading progress indicator
- **Success Criteria**:
  - 80% of articles extract cleanly
  - Font sizing persists
  - Readable on all devices

#### Task 4.2: PDF Viewer
- [ ] Integrate PDF.js
- [ ] Add page navigation
- [ ] Implement zoom controls
- [ ] Add download original option
- **Success Criteria**:
  - PDFs render correctly
  - Navigation smooth
  - Mobile pinch-zoom works

#### Task 4.3: Content Storage
- [ ] Store extracted article content locally
- [ ] Implement image caching strategy
- [ ] Add offline availability indicator
- **Success Criteria**:
  - Articles viewable offline
  - Images load from cache
  - Storage quotas managed

### Phase 5: Triage & Organization
**Branch Name**: `feature/triage`

#### Task 5.1: Swipe Gestures (Touch)
- [ ] Implement touch gesture detection
- [ ] Add swipe actions for status changes
- [ ] Create visual feedback during swipe
- [ ] Add undo functionality
- **Success Criteria**:
  - Swipe right → Later
  - Swipe far right → Shortlist
  - Swipe left → Archive
  - Undo appears for 5 seconds

#### Task 5.2: Keyboard Shortcuts
- [ ] Implement global keyboard handler
- [ ] Add shortcuts for navigation (j/k)
- [ ] Add shortcuts for status (1/2/3/a)
- [ ] Create keyboard shortcut help modal
- **Success Criteria**:
  - All shortcuts work as specified
  - No conflicts with browser shortcuts
  - Help modal shows with ?

#### Task 5.3: Tags System
- [ ] Create tag management UI
- [ ] Implement tag autocomplete
- [ ] Add tag filtering in views
- [ ] Create tag editor modal
- **Success Criteria**:
  - Can add/remove tags from items
  - Autocomplete shows recent tags
  - Filter by multiple tags works

### Phase 6: Review Mode
**Branch Name**: `feature/review-mode`

#### Task 6.1: Review Interface
- [ ] Create focused review layout
- [ ] Implement card-based navigation
- [ ] Add progress indicators
- [ ] Create action buttons (Skip, Later, Complete, Archive)
- **Success Criteria**:
  - One item visible at a time
  - Progress bar shows completion
  - Keyboard navigation works

#### Task 6.2: Session Tracking
- [ ] Track review session statistics
- [ ] Store session history
- [ ] Create session summary screen
- **Success Criteria**:
  - Time spent tracked
  - Items reviewed counted
  - History viewable

### Phase 7: Progressive Web App
**Branch Name**: `feature/pwa`

#### Task 7.1: Service Worker & Offline
- [ ] Implement service worker with caching strategy
- [ ] Add offline page
- [ ] Create update notification
- **Success Criteria**:
  - App works offline
  - Updates prompt user
  - Cache invalidation works

#### Task 7.2: PWA Features
- [ ] Add web app manifest
- [ ] Implement install prompt
- [ ] Configure app icons and splash screens
- [ ] Add share target for PWA
- **Success Criteria**:
  - Installable on mobile/desktop
  - Launches fullscreen
  - Appears in share menu (where supported)

### Phase 8: Export & Integrations
**Branch Name**: `feature/export`

#### Task 8.1: Export Functionality
- [ ] Markdown export with templates
- [ ] JSON export for backup
- [ ] CSV export for spreadsheets
- **Success Criteria**:
  - Exports include all metadata
  - Markdown formatted correctly
  - Batch export works

#### Task 8.2: Import Functionality
- [ ] Import from JSON backup
- [ ] Import from Instapaper/Pocket export
- [ ] Duplicate detection on import
- **Success Criteria**:
  - Previous exports re-importable
  - No data loss on import
  - Duplicates handled gracefully

### Phase 9: Backend & Sync (Optional)
**Branch Name**: `feature/backend-sync`

#### Task 9.1: Authentication
- [ ] Implement NextAuth.js
- [ ] Add login/signup pages
- [ ] Create account settings
- **Success Criteria**:
  - Can create account
  - Session persists
  - Logout works

#### Task 9.2: Data Sync
- [ ] Create sync API endpoints
- [ ] Implement conflict resolution
- [ ] Add sync status indicators
- **Success Criteria**:
  - Changes sync within 5 seconds
  - Conflicts resolved by last-write
  - Offline changes sync when online

## Project Status Board

### TODO (Not Started)
- [ ] Data layer implementation (IndexedDB + Dexie.js)
- [ ] State management setup (Zustand)
- [ ] List views and navigation
- [ ] Capture mechanisms
- [ ] Reader implementation
- [ ] Triage features
- [ ] Review mode
- [ ] PWA features
- [ ] Export/Import
- [ ] Backend sync

### IN PROGRESS
- None

### COMPLETED
- [x] Implementation plan creation
- [x] Project initialization (Next.js + TypeScript)
- [x] Design system setup (Tailwind CSS v4)
- [x] Component library (StatusChip, TimeChip, TagPill)
- [x] Folder structure and utilities

### BLOCKED
- None

## Current Status / Progress Tracking

**Current Phase**: Phase 1 - Data Layer (Ready to Start)
**Last Update**: 2024-12-29
**Next Milestone**: IndexedDB setup with Dexie.js

### Recent Progress
- ✅ **Phase 0 Complete**: Project setup and design system
  - Next.js 14+ initialized with TypeScript
  - Tailwind CSS v4 configured with iOS design tokens
  - ESLint and Prettier set up
  - Folder structure created
  - TypeScript interfaces defined
  - Utility functions implemented
  - Core components built (StatusChip, TimeChip, TagPill)
  - Component showcase page created
  - Build passes with zero errors

### Completed Tasks
- [x] Initialize Next.js 14+ project with TypeScript and basic configuration
- [x] Configure Tailwind CSS with custom design tokens from iOS plan  
- [x] Set up ESLint, Prettier, and development tooling
- [x] Create basic folder structure and initial components
- [x] Implement design system with colors, spacing, and typography

## Executor's Feedback or Assistance Requests

### Phase 0 Completion Report (2024-12-29)

**Status**: ✅ Successfully completed all Phase 0 objectives

**What was accomplished:**
- Next.js 14+ project created with TypeScript, Tailwind CSS v4, ESLint, Prettier
- Design system implemented with iOS-inspired tokens (4pt grid, semantic colors, typography)
- Comprehensive TypeScript interfaces defined for all data models
- Utility functions created for common operations (URL handling, text processing, etc.)
- Core UI components built: StatusChip, TimeChip, TagPill
- Component showcase page demonstrates design system
- Build pipeline working with zero errors

**Technical decisions made:**
- Used Tailwind CSS v4 with CSS-based configuration (cleaner than JS config)
- Implemented semantic color system with light/dark mode support
- Created comprehensive utility functions for future use
- Followed iOS design principles for component styling

**Ready for Phase 1**: Data layer implementation with IndexedDB and Dexie.js

**No blockers or assistance needed at this time.**

## Definition of Done

Each phase is considered complete when:
1. All subtasks marked complete
2. Success criteria verified
3. Code committed to feature branch
4. Tests written and passing
5. Documentation updated
6. Manual testing completed
7. PR created and ready for review

## Risk Mitigation

1. **Browser Compatibility**: Test on Chrome, Firefox, Safari, Edge regularly
2. **Performance**: Profile and optimize with large datasets early
3. **Storage Limits**: Implement quota management and cleanup
4. **Mobile Experience**: Test on actual devices, not just responsive mode
5. **Data Loss**: Implement auto-save and backup reminders

## MVP Definition (Phase 0-4)

The minimum viable product includes:
- Project setup with design system
- Local data storage with IndexedDB
- List views with basic navigation
- Quick capture from URL/paste
- Article reader with extraction
- Basic triage (status changes)

This provides core value of capture and read without requiring backend infrastructure.
