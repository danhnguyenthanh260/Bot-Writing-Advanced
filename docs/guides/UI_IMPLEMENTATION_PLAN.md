# 🎨 Kế Hoạch Implementation UI Upgrade - Dei8 AI Writing Studio

**Mục đích:** Kế hoạch chi tiết để implement UI upgrade từ Figma design vào codebase

**Dựa trên:**
- [UI_UPGRADE_PLAN.md](../architecture/UI_UPGRADE_PLAN.md) - Design specifications
- [UI_FIX_PLAN.md](../architecture/UI_FIX_PLAN.md) - Issues cần fix
- Figma Design: Dei8 AI Writing Studio UI

---

## 📋 Tổng Quan

### Mục Tiêu
1. ✅ Implement design system mới (colors, typography, spacing)
2. ✅ Fix layout issues (header, sidebar visibility)
3. ✅ Convert chat widget thành toggleable
4. ✅ Apply dark mode đầy đủ
5. ✅ Improve component styling theo spec
6. ✅ Add animations & transitions

### Timeline
- **Week 1:** Design System & Core Layout
- **Week 2:** Components & Interactions
- **Week 3:** Dark Mode & Polish

---

## 🎯 Phase 1: Design System Implementation

### Task 1.1: CSS Variables & Color System

**File:** `index.css` hoặc `styles/design-system.css`

#### Step 1: Define Light Mode Colors

```css
:root {
  /* Primary Colors - Burnt Sienna Family */
  --color-primary: #8B6F47;
  --color-primary-dark: #6B5435;
  --color-primary-light: #A0825F;
  --color-primary-subtle: #D4C4B0;
  --color-primary-bg: #F5F0EA;

  /* Backgrounds */
  --color-bg: #FBF9F6;
  --color-bg-soft: #F5F3EF;
  --color-surface: #FFFFFF;
  --color-surface-strong: #F8F6F2;
  --color-surface-hover: #FDFCF9;

  /* Text Colors */
  --color-text: #2C2416;
  --color-text-muted: #6B6054;
  --color-text-subtle: #9A8F82;
  --color-text-on-primary: #FFFFFF;

  /* Borders */
  --color-border: rgba(139, 111, 71, 0.12);
  --color-border-strong: rgba(139, 111, 71, 0.20);
  --color-border-subtle: rgba(139, 111, 71, 0.08);
  --color-divider: rgba(107, 96, 84, 0.15);

  /* Shadows */
  --shadow-xs: 0 1px 2px 0 rgba(139, 111, 71, 0.05);
  --shadow-sm: 0 2px 4px 0 rgba(139, 111, 71, 0.06), 
               0 1px 2px 0 rgba(139, 111, 71, 0.04);
  --shadow-md: 0 4px 8px -2px rgba(139, 111, 71, 0.08),
               0 2px 4px -1px rgba(139, 111, 71, 0.05);
  --shadow-lg: 0 12px 24px -4px rgba(139, 111, 71, 0.12),
               0 4px 8px -2px rgba(139, 111, 71, 0.08);
  --shadow-xl: 0 20px 40px -8px rgba(139, 111, 71, 0.15),
               0 8px 16px -4px rgba(139, 111, 71, 0.10);
  --shadow-2xl: 0 32px 64px -12px rgba(139, 111, 71, 0.18),
                0 12px 24px -4px rgba(139, 111, 71, 0.12);

  /* Overlay */
  --color-overlay: rgba(44, 36, 22, 0.45);
  --color-overlay-light: rgba(44, 36, 22, 0.25);

  /* Z-index */
  --z-base: 1;
  --z-sticky: 100;
  --z-fixed: 200;
  --z-dropdown: 300;
  --z-modal: 400;
  --z-toast: 500;
}
```

#### Step 2: Define Dark Mode Colors

```css
[data-theme="dark"] {
  /* Primary Colors - Golden Amber Family */
  --color-primary: #D4A574;
  --color-primary-dark: #B8935F;
  --color-primary-light: #E6C199;
  --color-primary-subtle: rgba(212, 165, 116, 0.15);

  /* Backgrounds */
  --color-bg: #1A1816;
  --color-bg-soft: #25221F;
  --color-surface: #2E2B27;
  --color-surface-strong: #35322D;
  --color-surface-hover: #383530;

  /* Text Colors */
  --color-text: #F5F3EF;
  --color-text-muted: #C9C4BB;
  --color-text-subtle: #9A958D;
  --color-text-on-primary: #1A1816;

  /* Borders */
  --color-border: rgba(212, 165, 116, 0.15);
  --color-border-strong: rgba(212, 165, 116, 0.25);

  /* Shadows (darker for dark mode) */
  --shadow-xs: 0 1px 2px 0 rgba(0, 0, 0, 0.3);
  --shadow-sm: 0 2px 4px 0 rgba(0, 0, 0, 0.35),
               0 1px 2px 0 rgba(0, 0, 0, 0.25);
  --shadow-md: 0 4px 8px -2px rgba(0, 0, 0, 0.4),
               0 2px 4px -1px rgba(0, 0, 0, 0.3);
  --shadow-lg: 0 12px 24px -4px rgba(0, 0, 0, 0.45),
               0 4px 8px -2px rgba(0, 0, 0, 0.35);
  --shadow-xl: 0 20px 40px -8px rgba(0, 0, 0, 0.5),
               0 8px 16px -4px rgba(0, 0, 0, 0.4);
  --shadow-2xl: 0 32px 64px -12px rgba(0, 0, 0, 0.55),
                0 12px 24px -4px rgba(0, 0, 0, 0.45);

  /* Overlay */
  --color-overlay: rgba(0, 0, 0, 0.65);
  --color-overlay-light: rgba(0, 0, 0, 0.45);
}
```

#### Step 3: Base Styles

```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body, #root {
  height: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden;
}

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 16px;
  line-height: 1.5;
  color: var(--color-text);
  background-color: var(--color-bg);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.app-container {
  display: flex;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}
```

**Checklist:**
- [ ] Create `styles/design-system.css`
- [ ] Define all light mode colors
- [ ] Define all dark mode colors
- [ ] Add base styles
- [ ] Test color contrast ratios
- [ ] Import vào `main.tsx` hoặc `App.tsx`

---

### Task 1.2: Typography System

**File:** `styles/typography.css`

```css
/* Font Families */
.font-display {
  font-family: 'Cormorant Garamond', serif;
}

.font-body {
  font-family: 'Inter', sans-serif;
}

.font-mono {
  font-family: 'JetBrains Mono', monospace;
}

/* Display Sizes */
.text-display-1 {
  font-size: 48px;
  line-height: 1.2;
  font-weight: 700;
  font-family: 'Cormorant Garamond', serif;
}

.text-display-2 {
  font-size: 36px;
  line-height: 1.2;
  font-weight: 700;
  font-family: 'Cormorant Garamond', serif;
}

.text-display-3 {
  font-size: 32px;
  line-height: 1.2;
  font-weight: 700;
  font-family: 'Cormorant Garamond', serif;
}

.text-display-4 {
  font-size: 28px;
  line-height: 1.2;
  font-weight: 600;
  font-family: 'Cormorant Garamond', serif;
}

.text-display-5 {
  font-size: 24px;
  line-height: 1.2;
  font-weight: 600;
  font-family: 'Cormorant Garamond', serif;
}

/* Body Sizes */
.text-base {
  font-size: 16px;
  line-height: 1.5;
  font-weight: 400;
}

.text-lg {
  font-size: 18px;
  line-height: 1.75;
  font-weight: 400;
}

.text-sm {
  font-size: 14px;
  line-height: 1.5;
  font-weight: 400;
}

/* Caption */
.text-caption {
  font-size: 12px;
  line-height: 1.5;
  font-weight: 400;
}

.text-caption-sm {
  font-size: 10px;
  line-height: 1.5;
  font-weight: 400;
}

/* Font Weights */
.font-light { font-weight: 300; }
.font-normal { font-weight: 400; }
.font-medium { font-weight: 500; }
.font-semibold { font-weight: 600; }
.font-bold { font-weight: 700; }
```

**Checklist:**
- [ ] Create `styles/typography.css`
- [ ] Add Google Fonts imports (Inter, Cormorant Garamond, JetBrains Mono)
- [ ] Define all typography classes
- [ ] Test typography in both themes

---

### Task 1.3: Spacing & Layout Utilities

**File:** `styles/utilities.css`

```css
/* Spacing System (4px base unit) */
.spacing-1 { margin: 4px; padding: 4px; }
.spacing-2 { margin: 8px; padding: 8px; }
.spacing-3 { margin: 12px; padding: 12px; }
.spacing-4 { margin: 16px; padding: 16px; }
.spacing-5 { margin: 20px; padding: 20px; }
.spacing-6 { margin: 24px; padding: 24px; }
.spacing-8 { margin: 32px; padding: 32px; }
.spacing-10 { margin: 40px; padding: 40px; }
.spacing-12 { margin: 48px; padding: 48px; }
.spacing-16 { margin: 64px; padding: 64px; }

/* Border Radius */
.rounded-sm { border-radius: 8px; }
.rounded-md { border-radius: 12px; }
.rounded-lg { border-radius: 16px; }
.rounded-xl { border-radius: 24px; }

/* Transitions */
.transition-fast { transition: all 200ms ease-in-out; }
.transition-normal { transition: all 300ms ease-in-out; }
.transition-slow { transition: all 500ms ease-in-out; }
```

**Checklist:**
- [ ] Create `styles/utilities.css`
- [ ] Define spacing utilities
- [ ] Define border radius utilities
- [ ] Define transition utilities

---

## 🎯 Phase 2: Layout Fixes

### Task 2.1: Fix Root Container

**File:** `App.tsx`

```tsx
// Ensure proper container structure
<div className="app-container">
  <Header ... />
  <Sidebar ... />
  <main className="main-content">
    <DocumentCanvas ... />
  </main>
  <ChatWidget ... />
</div>
```

**CSS:**

```css
.main-content {
  margin-left: 320px; /* Sidebar width */
  margin-top: 64px; /* Header height */
  width: calc(100vw - 320px);
  height: calc(100vh - 64px);
  overflow: auto;
  background: var(--color-bg);
}

@media (max-width: 768px) {
  .main-content {
    margin-left: 0;
    width: 100vw;
  }
}
```

**Checklist:**
- [ ] Fix `App.tsx` container structure
- [ ] Add `.main-content` styles
- [ ] Test responsive behavior
- [ ] Verify no overflow issues

---

### Task 2.2: Fix Header Visibility

**File:** `components/Header.tsx`

**Updates needed:**
1. Ensure fixed position
2. High z-index
3. Proper background
4. Always visible

```tsx
<header
  className="fixed top-0 left-0 right-0 h-16 z-[var(--z-fixed)]"
  style={{
    backgroundColor: 'var(--color-surface-strong)',
    borderBottom: '1px solid var(--color-border)',
    boxShadow: 'var(--shadow-sm)',
  }}
>
  {/* Header content */}
</header>
```

**Checklist:**
- [ ] Update Header component với fixed position
- [ ] Set z-index cao
- [ ] Add proper background
- [ ] Test visibility on scroll
- [ ] Test responsive

---

### Task 2.3: Fix Sidebar Visibility

**File:** `components/Sidebar.tsx`

**Updates needed:**
1. Fixed position
2. Always visible on desktop
3. Collapsible on mobile
4. Proper z-index

```tsx
<aside
  className="fixed left-0 top-16 bottom-0 w-80 z-[var(--z-fixed)]"
  style={{
    backgroundColor: 'var(--color-surface-strong)',
    borderRight: '1px solid var(--color-border)',
    boxShadow: 'var(--shadow-md)',
  }}
>
  {/* Sidebar content */}
</aside>
```

**Checklist:**
- [ ] Update Sidebar với fixed position
- [ ] Set proper width (320px)
- [ ] Add mobile toggle functionality
- [ ] Test visibility
- [ ] Test responsive

---

## 🎯 Phase 3: Component Updates

### Task 3.1: Chat Widget - Toggleable

**File:** `components/ChatWidget.tsx`

**Current:** Full widget always visible  
**Target:** Toggleable button → expanded panel

#### Step 1: Add State Management

```tsx
const [isExpanded, setIsExpanded] = useState(false);
```

#### Step 2: Create Minimized Button

```tsx
{!isExpanded && (
  <button
    onClick={() => setIsExpanded(true)}
    className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-[var(--color-primary)] text-white shadow-[var(--shadow-lg)] hover:scale-105 transition-all z-[var(--z-fixed)]"
    aria-label="Open chat"
  >
    <ChatIcon className="w-6 h-6" />
    {unreadCount > 0 && (
      <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center">
        {unreadCount}
      </span>
    )}
  </button>
)}
```

#### Step 3: Create Expanded Panel

```tsx
{isExpanded && (
  <div
    className="fixed bottom-6 right-6 w-[400px] h-[600px] max-h-[calc(100vh-120px)] bg-[var(--color-surface)] rounded-t-2xl rounded-b-lg shadow-[var(--shadow-xl)] z-[var(--z-fixed)] flex flex-col"
    style={{
      animation: 'slideUp 300ms ease-out',
    }}
  >
    {/* Header */}
    <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
      <h3 className="text-lg font-semibold">AI Assistant</h3>
      <button
        onClick={() => setIsExpanded(false)}
        className="p-2 hover:bg-[var(--color-surface-hover)] rounded-lg transition-colors"
      >
        <XIcon className="w-5 h-5" />
      </button>
    </div>

    {/* Messages */}
    <div className="flex-1 overflow-y-auto p-4">
      {/* Message bubbles */}
    </div>

    {/* Input */}
    <div className="p-4 border-t border-[var(--color-border)]">
      {/* Input field + send button */}
    </div>
  </div>
)}
```

#### Step 4: Add Animation

```css
@keyframes slideUp {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
```

**Checklist:**
- [ ] Add state management
- [ ] Create minimized button
- [ ] Create expanded panel
- [ ] Add animations
- [ ] Test toggle functionality
- [ ] Test responsive

---

### Task 3.2: Update Project Cards

**File:** `components/Sidebar.tsx` (project card section)

**Updates:**
1. Better styling theo spec
2. Hover effects
3. Active state
4. Proper spacing

```tsx
<div
  className={`p-4 rounded-xl cursor-pointer transition-all ${
    isActive
      ? 'bg-[var(--color-primary-subtle)] border-2 border-[var(--color-primary)]'
      : 'bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)] border border-[var(--color-border)]'
  }`}
  style={{
    boxShadow: isActive ? 'var(--shadow-md)' : 'var(--shadow-sm)',
  }}
>
  <h4 className="text-base font-semibold text-[var(--color-text)] mb-2">
    {project.title}
  </h4>
  <div className="text-sm text-[var(--color-text-muted)] space-y-1">
    <p>{project.wordCount} words</p>
    <p>{project.chapters} chapters</p>
    <p>Updated {formatTime(project.updatedAt)}</p>
  </div>
</div>
```

**Checklist:**
- [ ] Update project card styling
- [ ] Add hover effects
- [ ] Add active state
- [ ] Test interactions

---

### Task 3.3: Update Upload Form

**File:** `components/UploadDocForm.tsx`

**Updates:**
1. Card container styling
2. Input field styling
3. Button styling
4. States (loading, success, error)

```tsx
<div className="bg-[var(--color-surface)] rounded-xl p-5 shadow-[var(--shadow-md)]">
  <h3 className="text-lg font-semibold mb-2">Upload Google Docs</h3>
  <p className="text-sm text-[var(--color-text-muted)] mb-4">
    Paste a Google Docs URL to analyze your document
  </p>
  
  <input
    type="text"
    className="w-full h-12 px-4 rounded-lg border border-[var(--color-border)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-subtle)] transition-all"
    placeholder="https://docs.google.com/document/d/..."
  />
  
  <button
    className="w-full h-12 mt-4 bg-[var(--color-primary)] text-white rounded-lg font-semibold hover:bg-[var(--color-primary-dark)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    disabled={loading}
  >
    {loading ? 'Analyzing...' : 'Analyze'}
  </button>
</div>
```

**Checklist:**
- [ ] Update form container
- [ ] Style input field
- [ ] Style button
- [ ] Add loading state
- [ ] Add success/error states

---

## 🎯 Phase 4: Dark Mode Implementation

### Task 4.1: Theme Toggle Component

**File:** `components/ThemeToggle.tsx`

**Ensure:**
1. Toggle works correctly
2. Persists to localStorage
3. Updates CSS variables
4. Smooth transition

```tsx
const toggleTheme = () => {
  const newTheme = theme === 'light' ? 'dark' : 'light';
  setTheme(newTheme);
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
};
```

**Checklist:**
- [ ] Verify theme toggle works
- [ ] Test persistence
- [ ] Test all components in dark mode
- [ ] Fix any contrast issues

---

## 🎯 Phase 5: Animations & Polish

### Task 5.1: Add Transitions

**Files:** All component files

**Add transitions to:**
- Hover states
- Focus states
- Active states
- Modal open/close
- Chat widget expand/collapse

```css
.component {
  transition: all 300ms ease-in-out;
}

.component:hover {
  transform: scale(1.02);
  box-shadow: var(--shadow-md);
}
```

**Checklist:**
- [ ] Add transitions to buttons
- [ ] Add transitions to cards
- [ ] Add transitions to modals
- [ ] Test smoothness

---

## 📋 Implementation Checklist

### Week 1: Design System
- [ ] Task 1.1: CSS Variables & Colors
- [ ] Task 1.2: Typography System
- [ ] Task 1.3: Spacing & Utilities

### Week 2: Layout & Components
- [ ] Task 2.1: Fix Root Container
- [ ] Task 2.2: Fix Header Visibility
- [ ] Task 2.3: Fix Sidebar Visibility
- [ ] Task 3.1: Chat Widget Toggleable
- [ ] Task 3.2: Update Project Cards
- [ ] Task 3.3: Update Upload Form

### Week 3: Dark Mode & Polish
- [ ] Task 4.1: Theme Toggle
- [ ] Task 5.1: Add Transitions
- [ ] Final testing
- [ ] Documentation

---

## 🔗 Resources

- [UI_UPGRADE_PLAN.md](../architecture/UI_UPGRADE_PLAN.md)
- [UI_FIX_PLAN.md](../architecture/UI_FIX_PLAN.md)
- [FIGMA_MAKE_PROMPT.md](./FIGMA_MAKE_PROMPT.md)

---

**Last Updated:** 2024

