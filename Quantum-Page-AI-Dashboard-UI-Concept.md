# Quantum-Page AI — Dashboard UI Design Concept

## 1. Visual Language & Design Principles
| Principle                | Implementation                                                                                     |
|--------------------------|-----------------------------------------------------------------------------------------------------|
| Futuristic Minimalism    | Generous negative space, sharp geometric lines, subtle glass-morphism panels, micro-animations.     |
| Data-First Aesthetics    | KPI numbers always foregrounded; typography hierarchy that makes metrics readable at a glance.      |
| Dark-Mode Native         | Default UI is deep graphite (`#0F1115`) with neon accent hues; light mode is opt-in.                |
| Consistency & Familiarity| Material-influenced elevation, 8-pt spacing grid, consistent iconography (Lucide).                  |
| Accessibility            | WCAG 2.2 AA color contrast, font scaling, keyboard shortcuts, screen-reader landmarks.              |

### Core Palette
| Token          | Hex      | Usage                               |
|----------------|----------|-------------------------------------|
| Carbon         | #0F1115  | Body background                     |
| Onyx           | #171B22  | Panel surface                       |
| Neon Azure     | #28C8FF  | Primary action, line charts         |
| Quantum Violet | #7B6CFF  | Secondary accent, progress rings    |
| Lime Pulse     | #C6FF4F  | Success, up-trends                  |
| Signal Amber   | #FFB547  | Warning, neutral change             |
| Critical Red   | #FF5470  | Errors, down-trends                 |
| Ice White      | #E9F1FF  | Text on dark surfaces               |

## 2. Main Dashboard Layout

```
┌───────────────────────────────────────────────────────────────────────────────┐
│ Global Top Bar: Brand logo · Site Switcher · Search Cmd+K · Alerts · Profile │
├──────────────┬───────────────────────────────────────────────────────────────┤
│ Vertical Nav │ 1. Overview                                                   │
│ (Collapsible)│ 2. Traffic & SEO  3. Content  4. Funnels  5. Monetisation     │
│              │ 6. AI Lab   7. Integrations  8. Settings                      │
├──────────────┴───────────────────────────────────────────────────────────────┤
│ Overview Workspace (tabbed)                                                  │
│ ┌───────────────┬──────────────┬──────────────┬──────────────┐               │
│ │ Traffic Card  │ Revenue Card │ Rankings Card│ Health Card  │  KPI Glance   │
│ └───────────────┴──────────────┴──────────────┴──────────────┘               │
│ • Predictive Line Chart (30-day) • Conversion Funnel • Live Visitor Map      │
│ • AI Insights Drawer (right)                                                 │
└───────────────────────────────────────────────────────────────────────────────┘
```

Key components  
1. **Global Top Bar** – persistent brand identity, quick-site switch (dropdown with favicons & search), omnipresent command palette, notification bell with badge, profile/avatar.  
2. **Vertical Navigation** – collapsible to icons only; sections group related features; each item surfaces contextual sub-menu on hover/focus.  
3. **Workspace Canvas** – adaptive grid; cards are drag-re-orderable and savable per user.  
4. **Right-Side Drawer** – dynamic zone used by AI Coach, contextual help, or settings without leaving page.  

## 3. Navigation Between Website Types & Features
1. **Site Switcher** (Cmd/Ctrl+Shift+S): searchable list of all owned sites; pins most-used.  
2. **Website Type Badges** – color-coded chips (E-com 🔵, Blog 🟣, Local 🟢, Review 🟡, Funnel 🟠, PBN ⚫). Selecting a badge filters navigation, showing only relevant modules.  
3. **Feature Breadcrumbs** – e.g., *BlogSite › Content › Articles › Edit* for orientation.  
4. **Universal Action Button** (“+ Create”): reveals radial menu to create post, product, funnel step, campaign depending on active site type.

## 4. Analytics Visualisation Components
| Widget                | Visualisation | Interaction Pattern                                      |
|-----------------------|---------------|----------------------------------------------------------|
| KPI Cards             | Numeric + sparkline | Hover to reveal delta vs previous period.            |
| Predictive Line Chart | Gradient neon line with shadow | Toggle metrics, brush to zoom range.          |
| Conversion Funnel     | 3-D stacked bars | Click stage => causes cohort table to slide up.       |
| Geo Heat Map          | D3 topojson globe | Spin/zoom; click country → opens local rankings.     |
| Core Web Vitals Ring  | Circular progress segmented by LCP/FID/CLS | Segments pulse if threshold breached. |
| SERP Table            | Paginated table with rank trend arrows | Row click opens keyword detail side panel.|
| Revenue Attribution   | Sunburst chart | Drill-down into channel > campaign > asset.            |

Micro-animation cues (0.2 s easing) signal updates; data refresh badge pulses in **Neon Azure** when real-time stream active.

## 5. AI Recommendations & Insights Presentation
- **AI Insights Drawer** (slides from right)  
  • “Traffic Surge” card with root-cause, predicted impact, 1-click actions.  
  • Chat interface; context chips auto-fill (site, page, metric).  
- **Inline Nudges** – small glowing icon appears on widgets; clicking reveals specific guidance (e.g., “Improve internal links on /blog/ai-trends, estimated 8 % lift”).  
- **Growth Playbook Board** – Kanban of tasks (Backlog → Planned → Done) auto-curated daily; drag to reorder; tasks auto-close when KPI met.  
- **Voice Briefing** – Play button summarises daily report using TTS.

## 6. Mobile App Interface

### Relationship to Web
- Shares design tokens & component library; React Native theme mirrors dark-mode style.  
- Bottom Tab Bar replaces vertical nav: Overview · Traffic · Content · AI Coach · Settings.  
- Cards become stacked carousel; long-press to reorder.  
- Real-time charts use lighter data density; pinch-zoom supported.  
- Push Notifications deep-link into AI Insights screen.

### Unique Mobile-First Features
| Feature            | Description                                                     |
|--------------------|-----------------------------------------------------------------|
| Quick-Glance Widget| Home-screen iOS/Android widget with traffic, revenue, rankings. |
| Voice-to-Blog      | Mic button launches recorder → AI cleans & posts draft.         |
| Haptic Alerts      | Traffic spike delivers subtle vibration pattern + color flash.  |
| Offline Caching    | Last 7-day analytics stored locally for flights/no-signal.      |

### Interaction Patterns
- Swipe down = global search / command palette.  
- Shake device = open feedback/debug panel.  
- L-swipe on KPI card = share screenshot; R-swipe = bookmark insight.

---

## 7. States & Feedback
| State               | Visual Feedback                                                     |
|---------------------|---------------------------------------------------------------------|
| Data Loading        | Skeleton shimmer + progress bar top of panel.                      |
| Success Action      | Panel glows Lime Pulse border 500 ms; toast with “Undo” link.       |
| Error/Failure       | Card shakes lightly, border turns Critical Red, error tooltip.      |
| Empty State         | Illustrated robot mascot with quick-start CTA.                      |

## 8. Prototype Assets
- Figma component library with atomic tokens, variants, and motion guidelines.  
- Icon set: 150 custom line icons in SVG.  
- Font stack: `Inter` for body, `Sora` for headlines, monospace `IBM Plex Mono` for code snippets.

*End of UI concept*
