# 🎨 Figma Make Prompt - Dei8 AI Writing Studio UI

**Mục đích:** Prompt chi tiết để sử dụng Figma Make (AI tool) tạo UI components cho Dei8 AI Writing Studio

---

## 📋 Prompt Chính Cho Figma Make

```
Create a professional, elegant UI design system for "Dei8 AI - Writing & Publishing Studio", 
an AI-powered application for writers and content creators. The design should be sophisticated, 
warm, and optimized for long writing sessions.

## Project Overview
- **Application Type:** Web application (desktop-first, responsive)
- **Target Users:** Writers, researchers, content creators
- **Core Functionality:** 
  - Google Docs integration and analysis
  - AI-powered writing assistant and critique
  - Document workspace with infinite canvas
  - Project management and organization
  - Publishing automation

## Design System Requirements

### Color Palette - Light Mode
**Primary Colors (Burnt Sienna Family):**
- Primary: #8B6F47 (RGB: 139, 111, 71) - Buttons, links, active states
- Primary Dark: #6B5435 (RGB: 107, 84, 53) - Hover states
- Primary Light: #A0825F (RGB: 160, 130, 95) - Subtle highlights
- Primary Subtle: #D4C4B0 (RGB: 212, 196, 176) - Background tints

**Backgrounds:**
- Main BG: #FBF9F6 (RGB: 251, 249, 246) - Warm ivory, soft beige
- Soft BG: #F5F3EF (RGB: 245, 243, 239) - Secondary backgrounds
- Surface: #FFFFFF - Cards, content areas
- Surface Strong: #F8F6F2 (RGB: 248, 246, 242) - Sidebar, panels

**Text Colors:**
- Primary Text: #2C2416 (RGB: 44, 36, 22) - Headings, main text
- Muted Text: #6B6054 (RGB: 107, 96, 84) - Secondary text, labels
- Subtle Text: #9A8F82 (RGB: 154, 143, 130) - Placeholders, hints

**Borders & Shadows:**
- Border: rgba(139, 111, 71, 0.12) - Default borders
- Border Strong: rgba(139, 111, 71, 0.20) - Focus borders
- Shadow System: Subtle shadows using rgba(139, 111, 71, 0.05-0.18)

### Color Palette - Dark Mode
**Primary Colors (Golden Amber Family):**
- Primary: #D4A574 (RGB: 212, 165, 116) - Warm golden, amber glow
- Primary Dark: #B8935F (RGB: 184, 147, 95) - Hover states
- Primary Light: #E6C199 (RGB: 230, 193, 153) - Subtle highlights

**Backgrounds:**
- Main BG: #1A1816 (RGB: 26, 24, 22) - Deep charcoal, warm black
- Soft BG: #2E2B27 (RGB: 46, 43, 39) - Secondary backgrounds
- Surface: #252320 (RGB: 37, 35, 32) - Cards, content areas
- Surface Strong: #2A2724 (RGB: 42, 39, 36) - Sidebar, panels

**Text Colors:**
- Primary Text: #F5F3EF (RGB: 245, 243, 239) - Headings, main text
- Muted Text: #B8B0A8 (RGB: 184, 176, 168) - Secondary text
- Subtle Text: #8A8278 (RGB: 138, 130, 120) - Placeholders

### Typography System
**Font Families:**
- Primary: Inter (sans-serif) - UI elements, body text
- Display: Cormorant Garamond (serif) - Headings, titles
- Monospace: JetBrains Mono - Code, technical content

**Font Sizes:**
- Display: 48px, 36px, 32px, 28px, 24px
- Body: 16px (base), 14px (small), 18px (large)
- Caption: 12px, 10px

**Line Heights:**
- Tight: 1.2 (headings)
- Normal: 1.5 (body)
- Relaxed: 1.75 (long-form content)

**Font Weights:**
- Light: 300
- Regular: 400
- Medium: 500
- Semi-bold: 600
- Bold: 700

### Layout Structure
**Main Layout:**
- Header: Fixed top, height 64px, full width
- Sidebar: Fixed left, width 320px, full height
- Main Content: Margin left 320px, margin top 64px, infinite canvas
- Chat Widget: Floating button bottom-right, expandable overlay

**Spacing System:**
- Base unit: 4px
- Scale: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96px

**Border Radius:**
- Small: 8px (buttons, inputs)
- Medium: 12px (cards)
- Large: 16px (modals, large cards)
- XLarge: 24px (hero elements)

## Component Specifications

### 1. Header Component
**Layout:**
- Fixed position, top 0, full width
- Height: 64px
- Background: Surface Strong color
- Border bottom: 1px solid border color
- Z-index: 1000

**Content (3 sections):**
- Left: Logo/Brand name "Dei8 AI" (Cormorant Garamond, 24px, bold)
- Center: Empty or breadcrumbs (optional)
- Right: ThemeToggle + User info/Login button

**User Info States:**
- Not logged in: Google Sign-In button (primary color, rounded)
- Logged in: Avatar (32px circle) + Name + Dropdown menu
- Loading: Skeleton loader

**Design Details:**
- Padding: 16px horizontal
- Shadow: Subtle bottom shadow
- Smooth transitions on hover

### 2. Sidebar Component
**Layout:**
- Fixed position, left 0, top 64px
- Width: 320px
- Height: calc(100vh - 64px)
- Background: Surface Strong color
- Border right: 1px solid border color
- Z-index: 999

**Sections (top to bottom):**
1. **Navigation Section** (top)
   - "Projects" heading (Inter, 14px, semi-bold, muted text)
   - Projects list (scrollable)
   - Each project: Card with title, word count, last updated
   - Active project: Highlighted with primary color background tint
   - Empty state: "No projects yet" message + "Create New" button

2. **Upload Section** (middle)
   - "Upload Document" heading
   - UploadDocForm component
   - Google Docs URL input field
   - "Analyze" button (primary color)

3. **Actions Section** (bottom, optional)
   - Settings link
   - Help link

**Design Details:**
- Padding: 20px
- Scrollable content area
- Smooth hover effects on project cards
- Active state clearly visible

### 3. Main Content Area (DocumentCanvas)
**Layout:**
- Position: Relative
- Margin: Left 320px, Top 64px
- Full remaining viewport
- Background: Main BG color
- Infinite canvas with pan/zoom

**Content:**
- Multiple pages: Draft, Critique, Final
- Each page: Card-based layout
- Cards: White background, rounded 16px, shadow medium
- Card padding: 24px
- Card spacing: 24px

**Empty State:**
- Centered message
- "Upload a document to get started" text
- Upload button (primary color)

**Design Details:**
- Smooth transitions
- Card hover effects
- Loading states with skeletons

### 4. Chat Widget Component
**States:**
- **Minimized:** Floating button (56px circle) bottom-right, 20px from edges
- **Expanded:** Overlay panel (400px width, 600px height) bottom-right

**Minimized Button:**
- Size: 56px × 56px
- Background: Primary color
- Icon: Chat/message icon (white)
- Badge: Unread count (red circle, top-right)
- Shadow: Large shadow
- Hover: Scale 1.05, shadow increase

**Expanded Panel:**
- Position: Fixed, bottom 20px, right 20px
- Width: 400px
- Height: 600px (max)
- Background: Surface color
- Border radius: 16px top corners, 8px bottom
- Shadow: Extra large shadow
- Z-index: 998

**Panel Structure:**
- Header: "AI Assistant" title + Minimize button (X icon)
- Messages area: Scrollable, padding 16px
- Input area: Text input + Send button (bottom)

**Message Bubbles:**
- User messages: Right aligned, primary color background
- AI messages: Left aligned, surface strong background
- Text: 14px, line height 1.5
- Padding: 12px 16px
- Border radius: 16px
- Spacing: 12px between messages

**Design Details:**
- Smooth slide-up animation when expanding
- Smooth slide-down when minimizing
- Typing indicator (animated dots)
- Timestamp (subtle, muted text)

### 5. UploadDocForm Component
**Layout:**
- Container: Card style (surface color, rounded 12px, padding 20px)
- Form elements: Stacked vertically

**Elements:**
1. **Heading:** "Upload Google Docs" (Inter, 18px, semi-bold)
2. **Description:** "Paste a Google Docs URL to analyze your document" (muted text, 14px)
3. **Input Field:**
   - Full width
   - Height: 48px
   - Border: 1px solid border color
   - Border radius: 8px
   - Padding: 12px 16px
   - Placeholder: "https://docs.google.com/document/d/..."
   - Focus: Border color primary, 2px width
4. **Button:**
   - "Analyze" button
   - Full width
   - Height: 48px
   - Background: Primary color
   - Text: White, 16px, semi-bold
   - Border radius: 8px
   - Hover: Primary dark color
   - Loading state: Spinner + disabled

**States:**
- Default: Normal input and button
- Loading: Button disabled, spinner icon
- Success: Success message (green, 14px)
- Error: Error message (red, 14px)

### 6. Project Card Component
**Layout:**
- Container: Card (surface color, rounded 12px, padding 16px)
- Hover: Surface hover color, shadow small
- Active: Primary color background tint

**Content:**
- Title: Inter, 16px, semi-bold, primary text
- Metadata: Muted text, 12px
  - Word count: "2,500 words"
  - Last updated: "Updated 2 hours ago"
  - Chapters: "5 chapters"
- Actions: 3-dot menu (optional, top-right)

**Spacing:**
- Gap between cards: 12px
- Card padding: 16px

### 7. Modal Components

#### PublishModal
- Overlay: rgba(44, 36, 22, 0.45) backdrop
- Modal: Centered, max width 600px
- Background: Surface color
- Border radius: 16px
- Shadow: Extra large
- Padding: 32px

**Content:**
- Title: "Publish Document" (24px, bold)
- Form fields: Platform selection, settings
- Actions: Cancel (outline) + Publish (primary) buttons

#### DeleteConfirmationModal
- Similar structure
- Warning icon (red)
- Title: "Delete Project?"
- Message: "This action cannot be undone"
- Actions: Cancel + Delete (red button)

### 8. Toast Notifications
**Position:** Top-right, 20px from edges
**Size:** 320px width, auto height
**Design:**
- Background: Surface color
- Border radius: 8px
- Shadow: Medium
- Padding: 16px

**Types:**
- Success: Green accent color
- Error: Red accent color
- Info: Blue accent color
- Warning: Orange accent color

**Content:**
- Icon (left) + Message (center) + Close button (right)
- Auto-dismiss after 5 seconds

### 9. ThemeToggle Component
**Design:**
- Toggle switch style
- Size: 48px × 24px
- Background: Border color (light mode) / Surface strong (dark mode)
- Active: Primary color
- Icon: Sun (light) / Moon (dark)
- Smooth transition

### 10. Button Variants
**Primary Button:**
- Background: Primary color
- Text: White
- Padding: 12px 24px
- Border radius: 8px
- Hover: Primary dark
- Active: Pressed state (slightly darker)

**Secondary Button:**
- Background: Transparent
- Border: 1px solid border color
- Text: Primary text color
- Hover: Surface hover background

**Outline Button:**
- Background: Transparent
- Border: 2px solid primary color
- Text: Primary color
- Hover: Primary color background

**Ghost Button:**
- Background: Transparent
- Text: Muted text color
- Hover: Surface hover background

## Responsive Breakpoints
- Desktop: 1280px+ (full layout)
- Tablet: 768px - 1279px (collapsible sidebar)
- Mobile: < 768px (hamburger menu, overlay sidebar)

## Animation & Transitions
- Duration: 200ms (fast), 300ms (normal), 500ms (slow)
- Easing: ease-in-out (default), ease-out (entering), ease-in (exiting)
- Hover effects: Scale 1.02-1.05, shadow increase
- Page transitions: Fade in/out
- Modal: Scale + fade
- Chat widget: Slide up/down

## Accessibility Requirements
- Color contrast: WCAG AA minimum (4.5:1 for text)
- Focus indicators: 2px solid primary color outline
- Keyboard navigation: Tab order logical
- Screen reader: ARIA labels on interactive elements
- Touch targets: Minimum 44px × 44px

## Design Principles
1. **Elegance:** Sophisticated, warm, inviting
2. **Readability:** High contrast, clear typography
3. **Comfort:** Optimized for long writing sessions
4. **Clarity:** Clear hierarchy, intuitive navigation
5. **Consistency:** Unified design language throughout

## Deliverables Needed
Please create:
1. Complete design system (colors, typography, spacing)
2. Header component (all states)
3. Sidebar component (with projects list)
4. DocumentCanvas component (with page cards)
5. ChatWidget component (minimized + expanded states)
6. UploadDocForm component (all states)
7. Project Card component
8. Modal components (Publish, Delete)
9. Toast notifications
10. Button variants
11. ThemeToggle component
12. Responsive layouts (desktop, tablet, mobile)

Use Figma's auto-layout, components, and variants for maintainability.
Ensure all components support both light and dark modes.
```

---

## 🎯 Alternative Shorter Prompt (Nếu Figma Make có giới hạn độ dài)

```
Design a professional writing studio UI with:

**Color System:**
- Light: Warm ivory (#FBF9F6), burnt sienna primary (#8B6F47), dark text (#2C2416)
- Dark: Deep charcoal (#1A1816), golden amber primary (#D4A574), light text (#F5F3EF)

**Layout:**
- Fixed header (64px) with logo, theme toggle, user auth
- Fixed sidebar (320px) with projects list and upload form
- Main content area with infinite canvas and document cards
- Floating chat button (bottom-right) that expands to 400×600px panel

**Components:**
1. Header: Logo left, user info right, theme toggle
2. Sidebar: Projects list (scrollable cards), upload form (URL input + analyze button)
3. DocumentCanvas: Card-based pages (Draft, Critique, Final), empty state
4. ChatWidget: Minimized button (56px circle) → Expanded panel (400×600px) with message bubbles
5. UploadDocForm: Card with URL input, analyze button, loading/error states
6. ProjectCard: Title, metadata (word count, chapters), hover/active states
7. Modals: Publish (platform selection), Delete (confirmation)
8. Toast: Top-right notifications (success/error/info)

**Typography:** Inter (UI), Cormorant Garamond (headings), JetBrains Mono (code)
**Spacing:** 4px base unit, 8-96px scale
**Border Radius:** 8px (small), 12px (medium), 16px (large)
**Shadows:** Subtle, warm-toned
**Animations:** 200-500ms, ease-in-out, hover scale 1.02-1.05

**Responsive:** Desktop (full), Tablet (collapsible sidebar), Mobile (hamburger menu)
**Accessibility:** WCAG AA contrast, focus indicators, keyboard navigation

Create components with auto-layout, variants for states, and dark mode support.
```

---

## 📝 Additional Context Prompts (Nếu cần chi tiết hơn)

### Prompt cho từng Component riêng lẻ:

#### Header Component Prompt:
```
Create a fixed header component (64px height) for a writing studio app:
- Left: Logo "Dei8 AI" (serif font, 24px, bold, primary color)
- Right: Theme toggle switch + User section
  - Not logged in: Google Sign-In button (primary color, rounded, 48px height)
  - Logged in: Avatar (32px circle) + Name + Dropdown menu
- Background: Surface strong color (#F8F6F2 light / #2A2724 dark)
- Border bottom: 1px solid, subtle shadow
- Padding: 16px horizontal
- Z-index: 1000
- Smooth hover transitions
```

#### Chat Widget Prompt:
```
Create a toggleable chat widget component:
- Minimized: Floating button (56px circle) bottom-right, primary color background, white chat icon, unread badge (red circle), large shadow, hover scale 1.05
- Expanded: Panel (400px × 600px) bottom-right, surface background, rounded 16px, extra large shadow
  - Header: "AI Assistant" title + minimize button (X icon)
  - Messages: Scrollable area with message bubbles
    - User: Right aligned, primary color background, white text
    - AI: Left aligned, surface strong background, dark text
    - Bubbles: 16px border radius, 12px padding, 12px spacing
  - Input: Text field + send button at bottom
- Animation: Smooth slide up/down (300ms, ease-out)
- Typing indicator: Animated dots
```

#### Sidebar Prompt:
```
Create a fixed sidebar (320px width) for project management:
- Background: Surface strong color
- Border right: 1px solid
- Sections (top to bottom):
  1. Projects list: Scrollable cards
     - Each card: Title (16px semi-bold), metadata (12px muted), hover effect, active state (primary tint)
     - Empty state: "No projects" message + create button
  2. Upload section: Card with form
     - Heading: "Upload Google Docs" (18px)
     - URL input: Full width, 48px height, 8px radius
     - Analyze button: Primary color, full width, 48px height
     - Loading/error states
- Padding: 20px
- Smooth scroll, hover effects
```

---

## 🔧 Tips khi sử dụng với Figma Make

1. **Bắt đầu với Design System:**
   - Tạo color styles trước
   - Setup typography styles
   - Define spacing tokens

2. **Tạo Components theo thứ tự:**
   - Base components (buttons, inputs) trước
   - Composite components (forms, cards) sau
   - Layout components (header, sidebar) cuối

3. **Sử dụng Variants:**
   - Button variants: primary, secondary, outline, ghost
   - Chat widget: minimized, expanded
   - User state: logged in, logged out, loading

4. **Auto-layout:**
   - Enable auto-layout cho tất cả components
   - Set proper constraints
   - Test responsive behavior

5. **Dark Mode:**
   - Tạo color styles cho cả light và dark
   - Use component variants cho dark mode
   - Test contrast ratios

6. **Export Assets:**
   - Export icons as SVG
   - Export images as PNG/WebP
   - Document component specs

---

## 📦 Deliverables Checklist

Sau khi Figma Make tạo xong, bạn cần:

- [ ] Design system file với colors, typography, spacing
- [ ] Component library với tất cả components
- [ ] Layout frames cho desktop, tablet, mobile
- [ ] Dark mode variants
- [ ] Interactive prototypes (nếu có)
- [ ] Export assets (icons, images)
- [ ] Design specs (measurements, spacing)

---

**Xem thêm:**
- [UI_UPGRADE_PLAN.md](../architecture/UI_UPGRADE_PLAN.md) - Chi tiết design system
- [UI_FIX_PLAN.md](../architecture/UI_FIX_PLAN.md) - Vấn đề UI cần fix
- [SYSTEM_WORKFLOWS.md](./SYSTEM_WORKFLOWS.md) - Luồng hoạt động

---

**Last Updated:** 2024

