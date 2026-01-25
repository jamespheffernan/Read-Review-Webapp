# Read/Review Web App - Development Roadmap

## 🎯 Project Vision
Transform the iOS Read/Review GTD app into a **web-first, local-first** application that works on any device while maintaining the core philosophy of zero-friction capture and focused reading.

## 📊 Development Timeline

### Phase 0: Foundation (Week 1)
**Goal**: Set up project infrastructure and design system
- ✅ Planning documents complete
- ⏳ Next.js + TypeScript setup
- ⏳ Tailwind CSS with design tokens
- ⏳ Component library basics

### Phase 1: Data Layer (Week 1-2)
**Goal**: Local-first data persistence
- IndexedDB setup with Dexie.js
- State management with Zustand
- TypeScript models and interfaces

### Phase 2: Core UI (Week 2-3)
**Goal**: Basic list and navigation
- Responsive layout structure
- Item list with virtual scrolling
- Status-based views (Inbox, Later, Shortlist)

### Phase 3: Capture (Week 3-4)
**Goal**: Multiple ways to add content
- Quick Add bar with URL detection
- Drag and drop support
- Bookmarklet for browser integration

### Phase 4: Reader (Week 4-5)
**Goal**: Clean reading experience
- Article extraction with Readability.js
- PDF viewer with PDF.js
- Offline content storage

### Phase 5: Triage (Week 5-6)
**Goal**: Efficient content organization
- Swipe gestures for status changes
- Keyboard shortcuts
- Tag system with autocomplete

### Phase 6: Review Mode (Week 6-7)
**Goal**: Focused reading sessions
- Card-based interface
- Session tracking
- Progress indicators

### Phase 7: PWA (Week 7-8)
**Goal**: App-like experience
- Service Worker for offline
- Install prompts
- Mobile optimizations

### Phase 8: Export (Week 8)
**Goal**: Data portability
- Markdown export
- JSON backup/restore
- Integration with other tools

### Phase 9: Backend (Future)
**Goal**: Multi-device sync (optional)
- Authentication
- Cloud sync
- Collaboration features

## 🚀 MVP Definition (Phases 0-4)
**Target**: 4-5 weeks

The MVP includes:
- ✨ Local data storage
- 📋 List views with navigation
- ➕ Quick capture from URL/paste
- 📖 Article reader with extraction
- 🏷️ Basic status management

## 🎯 Success Metrics

| Metric | Target |
|--------|--------|
| First Paint | < 2.5s |
| Time to Interactive | < 3.5s |
| Capture Time | < 2s |
| List Performance | 60fps with 1000+ items |
| Browser Support | Chrome, Safari, Firefox, Edge |

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS
- **State**: Zustand
- **Storage**: IndexedDB (Dexie.js)
- **PDF**: PDF.js
- **Articles**: Readability.js
- **Icons**: Lucide React
- **Hosting**: Vercel

## 📝 Next Steps

1. **Review this plan** - Please review the implementation plan and roadmap
2. **Approve or request changes** - Let me know if any adjustments are needed
3. **Begin Executor mode** - Start with Phase 0 project setup

## 📁 Documentation

- **Main Plan**: `docs/implementation-plan/read-review-webapp.md`
- **Conversion Notes**: `docs/ios-to-web-conversion-notes.md`
- **Scratchpad**: `docs/scratchpad.md`

---

*Ready to begin implementation upon your approval!*
