# iOS to Web Conversion - Key Decisions & Mappings

## Critical Technology Mappings

### iOS → Web Equivalents

| iOS Component | Web Equivalent | Notes |
|--------------|----------------|-------|
| SwiftUI | React + Tailwind CSS | Component-based UI with utility styling |
| Core Data/SQLite | IndexedDB + Dexie.js | Browser-native storage with better API |
| Share Extension | Bookmarklet/Browser Extension | One-click capture from any page |
| CloudKit | Optional PostgreSQL + API | Start local-first, add sync later |
| PDFKit | PDF.js | Full-featured PDF rendering |
| Readability (Swift) | Readability.js | Same algorithm, JS implementation |
| SF Symbols | Lucide Icons | Consistent, open-source icon set |
| BGTaskScheduler | Service Worker | Background sync and caching |
| App Groups | Single origin storage | Simpler in web context |

## Feature Adaptations

### Capture Methods
- **iOS**: Share Sheet, Drag & Drop, Email forward
- **Web**: Bookmarklet, Browser Extension, Drag & Drop, Web Share API (limited)
- **Decision**: Focus on bookmarklet first (widest compatibility), extension later

### Gestures
- **iOS**: Native swipe gestures
- **Web**: Touch events with Hammer.js or native touch API
- **Decision**: Implement both touch and mouse interactions

### Offline
- **iOS**: Built-in with Core Data
- **Web**: Service Worker + Cache API + IndexedDB
- **Decision**: Progressive enhancement - works online first, adds offline capabilities

### Storage Limits
- **iOS**: Practically unlimited
- **Web**: Browser quotas (typically 50% of free disk)
- **Decision**: Implement storage management and old item cleanup

## Design Adaptations

### Responsive Breakpoints
- Mobile: < 640px (phone)
- Tablet: 640px - 1024px (iPad portrait)
- Desktop: > 1024px (iPad landscape+)

### Navigation Pattern
- **Mobile**: Bottom tab bar or hamburger menu
- **Tablet**: Collapsible sidebar
- **Desktop**: Fixed sidebar + list + detail (3-column)

### Touch Targets
- Maintain 44pt (iOS) = 44px minimum touch targets
- Increase to 48px for primary actions (Material Design guideline)

## Performance Targets (Web-Adjusted)

| Metric | iOS Target | Web Target | Measurement |
|--------|------------|------------|-------------|
| Cold Start | < 1.2s | < 2.5s (FCP) | First Contentful Paint |
| Time to Interactive | < 1.6s | < 3.5s | TTI metric |
| List Scroll | 60fps | 60fps | Same performance |
| Capture Time | < 2s | < 2s | User action to saved |
| Article Load | < 2.5s | < 3s | URL to readable |

## Progressive Enhancement Strategy

### Phase 1: Core Web App (MVP)
- Works in any modern browser
- Local storage only
- Basic capture and read

### Phase 2: Enhanced Features
- Service Worker for offline
- Touch gestures
- Keyboard shortcuts
- PWA installation

### Phase 3: Advanced Integration
- Browser extension
- Backend sync
- Real-time collaboration
- Advanced exports

## Browser Support Matrix

### Tier 1 (Full Support)
- Chrome 90+ (Desktop & Mobile)
- Edge 90+
- Safari 15+ (macOS & iOS)
- Firefox 90+

### Tier 2 (Degraded Experience)
- Older versions with polyfills
- No offline support
- Basic functionality only

## Development Priorities

1. **Start Simple**: Basic CRUD and reading experience
2. **Mobile-First**: Design for phone, enhance for tablet/desktop
3. **Local-First**: Everything works without backend initially
4. **Progressive**: Add advanced features incrementally
5. **Performance**: Measure and optimize early and often

## Key Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Browser storage limits | High | Implement quota management, old item cleanup |
| Cross-browser compatibility | Medium | Use established libraries, test regularly |
| Performance with large datasets | High | Virtual scrolling, pagination, lazy loading |
| Article extraction quality | Medium | Multiple fallback strategies, manual edit option |
| Touch gesture conflicts | Low | Provide alternative interactions |

## Success Metrics

- **Adoption**: 100 daily active users within 3 months
- **Performance**: 95th percentile load time < 4s
- **Reliability**: < 1% error rate for core functions  
- **Engagement**: Average 3+ sessions per week per user
- **Retention**: 60% monthly retention after 3 months

## Next Steps

1. Review and approve implementation plan
2. Set up development environment
3. Begin Phase 0: Project Setup
4. Create initial component library
5. Implement data layer
6. Build first user-facing feature (Quick Add)
