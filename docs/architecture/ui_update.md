# 🎨 COMPREHENSIVE UI/UX TRANSFORMATION PLAN
## Enterprise-Grade Document Collaboration Platform

---

## 🎯 VISION & DESIGN PHILOSOPHY

### Core Principles
1. **Progressive Disclosure** - Show what's needed, when it's needed
2. **Spatial Hierarchy** - Every element has its place and purpose
3. **Micro-interactions** - Delight users with purposeful animations
4. **Accessibility First** - WCAG 2.1 AA compliance minimum
5. **Performance-Driven** - 60fps animations, <100ms response times

### Design DNA
- **Modern Minimalism** - Clean lines, purposeful whitespace
- **Information Architecture** - Clear visual hierarchy at all times
- **Cognitive Load Reduction** - One primary action per view
- **Seamless Transitions** - State changes feel natural, not jarring

---

## 🔴 CRITICAL ISSUES ANALYSIS

### 1. Layout Collapse Syndrome
**Current State:** Complete UI breakdown
- Header: 0% visibility
- Sidebar: 0% visibility  
- Chat: 100% viewport occupation (CRITICAL)
- Navigation: Non-existent

**Root Causes:**
```
├─ CSS Specificity Conflicts
├─ Z-index Stack Mismanagement
├─ Flex/Grid Layout Failures
├─ Overflow Cascade Issues
└─ Component Mounting Order Problems
```

**Impact:** 🔥 **SYSTEM UNUSABLE** - Users cannot perform ANY primary actions

---

### 2. Information Architecture Breakdown

**Navigation Hierarchy (Currently BROKEN):**
```
❌ Level 0: Global Navigation (Header) → INVISIBLE
❌ Level 1: Project Navigation (Sidebar) → INVISIBLE
❌ Level 2: Document Context (Canvas) → OBSCURED
✅ Level 3: Chat Utility → OVER-PROMINENT (Wrong!)
```

**Should Be:**
```
✅ Level 0: Header (Always Visible) - Auth, Search, Notifications
✅ Level 1: Sidebar (Contextual Toggle) - Projects, Recent Files
✅ Level 2: Canvas (Primary Focus) - Document Workspace
✅ Level 3: Chat (Auxiliary Tool) - Floating Button → Expandable
```

---

## ✨ TRANSFORMATION BLUEPRINT

### PHASE 1: FOUNDATION LAYER (Critical Path)

#### 1.1 Root Layout Architecture
```css
/* CSS Reset & Foundation */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html {
  font-size: 16px; /* Base for rem calculations */
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  line-height: 1.6;
  overflow: hidden; /* Prevent body scroll */
}

#root {
  width: 100vw;
  height: 100vh;
  height: 100dvh; /* Dynamic viewport height for mobile */
  position: fixed;
  top: 0;
  left: 0;
}

/* App Container - Master Grid */
.app-container {
  display: grid;
  grid-template-rows: 64px 1fr; /* Header + Content */
  grid-template-columns: auto 1fr; /* Sidebar + Main */
  width: 100%;
  height: 100%;
  overflow: hidden;
}
```

#### 1.2 Z-Index Management System
```typescript
// z-index.constants.ts
export const Z_INDEX = {
  BASE: 0,
  DROPDOWN: 1000,
  STICKY: 1020,
  FIXED: 1030,
  MODAL_BACKDROP: 1040,
  MODAL: 1050,
  POPOVER: 1060,
  TOOLTIP: 1070,
  NOTIFICATION: 1080,
  CHAT_BUTTON: 1090,
  CHAT_WIDGET: 1095,
} as const;
```

---

### PHASE 2: HEADER RECONSTRUCTION (Priority: P0)

#### 2.1 Header Component Specification

**Layout Structure:**
```
┌─────────────────────────────────────────────────────────────┐
│ [Logo] [Breadcrumb]        [Search] [Notif] [Theme] [User] │ 64px
└─────────────────────────────────────────────────────────────┘
```

**Technical Requirements:**
```typescript
interface HeaderProps {
  position: 'fixed' | 'sticky'; // Fixed for app, sticky for docs
  elevation: 0 | 1 | 2 | 3; // Shadow depth
  transparent?: boolean; // Glassmorphism effect
  blur?: boolean; // Backdrop blur
}

const headerStyles = {
  position: 'sticky',
  top: 0,
  left: 0,
  right: 0,
  height: '64px',
  zIndex: Z_INDEX.STICKY,
  backdropFilter: 'blur(12px) saturate(180%)',
  backgroundColor: 'rgba(var(--header-bg), 0.8)',
  borderBottom: '1px solid rgba(var(--border), 0.12)',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
};
```

**Key Features:**
- 🎯 **Persistent Visibility** - Never hidden, always accessible
- 🌊 **Scroll Behavior** - Subtle shadow on scroll for depth
- 🎨 **Glassmorphism** - Translucent with backdrop blur
- ⚡ **Performance** - GPU-accelerated transforms only
- 📱 **Responsive** - Adaptive layout for mobile

**Component Breakdown:**

1. **Logo/Brand** (Left)
   - Size: 32x32px icon + text
   - Click: Navigate to dashboard
   - Animation: Subtle scale on hover (1.05x)

2. **Breadcrumb Navigation** (Center-Left)
   - Show: Workspace → Project → Document
   - Max depth: 3 levels
   - Truncate: Long names with tooltip
   - Separator: "/" or "›" with subtle opacity

3. **Global Search** (Center)
   - Keyboard shortcut: Cmd/Ctrl + K
   - Placeholder: "Search projects, docs, or type /"
   - Autocomplete: Recent items + suggestions
   - Icon: Magnifying glass (Lucide Search)

4. **Utility Bar** (Right)
   ```tsx
   <div className="flex items-center gap-3">
     <NotificationBell unreadCount={3} />
     <ThemeToggle currentTheme="dark" />
     <UserMenu 
       user={currentUser}
       avatar={avatarUrl}
       showStatus={true}
     />
   </div>
   ```

5. **Mobile Adaptations**
   - Hide breadcrumb on <768px
   - Collapse search to icon button
   - Hamburger menu for sidebar toggle

---

### PHASE 3: SIDEBAR TRANSFORMATION (Priority: P0)

#### 3.1 Sidebar Architecture

**Desktop Layout:**
```
┌──────────────────┐
│  [+ New Project] │ ← Primary CTA
├──────────────────┤
│  🔍 Search       │ ← Instant filter
├──────────────────┤
│  📁 Projects     │ ← Section header
│  ├─ Project A    │
│  ├─ Project B    │
│  └─ Project C    │
├──────────────────┤
│  🕐 Recent       │ ← Smart section
│  ├─ Doc 1        │
│  └─ Doc 2        │
├──────────────────┤
│  ⭐ Starred      │ ← Favorites
└──────────────────┘
```

**Specifications:**
```typescript
interface SidebarConfig {
  width: {
    desktop: '280px',
    tablet: '240px',
    mobile: '100vw', // Full overlay
  };
  behavior: {
    desktop: 'persistent', // Always visible
    tablet: 'persistent',
    mobile: 'overlay', // Slide-in drawer
  };
  animation: {
    duration: '300ms',
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    transform: 'translateX', // GPU-accelerated
  };
}
```

**Enhanced Features:**

1. **Smart Project List**
   ```tsx
   <ProjectList
     sortBy="lastAccessed" // or 'name', 'created'
     groupBy="workspace" // Optional grouping
     showThumbnails={true}
     virtualized={true} // For 100+ projects
   />
   ```

2. **Search/Filter Bar**
   - Debounced input: 150ms
   - Fuzzy matching: Fuse.js or similar
   - Highlight matches: Mark.js
   - Clear button: X icon (always visible when typing)

3. **Empty States**
   ```tsx
   {projects.length === 0 && (
     <EmptyState
       icon={<FolderPlus />}
       title="No projects yet"
       description="Create your first project to get started"
       action={
         <Button onClick={createProject}>
           Create Project
         </Button>
       }
     />
   )}
   ```

4. **Context Menu**
   - Right-click project: Rename, Delete, Duplicate, Star
   - Keyboard shortcuts: Arrow keys + Enter
   - Bulk actions: Shift+Click for multi-select

5. **Collapse/Expand Sections**
   - Accordion behavior
   - Save state in localStorage
   - Animate height with `auto` → `0` transition

#### 3.2 Mobile Sidebar Behavior

**Trigger Mechanisms:**
1. Hamburger button in header (☰)
2. Swipe from left edge (gesture)
3. Keyboard shortcut: Cmd/Ctrl + B

**Overlay Implementation:**
```tsx
<motion.div
  initial={{ x: '-100%' }}
  animate={{ x: isOpen ? 0 : '-100%' }}
  transition={{ type: 'spring', damping: 25 }}
  className="fixed inset-y-0 left-0 w-full bg-background"
  style={{ zIndex: Z_INDEX.FIXED }}
>
  <Sidebar />
</motion.div>

{/* Backdrop */}
{isOpen && (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 0.5 }}
    exit={{ opacity: 0 }}
    onClick={closeSidebar}
    className="fixed inset-0 bg-black"
    style={{ zIndex: Z_INDEX.MODAL_BACKDROP }}
  />
)}
```

---

### PHASE 4: CHAT WIDGET REIMAGINED (Priority: P1)

#### 4.1 Chat Button Design (Minimized State)

**Position & Appearance:**
```css
.chat-fab {
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  box-shadow: 
    0 4px 12px rgba(102, 126, 234, 0.4),
    0 8px 24px rgba(102, 126, 234, 0.2);
  z-index: var(--z-chat-button);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.chat-fab:hover {
  transform: scale(1.1) translateY(-2px);
  box-shadow: 
    0 8px 16px rgba(102, 126, 234, 0.5),
    0 12px 32px rgba(102, 126, 234, 0.3);
}

.chat-fab:active {
  transform: scale(0.95);
}
```

**Features:**
- 🔔 **Badge Notification**: Unread count overlay (top-right)
- 🎤 **Pulse Animation**: Subtle ring when new message arrives
- 🌊 **Ripple Effect**: Material Design ripple on click
- 💬 **Icon**: MessageCircle (Lucide) with breathing animation

**Badge Component:**
```tsx
{unreadCount > 0 && (
  <motion.div
    initial={{ scale: 0 }}
    animate={{ scale: 1 }}
    className="absolute -top-1 -right-1 
               bg-red-500 text-white text-xs 
               w-5 h-5 rounded-full flex items-center justify-center
               font-semibold"
  >
    {unreadCount > 9 ? '9+' : unreadCount}
  </motion.div>
)}
```

#### 4.2 Chat Widget Design (Expanded State)

**Layout Specifications:**
```typescript
const chatWidgetConfig = {
  dimensions: {
    desktop: {
      width: '400px',
      height: '600px',
      maxHeight: 'calc(100vh - 120px)',
    },
    tablet: {
      width: '360px',
      height: '500px',
    },
    mobile: {
      width: '100vw',
      height: '100vh',
      position: 'fixed',
      inset: 0,
    },
  },
  position: {
    bottom: '24px',
    right: '24px',
  },
  borderRadius: '16px',
  shadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
};
```

**Visual Structure:**
```
┌─────────────────────────────┐
│ AI Assistant       [_][×]   │ ← Header (drag handle)
├─────────────────────────────┤
│                             │
│  [Chat Messages]            │ ← Scrollable area
│   • User message            │
│   • AI response             │
│   • ...                     │
│                             │
├─────────────────────────────┤
│ [Type message...]      [⏎]  │ ← Input (auto-resize)
└─────────────────────────────┘
```

**Advanced Features:**

1. **Smooth Transitions**
   ```tsx
   <AnimatePresence>
     {isExpanded && (
       <motion.div
         initial={{ 
           opacity: 0, 
           scale: 0.9, 
           y: 20,
           transformOrigin: 'bottom right' 
         }}
         animate={{ 
           opacity: 1, 
           scale: 1, 
           y: 0 
         }}
         exit={{ 
           opacity: 0, 
           scale: 0.9, 
           y: 20 
         }}
         transition={{ 
           type: 'spring', 
           damping: 20, 
           stiffness: 300 
         }}
       >
         <ChatWidget />
       </motion.div>
     )}
   </AnimatePresence>
   ```

2. **Header Actions**
   - Minimize button: "_" (collapse to FAB)
   - Close button: "×" (completely hide)
   - Drag handle: Move widget around screen
   - Status indicator: "AI is typing..."

3. **Message List**
   - Auto-scroll to bottom on new message
   - Virtualized scrolling (react-window) for 1000+ messages
   - Timestamp grouping: "Today", "Yesterday", "Mar 15"
   - Message actions: Copy, Regenerate, Feedback

4. **Input Area**
   - Auto-resize textarea (1-5 lines)
   - Markdown preview toggle
   - File attachment button
   - Voice input option
   - Character count: Subtle, appears at 80%

5. **Keyboard Shortcuts**
   - Enter: Send message
   - Shift+Enter: New line
   - Cmd/Ctrl+K: Focus input
   - Esc: Minimize widget

#### 4.3 Chat State Management

```typescript
type ChatState = 'hidden' | 'minimized' | 'expanded';

interface ChatStore {
  state: ChatState;
  messages: Message[];
  unreadCount: number;
  position: { x: number; y: number };
  
  // Actions
  toggle: () => void;
  minimize: () => void;
  expand: () => void;
  hide: () => void;
  sendMessage: (content: string) => void;
  markAsRead: () => void;
  updatePosition: (x: number, y: number) => void;
}

// Persist state
useEffect(() => {
  localStorage.setItem('chat-state', JSON.stringify({
    state: chatState,
    position: chatPosition,
  }));
}, [chatState, chatPosition]);
```

---

### PHASE 5: VISUAL DESIGN SYSTEM

#### 5.1 Color Palette (Keeping Current Scheme)

**Assumption: Using Neutral + Accent System**
```css
:root {
  /* Neutrals */
  --gray-50: #fafafa;
  --gray-100: #f5f5f5;
  --gray-200: #e5e5e5;
  --gray-300: #d4d4d4;
  --gray-400: #a3a3a3;
  --gray-500: #737373;
  --gray-600: #525252;
  --gray-700: #404040;
  --gray-800: #262626;
  --gray-900: #171717;
  
  /* Accent (Purple-Blue Gradient) */
  --primary-400: #818cf8;
  --primary-500: #6366f1;
  --primary-600: #4f46e5;
  
  /* Semantic Colors */
  --success: #10b981;
  --warning: #f59e0b;
  --error: #ef4444;
  --info: #3b82f6;
  
  /* Surfaces */
  --bg-primary: var(--gray-50);
  --bg-secondary: var(--gray-100);
  --bg-elevated: #ffffff;
  --border-color: var(--gray-200);
  --text-primary: var(--gray-900);
  --text-secondary: var(--gray-600);
}

[data-theme='dark'] {
  --bg-primary: var(--gray-900);
  --bg-secondary: var(--gray-800);
  --bg-elevated: var(--gray-800);
  --border-color: var(--gray-700);
  --text-primary: var(--gray-50);
  --text-secondary: var(--gray-400);
}
```

#### 5.2 Typography Scale

```css
:root {
  /* Font Sizes */
  --text-xs: 0.75rem;    /* 12px */
  --text-sm: 0.875rem;   /* 14px */
  --text-base: 1rem;     /* 16px */
  --text-lg: 1.125rem;   /* 18px */
  --text-xl: 1.25rem;    /* 20px */
  --text-2xl: 1.5rem;    /* 24px */
  --text-3xl: 1.875rem;  /* 30px */
  --text-4xl: 2.25rem;   /* 36px */
  
  /* Font Weights */
  --font-normal: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;
  
  /* Line Heights */
  --leading-tight: 1.25;
  --leading-normal: 1.5;
  --leading-relaxed: 1.75;
}
```

#### 5.3 Spacing System

```css
:root {
  --space-1: 0.25rem;  /* 4px */
  --space-2: 0.5rem;   /* 8px */
  --space-3: 0.75rem;  /* 12px */
  --space-4: 1rem;     /* 16px */
  --space-5: 1.25rem;  /* 20px */
  --space-6: 1.5rem;   /* 24px */
  --space-8: 2rem;     /* 32px */
  --space-10: 2.5rem;  /* 40px */
  --space-12: 3rem;    /* 48px */
  --space-16: 4rem;    /* 64px */
}
```

#### 5.4 Shadow System

```css
:root {
  /* Elevation Levels */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
  --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1);
  --shadow-2xl: 0 25px 50px -12px rgb(0 0 0 / 0.25);
  
  /* Colored Shadows (for chat button, CTAs) */
  --shadow-primary: 0 8px 16px -4px rgb(99 102 241 / 0.4);
}
```

#### 5.5 Animation Tokens

```css
:root {
  /* Durations */
  --duration-fast: 150ms;
  --duration-base: 300ms;
  --duration-slow: 500ms;
  
  /* Easings */
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
}
```

---

### PHASE 6: MICRO-INTERACTIONS & ANIMATIONS

#### 6.1 Button Interactions

```tsx
const buttonVariants = {
  idle: { scale: 1 },
  hover: { 
    scale: 1.02,
    transition: { duration: 0.15, ease: 'easeOut' }
  },
  tap: { 
    scale: 0.98,
    transition: { duration: 0.1 }
  },
};

<motion.button
  variants={buttonVariants}
  initial="idle"
  whileHover="hover"
  whileTap="tap"
/>
```

#### 6.2 Loading States

**Skeleton Screens:**
```tsx
<div className="animate-pulse">
  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
</div>
```

**Spinner:**
```tsx
<motion.div
  animate={{ rotate: 360 }}
  transition={{ 
    duration: 1, 
    repeat: Infinity, 
    ease: 'linear' 
  }}
  className="w-6 h-6 border-2 border-primary-500 
             border-t-transparent rounded-full"
/>
```

#### 6.3 Toast Notifications

```tsx
<AnimatePresence>
  {toasts.map(toast => (
    <motion.div
      key={toast.id}
      initial={{ x: 400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 400, opacity: 0 }}
      className="fixed top-4 right-4 p-4 bg-white rounded-lg shadow-xl"
    >
      {toast.message}
    </motion.div>
  ))}
</AnimatePresence>
```

#### 6.4 Page Transitions

```tsx
const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.3, ease: 'easeOut' }
  },
  exit: { 
    opacity: 0, 
    y: -20,
    transition: { duration: 0.2 }
  },
};

<motion.div
  variants={pageVariants}
  initial="initial"
  animate="animate"
  exit="exit"
>
  <PageContent />
</motion.div>
```

---

### PHASE 7: RESPONSIVE DESIGN MATRIX

#### 7.1 Breakpoints

```typescript
const breakpoints = {
  xs: '320px',   // Small mobile
  sm: '640px',   // Mobile
  md: '768px',   // Tablet
  lg: '1024px',  // Desktop
  xl: '1280px',  // Large desktop
  '2xl': '1536px', // Extra large
} as const;
```

#### 7.2 Component Behaviors

| Component | Mobile (<768px) | Tablet (768-1024px) | Desktop (>1024px) |
|-----------|----------------|---------------------|-------------------|
| **Header** | Compact, hamburger menu | Full layout, smaller icons | Full layout, all elements |
| **Sidebar** | Overlay drawer | Persistent, collapsible | Always visible |
| **Chat** | Full-screen modal | Fixed widget (360px) | Fixed widget (400px) |
| **Canvas** | Stack layout | 2-column layout | Multi-pane layout |

#### 7.3 Touch Optimizations

- Minimum tap target: 44x44px (iOS) / 48x48px (Material)
- Increase spacing between interactive elements
- Swipe gestures: Sidebar toggle, navigate items
- Long-press: Context menus
- Pull-to-refresh: Project list

---

### PHASE 8: ACCESSIBILITY (A11Y)

#### 8.1 Keyboard Navigation

```typescript
// Focus management
const focusTrap = useFocusTrap(modalRef);

// Keyboard shortcuts
useHotkeys([
  ['cmd+k', () => openSearch()],
  ['cmd+b', () => toggleSidebar()],
  ['esc', () => closeModal()],
  ['/', () => focusSearch()],
]);

// Skip links
<a href="#main-content" className="sr-only focus:not-sr-only">
  Skip to main content
</a>
```

#### 8.2 Screen Reader Support

```tsx
// ARIA labels
<button 
  aria-label="Open chat assistant"
  aria-expanded={isChatOpen}
  aria-controls="chat-widget"
>
  <MessageCircle />
</button>

// Live regions
<div 
  role="status" 
  aria-live="polite" 
  aria-atomic="true"
>
  {statusMessage}
</div>

// Semantic HTML
<nav aria-label="Main navigation">
  <ul role="list">
    <li><a href="/projects">Projects</a></li>
  </ul>
</nav>
```

#### 8.3 Color Contrast

- Text: Minimum 4.5:1 (WCAG AA)
- Large text (18px+): Minimum 3:1
- UI components: Minimum 3:1
- Test with: Axe DevTools, Lighthouse

#### 8.4 Focus Indicators

```css
*:focus-visible {
  outline: 2px solid var(--primary-500);
  outline-offset: 2px;
  border-radius: 4px;
}

/* Custom focus styles */
.button:focus-visible {
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.3);
}
```

---

### PHASE 9: PERFORMANCE OPTIMIZATION

#### 9.1 Code Splitting

```typescript
// Lazy load routes
const Projects = lazy(() => import('./pages/Projects'));
const Document = lazy(() => import('./pages/Document'));

// Lazy load chat widget
const ChatWidget = lazy(() => import('./components/ChatWidget'));

<Suspense fallback={<Spinner />}>
  <ChatWidget />
</Suspense>
```

#### 9.2 Image Optimization

```tsx
<img
  src={imageUrl}
  srcSet={`${imageUrl}?w=400 400w, ${imageUrl}?w=800 800w`}
  sizes="(max-width: 768px) 100vw, 50vw"
  loading="lazy"
  decoding="async"
  alt="Project thumbnail"
/>
```

#### 9.3 Animation Performance

```css
/* Use transform & opacity (GPU-accelerated) */
.animate {
  will-change: transform, opacity;
  transform: translateZ(0); /* Force GPU layer */
}

/* Avoid animating: */
/* width, height, padding, margin, top, left */
```

#### 9.4 Virtualization

```tsx
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={projects.length}
  itemSize={60}
  width="100%"
>
  {({ index, style }) => (
    <div style={style}>
      <ProjectItem project={projects[index]} />
    </div>
  )}
</FixedSizeList>
```

---

## 📋 IMPLEMENTATION CHECKLIST

### Week 1: Foundation (P0)
- [ ] Fix root container CSS architecture
- [ ] Implement Z-index management system
- [ ] Create CSS reset and base styles
- [ ] Set up design tokens (CSS variables)
- [ ] Fix header rendering and persistence
- [ ] Fix sidebar rendering and visibility

### Week 2: Core Components (P0)
- [ ] Build Header component with all sub-components
- [ ] Build Sidebar with project list and search
- [ ] Implement responsive behavior (mobile/tablet/desktop)
- [ ] Add keyboard navigation support
- [ ] Test layout on all breakpoints

### Week 3: Chat Widget (P1)
- [ ] Design and build Chat FAB (minimized state)
- [ ] Build Chat Widget (expanded state)
- [ ] Implement state management (minimized/expanded)
- [ ] Add smooth transitions and animations
- [ ] Build notification badge system
- [ ] Add drag functionality (desktop)
- [ ] Test mobile full-screen mode

### Week 4: Polish & Refinement (P1)
- [ ] Add all micro-interactions
- [ ] Implement loading states and skeletons
- [ ] Add toast notification system
- [ ] Polish animations (timing, easing)
- [ ] Add haptic feedback (mobile)
- [ ] Optimize performance (code splitting, lazy loading)

### Week 5: Accessibility & Testing (P1)
- [ ] Audit with Axe DevTools
- [ ] Test keyboard navigation flow
- [ ] Test with screen readers (NVDA, VoiceOver)
- [ ] Fix color contrast issues
- [ ] Add focus indicators
- [ ] Test with keyboard-only navigation

### Week 6: Cross-Browser & Device Testing (P2)
- [ ] Test on Chrome, Firefox, Safari, Edge
- [ ] Test on iOS Safari
- [ ] Test on Android Chrome
- [ ] Fix browser-specific bugs
- [ ] Performance audit with Lighthouse
- [ ] Final QA pass

---

## 🎯 SUCCESS METRICS

### User Experience
- ✅ Header visible: 100% of sessions
- ✅ Sidebar accessible: <2 clicks on desktop
- ✅ Chat opens: <300ms animation
- ✅ Navigation: <1s to any project
- ✅ Mobile usability: >90% on Google PageSpeed

### Performance
- ✅ First Contentful Paint: <1.5s
- ✅ Time to Interactive: <3s
- ✅ Cumulative Layout Shift:
<0.1
- ✅ Animation frame rate: 60fps sustained
- ✅ Bundle size: <200KB initial load (gzipped)

### Accessibility
- ✅ Lighthouse Accessibility Score: 100
- ✅ WCAG 2.1 AA Compliance: 100%
- ✅ Keyboard navigation: All features accessible
- ✅ Screen reader compatibility: NVDA, JAWS, VoiceOver

### Business Metrics
- ✅ Task completion rate: >95%
- ✅ User error rate: <5%
- ✅ Feature discovery: >80% users find chat in first session
- ✅ Mobile engagement: >40% of sessions

---

## 🔬 ADVANCED IMPLEMENTATION DETAILS

### PHASE 10: STATE MANAGEMENT ARCHITECTURE

#### 10.1 Global State Structure

```typescript
// store/slices/uiSlice.ts
interface UIState {
  layout: {
    headerHeight: number;
    sidebarWidth: number;
    sidebarCollapsed: boolean;
    chatState: 'hidden' | 'minimized' | 'expanded';
    chatPosition: { x: number; y: number };
  };
  theme: 'light' | 'dark' | 'system';
  notifications: Notification[];
  modals: {
    [key: string]: {
      isOpen: boolean;
      data?: any;
    };
  };
}

// Actions
const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.layout.sidebarCollapsed = !state.layout.sidebarCollapsed;
    },
    setChatState: (state, action: PayloadAction<ChatState>) => {
      state.layout.chatState = action.payload;
    },
    updateChatPosition: (state, action) => {
      state.layout.chatPosition = action.payload;
    },
    addNotification: (state, action) => {
      state.notifications.push({
        id: generateId(),
        timestamp: Date.now(),
        ...action.payload,
      });
    },
    dismissNotification: (state, action) => {
      state.notifications = state.notifications.filter(
        n => n.id !== action.payload
      );
    },
  },
});
```

#### 10.2 Persistent State Management

```typescript
// hooks/usePersistentState.ts
export function usePersistentState<T>(
  key: string,
  defaultValue: T,
  options?: {
    serialize?: (value: T) => string;
    deserialize?: (value: string) => T;
    sync?: boolean; // Sync across tabs
  }
) {
  const [state, setState] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      return item 
        ? (options?.deserialize?.(item) ?? JSON.parse(item))
        : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  useEffect(() => {
    try {
      const serialized = options?.serialize?.(state) ?? JSON.stringify(state);
      localStorage.setItem(key, serialized);
    } catch (error) {
      console.error(`Failed to persist state for key "${key}":`, error);
    }
  }, [key, state, options]);

  // Sync across tabs
  useEffect(() => {
    if (!options?.sync) return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue) {
        try {
          const newValue = options?.deserialize?.(e.newValue) 
            ?? JSON.parse(e.newValue);
          setState(newValue);
        } catch {}
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key, options]);

  return [state, setState] as const;
}

// Usage
const [sidebarCollapsed, setSidebarCollapsed] = usePersistentState(
  'sidebar-collapsed',
  false,
  { sync: true }
);
```

#### 10.3 Optimistic Updates

```typescript
// hooks/useOptimisticMutation.ts
export function useOptimisticMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: {
    onMutate?: (variables: TVariables) => void | Promise<any>;
    onSuccess?: (data: TData) => void;
    onError?: (error: Error, rollback: () => void) => void;
  }
) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = async (variables: TVariables) => {
    setIsLoading(true);
    setError(null);

    // Optimistic update
    const rollbackData = await options.onMutate?.(variables);

    try {
      const data = await mutationFn(variables);
      options.onSuccess?.(data);
      return data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Mutation failed');
      setError(error);
      
      // Rollback
      const rollback = () => {
        if (rollbackData) {
          // Restore previous state
        }
      };
      options.onError?.(error, rollback);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return { mutate, isLoading, error };
}

// Usage: Rename project with optimistic update
const { mutate: renameProject } = useOptimisticMutation(
  api.renameProject,
  {
    onMutate: async ({ projectId, newName }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries(['projects']);
      
      // Snapshot previous value
      const previousProjects = queryClient.getQueryData(['projects']);
      
      // Optimistically update
      queryClient.setQueryData(['projects'], (old: Project[]) =>
        old.map(p => p.id === projectId ? { ...p, name: newName } : p)
      );
      
      return { previousProjects };
    },
    onError: (err, { previousProjects }) => {
      // Rollback on error
      queryClient.setQueryData(['projects'], previousProjects);
      toast.error('Failed to rename project');
    },
  }
);
```

---

### PHASE 11: ADVANCED CHAT FEATURES

#### 11.1 Message Streaming

```typescript
// components/ChatWidget/MessageStream.tsx
export function useMessageStream() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');

  const sendMessage = async (content: string) => {
    // Add user message
    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content,
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, userMessage]);

    // Start streaming AI response
    setIsStreaming(true);
    setStreamingMessage('');

    try {
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content }),
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error('Stream not supported');

      let accumulatedContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        accumulatedContent += chunk;
        setStreamingMessage(accumulatedContent);

        // Smooth scroll to bottom
        scrollToBottom();
      }

      // Save final message
      const aiMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: accumulatedContent,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, aiMessage]);
      setStreamingMessage('');
    } catch (error) {
      console.error('Streaming error:', error);
      toast.error('Failed to get AI response');
    } finally {
      setIsStreaming(false);
    }
  };

  return { messages, streamingMessage, isStreaming, sendMessage };
}
```

#### 11.2 Markdown Rendering with Code Highlighting

```tsx
// components/ChatWidget/MessageContent.tsx
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

export function MessageContent({ content }: { content: string }) {
  return (
    <ReactMarkdown
      components={{
        code({ node, inline, className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || '');
          const language = match ? match[1] : '';

          return !inline && language ? (
            <div className="relative group">
              <CopyButton code={String(children)} />
              <SyntaxHighlighter
                style={oneDark}
                language={language}
                PreTag="div"
                customStyle={{
                  borderRadius: '8px',
                  padding: '16px',
                  fontSize: '14px',
                }}
                {...props}
              >
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            </div>
          ) : (
            <code 
              className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 
                         rounded text-sm font-mono"
              {...props}
            >
              {children}
            </code>
          );
        },
        a({ href, children }) {
          return (
            
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-500 hover:underline"
            >
              {children}
            </a>
          );
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

function CopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="absolute top-2 right-2 p-2 rounded 
                 bg-gray-700 hover:bg-gray-600 
                 opacity-0 group-hover:opacity-100 
                 transition-opacity"
      aria-label="Copy code"
    >
      {copied ? <Check size={16} /> : <Copy size={16} />}
    </button>
  );
}
```

#### 11.3 Voice Input

```typescript
// hooks/useVoiceInput.ts
export function useVoiceInput(onTranscript: (text: string) => void) {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window)) {
      setError('Speech recognition not supported');
      return;
    }

    const SpeechRecognition = window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map(result => result[0].transcript)
        .join('');

      onTranscript(transcript);
    };

    recognition.onerror = (event) => {
      setError(`Speech recognition error: ${event.error}`);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
    };
  }, [onTranscript]);

  const startListening = () => {
    if (!recognitionRef.current) return;
    setError(null);
    setIsListening(true);
    recognitionRef.current.start();
  };

  const stopListening = () => {
    if (!recognitionRef.current) return;
    recognitionRef.current.stop();
    setIsListening(false);
  };

  return { isListening, error, startListening, stopListening };
}
```

#### 11.4 Smart Suggestions

```tsx
// components/ChatWidget/SmartSuggestions.tsx
const SUGGESTIONS = [
  { icon: FileText, label: 'Summarize document', prompt: 'Summarize this document' },
  { icon: Lightbulb, label: 'Generate ideas', prompt: 'Generate 5 ideas for...' },
  { icon: CheckCircle, label: 'Create checklist', prompt: 'Create a checklist for...' },
  { icon: Code, label: 'Explain code', prompt: 'Explain this code snippet' },
];

export function SmartSuggestions({ onSelect }: { onSelect: (prompt: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2 p-4 border-t">
      {SUGGESTIONS.map((suggestion) => (
        <motion.button
          key={suggestion.label}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onSelect(suggestion.prompt)}
          className="flex items-center gap-2 px-3 py-2 
                     bg-gray-100 dark:bg-gray-800 
                     rounded-lg text-sm hover:bg-gray-200 
                     dark:hover:bg-gray-700 transition-colors"
        >
          <suggestion.icon size={16} />
          <span>{suggestion.label}</span>
        </motion.button>
      ))}
    </div>
  );
}
```

---

### PHASE 12: SIDEBAR ENHANCEMENTS

#### 12.1 Drag-and-Drop Reordering

```typescript
// components/Sidebar/ProjectList.tsx
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortableProject({ project }: { project: Project }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: project.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 
                 cursor-grab active:cursor-grabbing"
    >
      <div className="flex items-center gap-3">
        <GripVertical size={16} className="text-gray-400" />
        <FolderIcon size={20} />
        <span className="flex-1 truncate">{project.name}</span>
      </div>
    </div>
  );
}

export function ProjectList() {
  const [projects, setProjects] = useState<Project[]>([]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setProjects((items) => {
      const oldIndex = items.findIndex(i => i.id === active.id);
      const newIndex = items.findIndex(i => i.id === over.id);
      return arrayMove(items, oldIndex, newIndex);
    });

    // Persist order to backend
    api.updateProjectOrder(projects.map(p => p.id));
  };

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={projects} strategy={verticalListSortingStrategy}>
        {projects.map(project => (
          <SortableProject key={project.id} project={project} />
        ))}
      </SortableContext>
    </DndContext>
  );
}
```

#### 12.2 Advanced Search with Filters

```tsx
// components/Sidebar/SearchBar.tsx
export function SearchBar() {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState({
    type: 'all', // 'all' | 'projects' | 'documents'
    dateRange: null,
    tags: [],
  });

  const debouncedQuery = useDebounce(query, 300);

  const results = useSearch(debouncedQuery, filters);

  return (
    <div className="relative">
      {/* Search Input */}
      <div className="relative">
        <Search 
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" 
          size={18} 
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search projects, docs..."
          className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-800 
                     rounded-lg focus:outline-none focus:ring-2 
                     focus:ring-primary-500"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Filter Pills */}
      <div className="flex gap-2 mt-2">
        {['all', 'projects', 'documents'].map(type => (
          <button
            key={type}
            onClick={() => setFilters({ ...filters, type })}
            className={`px-3 py-1 rounded-full text-sm capitalize
                       ${filters.type === type 
                         ? 'bg-primary-500 text-white' 
                         : 'bg-gray-200 dark:bg-gray-700'}`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Search Results */}
      <AnimatePresence>
        {query && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 
                       bg-white dark:bg-gray-800 rounded-lg shadow-xl 
                       max-h-96 overflow-y-auto z-50"
          >
            {results.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No results found
              </div>
            ) : (
              results.map(result => (
                <SearchResultItem key={result.id} result={result} />
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
```

#### 12.3 Collapsible Sections with Animations

```tsx
// components/Sidebar/CollapsibleSection.tsx
export function CollapsibleSection({ 
  title, 
  icon: Icon, 
  children,
  defaultOpen = true 
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = usePersistentState(
    `sidebar-section-${title}`,
    defaultOpen
  );

  return (
    <div className="mb-4">
      {/* Section Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-2 
                   hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg
                   transition-colors"
      >
        <div className="flex items-center gap-2">
          <Icon size={18} className="text-gray-600 dark:text-gray-400" />
          <span className="font-medium text-sm">{title}</span>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown size={18} />
        </motion.div>
      </button>

      {/* Section Content */}
      <motion.div
        initial={false}
        animate={{
          height: isOpen ? 'auto' : 0,
          opacity: isOpen ? 1 : 0,
        }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="overflow-hidden"
      >
        <div className="pt-2 pl-2">
          {children}
        </div>
      </motion.div>
    </div>
  );
}

// Usage
<CollapsibleSection title="Projects" icon={Folder}>
  <ProjectList />
</CollapsibleSection>

<CollapsibleSection title="Recent" icon={Clock}>
  <RecentList />
</CollapsibleSection>

<CollapsibleSection title="Starred" icon={Star}>
  <StarredList />
</CollapsibleSection>
```

---

### PHASE 13: MOBILE EXPERIENCE PERFECTION

#### 13.1 Gesture Handlers

```typescript
// hooks/useSwipeGesture.ts
export function useSwipeGesture(
  onSwipeLeft?: () => void,
  onSwipeRight?: () => void,
  threshold = 50
) {
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = (e: TouchEvent) => {
    touchStart.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
  };

  const handleTouchEnd = (e: TouchEvent) => {
    if (!touchStart.current) return;

    const touchEnd = {
      x: e.changedTouches[0].clientX,
      y: e.changedTouches[0].clientY,
    };

    const deltaX = touchEnd.x - touchStart.current.x;
    const deltaY = touchEnd.y - touchStart.current.y;

    // Only trigger if horizontal swipe is dominant
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > threshold) {
      if (deltaX > 0) {
        onSwipeRight?.();
      } else {
        onSwipeLeft?.();
      }
    }

    touchStart.current = null;
  };

  return { handleTouchStart, handleTouchEnd };
}

// Usage: Swipe to open/close sidebar
const { handleTouchStart, handleTouchEnd } = useSwipeGesture(
  () => closeSidebar(), // Swipe left
  () => openSidebar()   // Swipe right
);

<div 
  onTouchStart={handleTouchStart}
  onTouchEnd={handleTouchEnd}
>
  <Content />
</div>
```

#### 13.2 Mobile Bottom Sheet (Alternative to Sidebar)

```tsx
// components/MobileSheet.tsx
import { Sheet } from 'react-modal-sheet';

export function MobileSidebar({ isOpen, onClose }: Props) {
  return (
    <Sheet isOpen={isOpen} onClose={onClose} detent="content-height">
      <Sheet.Container>
        <Sheet.Header />
        <Sheet.Content>
          <Sheet.Scroller>
            <div className="p-4">
              {/* Sidebar content optimized for mobile */}
              <div className="space-y-4">
                <SearchBar />
                <ProjectGrid /> {/* Grid instead of list for mobile */}
                <RecentDocuments />
              </div>
            </div>
          </Sheet.Scroller>
        </Sheet.Content>
      </Sheet.Container>
      <Sheet.Backdrop onTap={onClose} />
    </Sheet>
  );
}
```

#### 13.3 Pull-to-Refresh

```typescript
// hooks/usePullToRefresh.ts
export function usePullToRefresh(onRefresh: () => Promise<void>) {
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef(0);

  const TRIGGER_DISTANCE = 80;

  const handleTouchStart = (e: TouchEvent) => {
    startY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: TouchEvent) => {
    const currentY = e.touches[0].clientY;
    const distance = currentY - startY.current;

    // Only allow pull down when scrolled to top
    if (window.scrollY === 0 && distance > 0) {
      setPullDistance(Math.min(distance, TRIGGER_DISTANCE * 1.5));
      setIsPulling(distance > TRIGGER_DISTANCE);
    }
  };

  const handleTouchEnd = async () => {
    if (isPulling) {
      await onRefresh();
    }
    setPullDistance(0);
    setIsPulling(false);
  };

  return {
    isPulling,
    pullDistance,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  };
}
```

---

### PHASE 14: TESTING STRATEGY

#### 14.1 Component Testing

```typescript
// __tests__/Header.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Header } from '@/components/Header';

describe('Header', () => {
  it('renders logo and navigation', () => {
    render(<Header />);
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByAltText('Logo')).toBeInTheDocument();
  });

  it('toggles sidebar on hamburger click', () => {
    const onToggleSidebar = jest.fn();
    render(<Header onToggleSidebar={onToggleSidebar} />);
    
    const hamburger = screen.getByLabelText('Toggle sidebar');
    fireEvent.click(hamburger);
    
    expect(onToggleSidebar).toHaveBeenCalledTimes(1);
  });

  it('shows user menu when logged in', () => {
    const user = { name: 'John Doe', email: 'john@example.com' };
    render(<Header user={user} />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });
});
```

#### 14.2 Visual Regression Testing

```typescript
// __tests__/visual/Header.visual.test.tsx
import { test, expect } from '@playwright/test';

test.describe('Header Visual Tests', () => {
  test('header looks correct on desktop', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveScreenshot('header-desktop.png');
  });

  test('header looks correct on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await expect(page).toHaveScreenshot('header-mobile.png');
  });

  test('header with user menu open', async ({ page }) => {
    await page.goto('/');
    await page.click('[aria-label="User menu"]');
    await expect(page).toHaveScreenshot('header-user-menu.png');
  });
});
```

#### 14.3 E2E Testing

```typescript
// e2e/chat-workflow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Chat Widget Workflow', () => {
  test('should open chat, send message, and receive response', async ({ page }) => {
    await page.goto('/');
    
    // Chat should be minimized by default
    const chatButton = page.locator('[aria-label="Open chat assistant"]');
    await expect(chatButton).toBeVisible();
    
    // Click to expand
    await chatButton.click();
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    
    // Send message
    const input = page.locator('textarea[placeholder*="Type message"]');
    await input.fill('Hello, can you help me?');
    await input.press('Enter');
    
    // Wait for AI response
    await expect(page.locator('text=/assistant:/i')).toBeVisible({ timeout: 10000 });
    
    // Minimize chat
    await page.click('[aria-label="Minimize chat"]');
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
    await expect(chatButton).toBeVisible();
  });
});
```

---

## 🚀 DEPLOYMENT CHECKLIST

### Pre-Deployment
- [ ] Run full test suite (unit + integration + e2e)
- [ ] Lighthouse audit: All scores >90
- [ ] Cross-browser testing complete
- [ ] Mobile device testing complete
- [ ] Accessibility audit passed
- [ ] Performance profiling complete
- [ ] Bundle size analysis (<200KB initial)
- [ ] Security audit (dependencies, XSS, CSRF)

### Deployment
- [ ] Feature flags configured
- [ ] Monitoring and analytics set up
- [ ] Error tracking configured (Sentry)
- [ ] CDN cache configured
- [ ] Database migrations tested
- [ ] Rollback plan documented

### Post-Deployment
- [ ] Smoke tests on production
- [ ] Monitor error rates (first 24h)
- [ ] Check performance metrics
- [ ] Gather user feedback
- [ ] Hot-fix any critical issues

---

## 📚 DOCUMENTATION REQUIREMENTS

### Developer Documentation
```markdown
# Component API Documentation

## Header Component

### Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| user | User \| null | null | Current logged-in user |
| onToggleSidebar | () => void | - | Callback for sidebar toggle |

### Usage
\`\`\`tsx
<Header 
  user={currentUser}
  onToggleSidebar={() => dispatch(toggleSidebar())}
/>
\`\`\`

### Accessibility
- Uses semantic HTML (`<header>`, `<nav>`)
- All interactive elements are keyboard accessible
- ARIA labels provided for icon-only buttons
```

### User Documentation
- Create video tutorials for key features
- Write help articles for common tasks
- Add in-app tooltips and onboarding
- Create keyboard shortcuts reference card

---

## 🎓 FINAL THOUGHTS & BEST PRACTICES

### Code Quality
- **TypeScript strict mode**: Enable for type safety
- **ESLint + Prettier**: Enforce consistent code style
- **Husky pre-commit hooks**: Run tests and linting before commit
- **Component composition**: Build small, reusable components
### Performance Culture
- **Measure first, optimize second**: Use Chrome DevTools Performance tab
- **Bundle analysis**: Regularly check with `webpack-bundle-analyzer`
- **Lazy load heavy components**: Charts, editors, 3D viewers
- **Memoization strategy**: Use `React.memo`, `useMemo`, `useCallback` judiciously
- **Avoid premature optimization**: Profile real bottlenecks, not imagined ones

### Design System Consistency
- **Single source of truth**: All design tokens in CSS variables
- **Component library**: Build internal Storybook for all components
- **Design-dev handoff**: Use Figma Dev Mode with tokens plugin
- **Version control design assets**: Track design changes in Git

---

## 🎨 ADVANCED STYLING TECHNIQUES

### PHASE 15: GLASSMORPHISM & DEPTH

#### 15.1 Frosted Glass Effect

```css
/* Glassmorphism utility classes */
.glass {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px) saturate(180%);
  -webkit-backdrop-filter: blur(10px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.15);
}

[data-theme='dark'] .glass {
  background: rgba(30, 30, 30, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

/* Header with glass effect */
.header-glass {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(12px) saturate(180%);
  -webkit-backdrop-filter: blur(12px) saturate(180%);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

/* Chat widget glass */
.chat-glass {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(0, 0, 0, 0.1);
  box-shadow: 
    0 20px 60px rgba(0, 0, 0, 0.2),
    0 0 0 1px rgba(255, 255, 255, 0.5) inset;
}
```

#### 15.2 Elevation System (Material Design inspired)

```css
:root {
  /* Elevation shadows */
  --elevation-0: none;
  --elevation-1: 
    0 1px 3px rgba(0, 0, 0, 0.12),
    0 1px 2px rgba(0, 0, 0, 0.24);
  --elevation-2: 
    0 3px 6px rgba(0, 0, 0, 0.16),
    0 3px 6px rgba(0, 0, 0, 0.23);
  --elevation-3: 
    0 10px 20px rgba(0, 0, 0, 0.19),
    0 6px 6px rgba(0, 0, 0, 0.23);
  --elevation-4: 
    0 14px 28px rgba(0, 0, 0, 0.25),
    0 10px 10px rgba(0, 0, 0, 0.22);
  --elevation-5: 
    0 19px 38px rgba(0, 0, 0, 0.30),
    0 15px 12px rgba(0, 0, 0, 0.22);
}

/* Usage */
.card { box-shadow: var(--elevation-2); }
.modal { box-shadow: var(--elevation-4); }
.tooltip { box-shadow: var(--elevation-3); }
```

#### 15.3 Neumorphism (Optional Alternative Style)

```css
/* Soft UI / Neumorphism */
.neuro-card {
  background: #e0e5ec;
  border-radius: 16px;
  box-shadow: 
    9px 9px 16px rgba(163, 177, 198, 0.6),
    -9px -9px 16px rgba(255, 255, 255, 0.5);
}

.neuro-card-pressed {
  box-shadow: 
    inset 9px 9px 16px rgba(163, 177, 198, 0.6),
    inset -9px -9px 16px rgba(255, 255, 255, 0.5);
}

/* Dark mode neumorphism */
[data-theme='dark'] .neuro-card {
  background: #2c2c2c;
  box-shadow: 
    9px 9px 16px rgba(0, 0, 0, 0.4),
    -9px -9px 16px rgba(60, 60, 60, 0.4);
}
```

---

### PHASE 16: MICRO-ANIMATIONS LIBRARY

#### 16.1 Attention Seekers

```css
/* Pulse animation for notifications */
@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.9; transform: scale(1.05); }
}

.animate-pulse-soft {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* Shake animation for errors */
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
  20%, 40%, 60%, 80% { transform: translateX(4px); }
}

.animate-shake {
  animation: shake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97);
}

/* Bounce animation for success */
@keyframes bounce-in {
  0% { transform: scale(0.3); opacity: 0; }
  50% { transform: scale(1.05); }
  70% { transform: scale(0.9); }
  100% { transform: scale(1); opacity: 1; }
}

.animate-bounce-in {
  animation: bounce-in 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}
```

#### 16.2 Entrance Animations

```css
/* Fade in up */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Slide in from right */
@keyframes slideInRight {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
}

/* Scale in */
@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* Usage classes */
.animate-fade-in-up {
  animation: fadeInUp 0.4s ease-out;
}

.animate-slide-in-right {
  animation: slideInRight 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.animate-scale-in {
  animation: scaleIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
```

#### 16.3 Staggered Animations

```tsx
// components/StaggeredList.tsx
import { motion } from 'framer-motion';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export function StaggeredList({ items }: { items: any[] }) {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
    >
      {items.map((item, index) => (
        <motion.div
          key={index}
          variants={item}
          transition={{ type: 'spring', stiffness: 300, damping: 24 }}
        >
          {item.content}
        </motion.div>
      ))}
    </motion.div>
  );
}
```

#### 16.4 Hover Effects Collection

```css
/* Lift effect */
.hover-lift {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.hover-lift:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
}

/* Glow effect */
.hover-glow {
  position: relative;
  transition: all 0.3s ease;
}

.hover-glow::before {
  content: '';
  position: absolute;
  inset: -2px;
  border-radius: inherit;
  background: linear-gradient(135deg, #667eea, #764ba2);
  opacity: 0;
  transition: opacity 0.3s ease;
  z-index: -1;
  filter: blur(8px);
}

.hover-glow:hover::before {
  opacity: 0.7;
}

/* Shimmer effect */
@keyframes shimmer {
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
}

.hover-shimmer {
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.3) 50%,
    transparent 100%
  );
  background-size: 200% 100%;
  background-position: -200% center;
  transition: background-position 0s;
}

.hover-shimmer:hover {
  animation: shimmer 1.5s ease-in-out;
}

/* Tilt effect (3D) */
.hover-tilt {
  transition: transform 0.3s ease;
  transform-style: preserve-3d;
}

.hover-tilt:hover {
  transform: perspective(1000px) rotateX(5deg) rotateY(-5deg);
}
```

---

### PHASE 17: LOADING STATES & SKELETONS

#### 17.1 Skeleton Components

```tsx
// components/Skeleton.tsx
export function Skeleton({ 
  className = '', 
  variant = 'rectangular',
  animation = 'pulse',
  width,
  height,
}: SkeletonProps) {
  const baseClass = 'bg-gray-200 dark:bg-gray-700';
  const animationClass = {
    pulse: 'animate-pulse',
    wave: 'animate-wave',
    none: '',
  }[animation];

  const variantClass = {
    circular: 'rounded-full',
    rectangular: 'rounded',
    text: 'rounded h-4',
  }[variant];

  return (
    <div
      className={`${baseClass} ${animationClass} ${variantClass} ${className}`}
      style={{ width, height }}
    />
  );
}

// Usage: Project Card Skeleton
export function ProjectCardSkeleton() {
  return (
    <div className="p-4 border rounded-lg">
      <Skeleton variant="rectangular" width="100%" height={120} className="mb-4" />
      <Skeleton variant="text" width="80%" className="mb-2" />
      <Skeleton variant="text" width="60%" />
      <div className="flex gap-2 mt-4">
        <Skeleton variant="circular" width={32} height={32} />
        <Skeleton variant="circular" width={32} height={32} />
        <Skeleton variant="circular" width={32} height={32} />
      </div>
    </div>
  );
}
```

#### 17.2 Wave Animation

```css
@keyframes wave {
  0% {
    background-position: -200% center;
  }
  100% {
    background-position: 200% center;
  }
}

.animate-wave {
  background: linear-gradient(
    90deg,
    rgba(229, 231, 235, 1) 25%,
    rgba(243, 244, 246, 1) 50%,
    rgba(229, 231, 235, 1) 75%
  );
  background-size: 200% 100%;
  animation: wave 1.5s ease-in-out infinite;
}

[data-theme='dark'] .animate-wave {
  background: linear-gradient(
    90deg,
    rgba(55, 65, 81, 1) 25%,
    rgba(75, 85, 99, 1) 50%,
    rgba(55, 65, 81, 1) 75%
  );
  background-size: 200% 100%;
}
```

#### 17.3 Content Placeholders

```tsx
// components/ContentPlaceholder.tsx
export function ContentPlaceholder({ type }: { type: 'list' | 'grid' | 'table' }) {
  if (type === 'list') {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <Skeleton variant="circular" width={48} height={48} />
            <div className="flex-1 space-y-2">
              <Skeleton variant="text" width="70%" />
              <Skeleton variant="text" width="50%" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'grid') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <ProjectCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (type === 'table') {
    return (
      <div className="space-y-2">
        <Skeleton variant="rectangular" width="100%" height={40} />
        {[...Array(8)].map((_, i) => (
          <Skeleton key={i} variant="rectangular" width="100%" height={56} />
        ))}
      </div>
    );
  }

  return null;
}
```

#### 17.4 Progressive Loading

```tsx
// components/ProgressiveImage.tsx
export function ProgressiveImage({ 
  src, 
  placeholder, 
  alt,
  className = '',
}: ProgressiveImageProps) {
  const [imgSrc, setImgSrc] = useState(placeholder);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const img = new Image();
    img.src = src;
    img.onload = () => {
      setImgSrc(src);
      setIsLoading(false);
    };
  }, [src]);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <img
        src={imgSrc}
        alt={alt}
        className={`w-full h-full object-cover transition-opacity duration-500
                   ${isLoading ? 'opacity-50 blur-sm' : 'opacity-100'}`}
      />
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader className="animate-spin" />
        </div>
      )}
    </div>
  );
}
```

---

### PHASE 18: ERROR HANDLING & EMPTY STATES

#### 18.1 Error Boundary

```tsx
// components/ErrorBoundary.tsx
import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: any) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('ErrorBoundary caught:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
    
    // Log to error tracking service
    // logErrorToService(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <ErrorFallback 
          error={this.state.error} 
          resetError={() => this.setState({ hasError: false })}
        />
      );
    }

    return this.props.children;
  }
}

function ErrorFallback({ error, resetError }: { error?: Error; resetError: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
      <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-4 text-center max-w-md">
        {error?.message || 'An unexpected error occurred'}
      </p>
      <div className="flex gap-4">
        <button
          onClick={resetError}
          className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
        >
          Try Again
        </button>
        <button
          onClick={() => window.location.href = '/'}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Go Home
        </button>
      </div>
    </div>
  );
}
```

#### 18.2 Empty States

```tsx
// components/EmptyState.tsx
export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  illustration,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      {illustration ? (
        <img src={illustration} alt="" className="w-64 h-64 mb-6 opacity-75" />
      ) : (
        <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 
                        flex items-center justify-center mb-6">
          <Icon className="w-10 h-10 text-gray-400" />
        </div>
      )}
      
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      {description && (
        <p className="text-gray-600 dark:text-gray-400 max-w-md mb-6">
          {description}
        </p>
      )}
      
      {action && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {action}
        </motion.div>
      )}
    </div>
  );
}

// Usage examples
<EmptyState
  icon={FolderPlus}
  title="No projects yet"
  description="Get started by creating your first project"
  action={
    <Button onClick={createProject}>
      <Plus className="mr-2" />
      Create Project
    </Button>
  }
/>

<EmptyState
  icon={FileSearch}
  title="No results found"
  description="Try adjusting your search or filters"
/>
```

#### 18.3 Network Error Handling

```tsx
// hooks/useNetworkStatus.ts
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

// OfflineBanner component
export function OfflineBanner() {
  const isOnline = useNetworkStatus();

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className="fixed top-0 left-0 right-0 bg-yellow-500 text-white 
                     py-2 px-4 text-center z-50"
        >
          <WifiOff className="inline mr-2" size={18} />
          You're offline. Some features may not be available.
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

---

### PHASE 19: ADVANCED INTERACTIONS

#### 19.1 Context Menu

```tsx
// components/ContextMenu.tsx
export function ContextMenu({ 
  trigger, 
  items,
  children 
}: ContextMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const menuRef = useRef<HTMLDivElement>(null);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setPosition({ x: e.clientX, y: e.clientY });
    setIsOpen(true);
  };

  useOnClickOutside(menuRef, () => setIsOpen(false));

  return (
    <>
      <div onContextMenu={handleContextMenu}>
        {children}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'fixed',
              left: position.x,
              top: position.y,
              zIndex: 9999,
            }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl 
                       border border-gray-200 dark:border-gray-700 
                       py-1 min-w-[200px]"
          >
            {items.map((item, index) => (
              <button
                key={index}
                onClick={() => {
                  item.onClick();
                  setIsOpen(false);
                }}
                disabled={item.disabled}
                className="w-full px-4 py-2 text-left text-sm flex items-center gap-3
                           hover:bg-gray-100 dark:hover:bg-gray-700
                           disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {item.icon && <item.icon size={16} />}
                <span>{item.label}</span>
                {item.shortcut && (
                  <span className="ml-auto text-xs text-gray-500">
                    {item.shortcut}
                  </span>
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// Usage
<ContextMenu
  items={[
    { icon: Edit, label: 'Rename', onClick: handleRename, shortcut: 'F2' },
    { icon: Copy, label: 'Duplicate', onClick: handleDuplicate, shortcut: '⌘D' },
    { icon: Star, label: 'Add to favorites', onClick: handleFavorite },
    { icon: Trash, label: 'Delete', onClick: handleDelete, shortcut: 'Del' },
  ]}
>
  <ProjectCard project={project} />
</ContextMenu>
```

#### 19.2 Command Palette

```tsx
// components/CommandPalette.tsx
export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Open with Cmd+K
  useHotkeys('cmd+k, ctrl+k', (e) => {
    e.preventDefault();
    setIsOpen(true);
  });

  const commands = [
    { icon: Plus, label: 'Create new project', action: () => createProject() },
    { icon: Search, label: 'Search documents', action: () => openSearch() },
    { icon: Settings, label: 'Open settings', action: () => openSettings() },
    { icon: Moon, label: 'Toggle dark mode', action: () => toggleTheme() },
  ];

  const filteredCommands = commands.filter(cmd =>
    cmd.label.toLowerCase().includes(search.toLowerCase())
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, filteredCommands.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      filteredCommands[selectedIndex]?.action();
      setIsOpen(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/50 z-50"
          />

          {/* Command Palette */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="fixed top-[20%] left-1/2 -translate-x-1/2 
                       w-full max-w-2xl z-50"
          >
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl 
                            border border-gray-200 dark:border-gray-700 overflow-hidden">
              {/* Search Input */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <Search className="text-gray-400" size={20} />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a command or search..."
                  className="flex-1 bg-transparent outline-none text-lg"
                  autoFocus
                />
                <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                  ESC
                </kbd>
              </div>

              {/* Commands List */}
              <div className="max-h-96 overflow-y-auto">
                {filteredCommands.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    No commands found
                  </div>
                ) : (
                  filteredCommands.map((cmd, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        cmd.action();
                        setIsOpen(false);
                      }}
                      className={`w-full px-4 py-3 flex items-center gap-3 text-left
                                 transition-colors
                                 ${index === selectedIndex 
                                   ? 'bg-primary-50 dark:bg-primary-900/20' 
                                   : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}
                    >
                      <cmd.icon size={20} />
                      <span>{cmd.label}</span>
                    </button>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
```

#### 19.3 Drag & Drop File Upload

```tsx
// components/FileDropzone.tsx
export function FileDropzone({ onDrop, accept, maxSize }: FileDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const dropzoneRef = useRef<HTMLDivElement>(null);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget === dropzoneRef.current) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    
    // Validate files
    const validFiles = files.filter(file => {
      if (maxSize && file.size > maxSize) {
        toast.error(`${file.name} is too large`);
        return false;
      }
      if (accept && !accept.includes(file.type)) {
        toast.error(`${file.name} has invalid type`);
        return false;
      }
      return true;
    });

    if (validFiles.length > 0) {
      onDrop(validFiles);
    }
  };

  return (
    <div
      ref={dropzoneRef}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`
        relative border-2 border-dashed rounded-xl p-12 text-center
        transition-all duration-200
        ${isDragging 
          ? 'border-
          primary-500 bg-primary-50 dark:bg-primary-900/20' 
          : 'border-gray-300 dark:border-gray-700 hover:border-gray-400'}
      `}
    >
      <motion.div
        animate={isDragging ? { scale: 1.05 } : { scale: 1 }}
        transition={{ type: 'spring', stiffness: 300 }}
      >
        <Upload 
          className={`mx-auto mb-4 ${isDragging ? 'text-primary-500' : 'text-gray-400'}`}
          size={48} 
        />
        <h3 className="text-lg font-semibold mb-2">
          {isDragging ? 'Drop files here' : 'Drag & drop files'}
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          or click to browse
        </p>
        <input
          type="file"
          multiple
          accept={accept}
          onChange={(e) => onDrop(Array.from(e.target.files || []))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
      </motion.div>
    </div>
  );
}
```

---

### PHASE 20: INTERNATIONALIZATION (i18n)

#### 20.1 i18n Setup

```typescript
// i18n/config.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: {
          header: {
            search: 'Search projects, docs...',
            newProject: 'New Project',
            notifications: 'Notifications',
          },
          sidebar: {
            projects: 'Projects',
            recent: 'Recent',
            starred: 'Starred',
            noProjects: 'No projects yet',
            createFirst: 'Create your first project to get started',
          },
          chat: {
            placeholder: 'Type a message...',
            send: 'Send',
            minimize: 'Minimize',
            close: 'Close',
            typing: 'AI is typing...',
          },
        },
      },
      vi: {
        translation: {
          header: {
            search: 'Tìm kiếm dự án, tài liệu...',
            newProject: 'Dự Án Mới',
            notifications: 'Thông Báo',
          },
          sidebar: {
            projects: 'Dự Án',
            recent: 'Gần Đây',
            starred: 'Đã Đánh Dấu',
            noProjects: 'Chưa có dự án nào',
            createFirst: 'Tạo dự án đầu tiên để bắt đầu',
          },
          chat: {
            placeholder: 'Nhập tin nhắn...',
            send: 'Gửi',
            minimize: 'Thu Nhỏ',
            close: 'Đóng',
            typing: 'AI đang nhập...',
          },
        },
      },
    },
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
```

#### 20.2 Language Switcher Component

```tsx
// components/LanguageSwitcher.tsx
import { useTranslation } from 'react-i18next';

const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
];

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const currentLang = LANGUAGES.find(lang => lang.code === i18n.language) || LANGUAGES[0];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg
                   hover:bg-gray-100 dark:hover:bg-gray-800"
      >
        <span className="text-xl">{currentLang.flag}</span>
        <ChevronDown size={16} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800
                       rounded-lg shadow-xl border border-gray-200 dark:border-gray-700
                       py-1 z-50"
          >
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => {
                  i18n.changeLanguage(lang.code);
                  setIsOpen(false);
                }}
                className={`w-full px-4 py-2 text-left flex items-center gap-3
                           hover:bg-gray-100 dark:hover:bg-gray-700
                           ${lang.code === i18n.language ? 'bg-primary-50 dark:bg-primary-900/20' : ''}`}
              >
                <span className="text-xl">{lang.flag}</span>
                <span>{lang.name}</span>
                {lang.code === i18n.language && (
                  <Check className="ml-auto" size={16} />
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
```

#### 20.3 Usage in Components

```tsx
// Using translations
import { useTranslation } from 'react-i18next';

export function Sidebar() {
  const { t } = useTranslation();

  return (
    <div>
      <h2>{t('sidebar.projects')}</h2>
      {projects.length === 0 && (
        <EmptyState
          title={t('sidebar.noProjects')}
          description={t('sidebar.createFirst')}
        />
      )}
    </div>
  );
}
```

---

### PHASE 21: ANALYTICS & MONITORING

#### 21.1 Analytics Tracking

```typescript
// utils/analytics.ts
type AnalyticsEvent = 
  | { name: 'page_view'; page: string }
  | { name: 'button_click'; button: string; location: string }
  | { name: 'chat_opened' }
  | { name: 'chat_message_sent'; messageLength: number }
  | { name: 'project_created'; projectType: string }
  | { name: 'document_opened'; documentId: string };

export function trackEvent(event: AnalyticsEvent) {
  // Google Analytics 4
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', event.name, event);
  }

  // Custom analytics
  fetch('/api/analytics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...event,
      timestamp: Date.now(),
      userId: getUserId(),
      sessionId: getSessionId(),
    }),
  }).catch(console.error);
}

// Hook for tracking component views
export function usePageView(pageName: string) {
  useEffect(() => {
    trackEvent({ name: 'page_view', page: pageName });
  }, [pageName]);
}

// Track interactions
export function useTrackClick(buttonName: string, location: string) {
  return () => trackEvent({ 
    name: 'button_click', 
    button: buttonName, 
    location 
  });
}
```

#### 21.2 Performance Monitoring

```typescript
// utils/performance.ts
export function measurePerformance(metricName: string, fn: () => void) {
  const startTime = performance.now();
  
  fn();
  
  const endTime = performance.now();
  const duration = endTime - startTime;

  // Log to monitoring service
  if (duration > 100) { // Threshold: 100ms
    console.warn(`Slow operation: ${metricName} took ${duration.toFixed(2)}ms`);
    
    // Send to monitoring
    sendMetric({
      name: metricName,
      duration,
      timestamp: Date.now(),
    });
  }

  return duration;
}

// Web Vitals tracking
export function trackWebVitals() {
  if ('web-vitals' in window) {
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(sendToAnalytics);
      getFID(sendToAnalytics);
      getFCP(sendToAnalytics);
      getLCP(sendToAnalytics);
      getTTFB(sendToAnalytics);
    });
  }
}

function sendToAnalytics(metric: any) {
  console.log(metric);
  // Send to your analytics service
}
```

#### 21.3 Error Tracking Integration

```typescript
// utils/errorTracking.ts
import * as Sentry from '@sentry/react';

export function initErrorTracking() {
  if (process.env.NODE_ENV === 'production') {
    Sentry.init({
      dsn: process.env.REACT_APP_SENTRY_DSN,
      environment: process.env.NODE_ENV,
      integrations: [
        new Sentry.BrowserTracing(),
        new Sentry.Replay(),
      ],
      tracesSampleRate: 0.1,
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
    });
  }
}

// Custom error logging
export function logError(error: Error, context?: Record<string, any>) {
  console.error(error);
  
  Sentry.captureException(error, {
    extra: context,
  });
}

// Usage
try {
  await riskyOperation();
} catch (error) {
  logError(error as Error, {
    operation: 'riskyOperation',
    userId: user.id,
  });
  toast.error('Operation failed');
}
```

---

## 🎓 IMPLEMENTATION TIMELINE & PRIORITY MATRIX

### Sprint 1 (Week 1): CRITICAL - Foundation
**Goal:** Make app usable again

| Task | Priority | Effort | Dependencies |
|------|----------|--------|--------------|
| Fix root CSS layout | P0 | 2h | None |
| Fix Header rendering | P0 | 4h | Root layout |
| Fix Sidebar rendering | P0 | 4h | Root layout |
| Z-index system | P0 | 2h | None |
| Basic responsive breakpoints | P0 | 3h | Layout fixes |

**Exit Criteria:**
- ✅ Header visible with logo + user menu
- ✅ Sidebar visible with projects list
- ✅ No layout collapse on any screen size
- ✅ Basic navigation working

---

### Sprint 2 (Week 2): HIGH - Chat Widget
**Goal:** Convert chat to toggleable widget

| Task | Priority | Effort | Dependencies |
|------|----------|--------|--------------|
| Design ChatButton FAB | P1 | 3h | Design tokens |
| Build Chat state management | P1 | 4h | None |
| Implement expand/collapse | P1 | 5h | State management |
| Add animations | P1 | 4h | Framer Motion setup |
| Mobile full-screen mode | P1 | 3h | Responsive system |

**Exit Criteria:**
- ✅ Chat button visible bottom-right
- ✅ Smooth expand/collapse animation
- ✅ Badge shows unread count
- ✅ Works on mobile (full-screen)

---

### Sprint 3 (Week 3): HIGH - Polish & Refinement
**Goal:** Professional feel

| Task | Priority | Effort | Dependencies |
|------|----------|--------|--------------|
| Micro-interactions | P1 | 6h | Animation library |
| Loading states/skeletons | P1 | 4h | Skeleton component |
| Error boundaries | P1 | 3h | None |
| Empty states | P1 | 3h | Design system |
| Toast notifications | P1 | 2h | None |

**Exit Criteria:**
- ✅ All interactions feel smooth (60fps)
- ✅ Loading states for all async operations
- ✅ Graceful error handling
- ✅ Clear empty states with CTAs

---

### Sprint 4 (Week 4): MEDIUM - Advanced Features
**Goal:** Power user features

| Task | Priority | Effort | Dependencies |
|------|----------|--------|--------------|
| Command palette (Cmd+K) | P2 | 6h | Search infrastructure |
| Context menus | P2 | 4h | None |
| Keyboard shortcuts | P2 | 4h | Hotkey library |
| Drag & drop reordering | P2 | 5h | DnD library |
| Advanced search/filters | P2 | 6h | Search backend |

**Exit Criteria:**
- ✅ Command palette opens with Cmd+K
- ✅ Right-click context menus work
- ✅ All major actions have keyboard shortcuts
- ✅ Projects can be reordered by dragging

---

### Sprint 5 (Week 5): MEDIUM - Accessibility & i18n
**Goal:** Inclusive design

| Task | Priority | Effort | Dependencies |
|------|----------|--------|--------------|
| Accessibility audit | P2 | 4h | None |
| Keyboard navigation | P2 | 6h | None |
| Screen reader support | P2 | 5h | Semantic HTML |
| i18n setup | P2 | 4h | i18next |
| Multi-language support | P2 | 6h | Translations |

**Exit Criteria:**
- ✅ Lighthouse accessibility score: 100
- ✅ All features keyboard accessible
- ✅ WCAG 2.1 AA compliant
- ✅ English + Vietnamese support

---

### Sprint 6 (Week 6): LOW - Optimization & Launch
**Goal:** Production-ready

| Task | Priority | Effort | Dependencies |
|------|----------|--------|--------------|
| Code splitting | P3 | 4h | Build config |
| Image optimization | P3 | 3h | None |
| Bundle size optimization | P3 | 4h | Webpack analysis |
| Analytics integration | P3 | 3h | GA4/Mixpanel |
| Performance audit | P3 | 4h | Lighthouse |
| Cross-browser testing | P3 | 8h | BrowserStack |

**Exit Criteria:**
- ✅ Initial bundle < 200KB gzipped
- ✅ First Contentful Paint < 1.5s
- ✅ Time to Interactive < 3s
- ✅ Works on Chrome, Firefox, Safari, Edge
- ✅ Analytics tracking all key events

---

## 🎯 FINAL RECOMMENDATIONS

### Technical Stack Decisions

**Animation Library:**
```bash
npm install framer-motion
```
- ✅ Best-in-class animations
- ✅ Great TypeScript support
- ✅ Layout animations out of the box

**State Management:**
```bash
npm install zustand
```
- ✅ Minimal boilerplate
- ✅ TypeScript-first
- ✅ Easy persistence

**Component Library (Optional):**
```bash
npm install @radix-ui/react-* 
```
- ✅ Unstyled, accessible primitives
- ✅ WAI-ARIA compliant
- ✅ Works with Tailwind

**Testing:**
```bash
npm install -D @testing-library/react @testing-library/jest-dom vitest
npm install -D @playwright/test
```

---

### Code Quality Tools

```json
// .eslintrc.json
{
  "extends": [
    "react-app",
    "plugin:@typescript-eslint/recommended",
    "plugin:jsx-a11y/recommended"
  ],
  "rules": {
    "no-console": "warn",
    "prefer-const": "error",
    "@typescript-eslint/no-unused-vars": "error",
    "jsx-a11y/alt-text": "error"
  }
}
```

```json
// .prettierrc
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2
}
```

---

### Git Workflow

```bash
# Feature branch naming
feature/chat-widget-redesign
fix/sidebar-not-rendering
refactor/improve-performance

# Commit message convention
feat: add chat widget toggle functionality
fix: resolve sidebar visibility issue on mobile
perf: lazy load chat component
docs: update setup instructions
style: format code with prettier
refactor: extract chat state to zustand store
test: add unit tests for Header component
```

---

## 🚀 READY TO IMPLEMENT

Bạn đã có một bản **prompting master-level** với:

1. ✅ **Phân tích sâu vấn đề** - Root cause analysis
2. ✅ **Kiến trúc vững chắc** - CSS foundation, z-index system
3. ✅ **UI/UX hiện đại** - Glassmorphism, micro-interactions, animations
4. ✅ **Accessibility-first** - WCAG 2.1 AA compliance
5. ✅ **Performance-driven** - Code splitting, lazy loading, optimization
6. ✅ **Production-ready** - Error handling, monitoring, testing strategy
7. ✅ **Developer experience** - TypeScript, ESLint, clear documentation
8. ✅ **Timeline thực tế** - 6 sprints với priority rõ ràng

**Điểm đặc biệt:**
- 🎨 Giữ nguyên bảng màu hiện tại (theo yêu cầu)
- 🌊 Smooth animations everywhere (60fps)
- 📱 Mobile-first responsive design
- ♿ Accessibility không thỏa hiệp
- 🚀 Performance metrics cụ thể
- 📊 Success criteria cho mỗi phase

Prompting này có thể đưa cho bất kỳ senior developer nào và họ sẽ biết chính xác phải làm gì! 💪