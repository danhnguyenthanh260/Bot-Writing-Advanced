# 🔍 Hướng Dẫn Review UI Design từ Figma

**Mục đích:** Cách share và review UI design từ Figma Make với team

---

## 📋 Cách Share Figma Design để Review

### Option 1: Share Link với View Permission (Khuyến nghị)

1. **Trong Figma:**
   - Click "Share" button (top-right)
   - Set permission: "Can view"
   - Copy link
   - Share link với team

2. **Link format:**
   ```
   https://www.figma.com/file/[FILE_ID]/[FILE_NAME]?node-id=[NODE_ID]
   ```

### Option 2: Export Screenshots

1. **Export các frames quan trọng:**
   - Select frame
   - Right click → "Copy as PNG" hoặc "Export"
   - Export với resolution cao (2x hoặc 3x)

2. **Các frames cần export:**
   - [ ] Desktop layout (full screen)
   - [ ] Header component (all states)
   - [ ] Sidebar component
   - [ ] Chat widget (minimized + expanded)
   - [ ] Upload form (all states)
   - [ ] Project cards
   - [ ] Modals (Publish, Delete)
   - [ ] Dark mode variants
   - [ ] Mobile/Tablet responsive layouts

### Option 3: Export Design Specs

1. **In Figma:**
   - Select component
   - Right panel → "Inspect" tab
   - Copy CSS properties
   - Share specs document

2. **Hoặc export Dev Mode:**
   - Enable Dev Mode
   - Share Dev Mode link
   - Developers có thể xem specs trực tiếp

---

## ✅ Checklist Review UI Design

### 1. Design System Review

#### Colors
- [ ] Light mode colors match spec:
  - Primary: #8B6F47 ✓
  - Background: #FBF9F6 ✓
  - Text: #2C2416 ✓
- [ ] Dark mode colors match spec:
  - Primary: #D4A574 ✓
  - Background: #1A1816 ✓
  - Text: #F5F3EF ✓
- [ ] Contrast ratios meet WCAG AA (4.5:1 minimum)
- [ ] Color usage consistent across components

#### Typography
- [ ] Font families correct:
  - Inter for UI elements ✓
  - Cormorant Garamond for headings ✓
  - JetBrains Mono for code ✓
- [ ] Font sizes match spec (16px base, etc.)
- [ ] Line heights appropriate (1.5 for body, 1.2 for headings)
- [ ] Font weights used correctly

#### Spacing
- [ ] Uses 4px base unit
- [ ] Spacing scale consistent (4, 8, 12, 16, 24, 32, 48, 64px)
- [ ] Padding/margins consistent across components

#### Border Radius
- [ ] Small: 8px (buttons, inputs)
- [ ] Medium: 12px (cards)
- [ ] Large: 16px (modals, large cards)

### 2. Component Review

#### Header Component
- [ ] Fixed position, 64px height
- [ ] Logo left: "Dei8 AI" (Cormorant Garamond, 24px, bold)
- [ ] Right section: Theme toggle + User info
- [ ] Not logged in: Google Sign-In button visible
- [ ] Logged in: Avatar + Name + Dropdown
- [ ] Background: Surface Strong color
- [ ] Border bottom: 1px solid
- [ ] Z-index: 1000 (above content)

#### Sidebar Component
- [ ] Fixed position, 320px width
- [ ] Background: Surface Strong color
- [ ] Border right: 1px solid
- [ ] Projects section:
  - [ ] "Projects" heading visible
  - [ ] Project cards scrollable
  - [ ] Active project highlighted
  - [ ] Empty state with "Create New" button
- [ ] Upload section:
  - [ ] "Upload Google Docs" heading
  - [ ] URL input field (full width, 48px height)
  - [ ] "Analyze" button (primary color)
- [ ] Padding: 20px

#### Chat Widget
- [ ] Minimized state:
  - [ ] Floating button (56px circle)
  - [ ] Position: bottom-right, 20px from edges
  - [ ] Primary color background
  - [ ] White chat icon
  - [ ] Unread badge (red circle, top-right)
  - [ ] Large shadow
- [ ] Expanded state:
  - [ ] Panel: 400px × 600px
  - [ ] Position: bottom-right, 20px from edges
  - [ ] Surface background
  - [ ] Border radius: 16px
  - [ ] Header: "AI Assistant" + minimize button
  - [ ] Messages area: Scrollable
  - [ ] Message bubbles:
    - [ ] User: Right, primary color background
    - [ ] AI: Left, surface strong background
    - [ ] Border radius: 16px
    - [ ] Proper spacing (12px between)
  - [ ] Input area: Text field + send button

#### DocumentCanvas
- [ ] Main content area:
  - [ ] Margin: Left 320px, Top 64px
  - [ ] Background: Main BG color
  - [ ] Infinite canvas support
- [ ] Page cards:
  - [ ] White background
  - [ ] Border radius: 16px
  - [ ] Shadow: Medium
  - [ ] Padding: 24px
  - [ ] Spacing: 24px between cards
- [ ] Empty state:
  - [ ] Centered message
  - [ ] "Upload a document to get started"
  - [ ] Upload button

#### UploadDocForm
- [ ] Card container:
  - [ ] Surface background
  - [ ] Border radius: 12px
  - [ ] Padding: 20px
- [ ] Form elements:
  - [ ] Heading: "Upload Google Docs" (18px, semi-bold)
  - [ ] Description: Muted text, 14px
  - [ ] Input field:
    - [ ] Full width
    - [ ] Height: 48px
    - [ ] Border: 1px solid
    - [ ] Border radius: 8px
    - [ ] Placeholder text
    - [ ] Focus state: Primary border, 2px
  - [ ] Button:
    - [ ] "Analyze" text
    - [ ] Full width
    - [ ] Height: 48px
    - [ ] Primary color background
    - [ ] White text, 16px, semi-bold
    - [ ] Hover: Primary dark
- [ ] States:
  - [ ] Loading: Spinner + disabled
  - [ ] Success: Green message
  - [ ] Error: Red message

#### Project Card
- [ ] Container:
  - [ ] Surface background
  - [ ] Border radius: 12px
  - [ ] Padding: 16px
- [ ] Content:
  - [ ] Title: 16px, semi-bold, primary text
  - [ ] Metadata: 12px, muted text
    - [ ] Word count
    - [ ] Last updated
    - [ ] Chapters count
- [ ] States:
  - [ ] Hover: Surface hover background, shadow
  - [ ] Active: Primary color background tint

#### Modals
- [ ] PublishModal:
  - [ ] Overlay: rgba(44, 36, 22, 0.45)
  - [ ] Modal: Centered, max 600px width
  - [ ] Background: Surface
  - [ ] Border radius: 16px
  - [ ] Shadow: Extra large
  - [ ] Padding: 32px
  - [ ] Title: "Publish Document" (24px, bold)
  - [ ] Form fields
  - [ ] Actions: Cancel + Publish buttons

- [ ] DeleteConfirmationModal:
  - [ ] Similar structure
  - [ ] Warning icon (red)
  - [ ] Title: "Delete Project?"
  - [ ] Message: "This action cannot be undone"
  - [ ] Actions: Cancel + Delete (red button)

#### Toast Notifications
- [ ] Position: Top-right, 20px from edges
- [ ] Size: 320px width, auto height
- [ ] Background: Surface
- [ ] Border radius: 8px
- [ ] Shadow: Medium
- [ ] Padding: 16px
- [ ] Types:
  - [ ] Success: Green accent
  - [ ] Error: Red accent
  - [ ] Info: Blue accent
  - [ ] Warning: Orange accent
- [ ] Content: Icon + Message + Close button

### 3. Responsive Design Review

- [ ] Desktop (1280px+):
  - [ ] Full layout visible
  - [ ] Sidebar always visible
  - [ ] Header always visible

- [ ] Tablet (768px - 1279px):
  - [ ] Sidebar collapsible
  - [ ] Hamburger menu
  - [ ] Layout adapts

- [ ] Mobile (< 768px):
  - [ ] Hamburger menu
  - [ ] Sidebar overlay
  - [ ] Chat widget adapts
  - [ ] Touch targets ≥ 44px

### 4. Dark Mode Review

- [ ] All components have dark mode variants
- [ ] Colors match dark mode spec
- [ ] Contrast ratios maintained
- [ ] Icons/text readable in dark mode

### 5. Interaction & Animation Review

- [ ] Hover effects:
  - [ ] Buttons: Scale 1.02-1.05
  - [ ] Cards: Shadow increase
  - [ ] Links: Color change
- [ ] Transitions:
  - [ ] Duration: 200-500ms
  - [ ] Easing: ease-in-out
- [ ] Chat widget:
  - [ ] Smooth slide up/down
  - [ ] Animation duration: 300ms
- [ ] Modals:
  - [ ] Fade + scale animation
  - [ ] Backdrop fade

### 6. Accessibility Review

- [ ] Color contrast: WCAG AA (4.5:1)
- [ ] Focus indicators: 2px solid primary outline
- [ ] Keyboard navigation: Tab order logical
- [ ] Touch targets: Minimum 44px × 44px
- [ ] ARIA labels on interactive elements
- [ ] Screen reader friendly

---

## 📝 Feedback Template

Khi review, sử dụng template này:

### ✅ What's Working Well
- [List các điểm tốt]

### ⚠️ Issues Found
1. **Component: [Name]**
   - Issue: [Description]
   - Location: [Frame/Page]
   - Severity: Critical/High/Medium/Low
   - Suggestion: [How to fix]

2. **Component: [Name]**
   - Issue: [Description]
   - ...

### 💡 Suggestions for Improvement
- [List suggestions]

### 🎯 Next Steps
- [ ] Fix critical issues
- [ ] Update design system
- [ ] Create missing variants
- [ ] Export assets
- [ ] Handoff to developers

---

## 🔗 Resources

- [Figma Design File](https://www.figma.com/make/0MiN62b59GtCvUfUHjW1aj/Dei8-AI-Writing-Studio-UI)
- [UI Upgrade Plan](../architecture/UI_UPGRADE_PLAN.md)
- [Figma Make Prompt](./FIGMA_MAKE_PROMPT.md)

---

**Last Updated:** 2024

