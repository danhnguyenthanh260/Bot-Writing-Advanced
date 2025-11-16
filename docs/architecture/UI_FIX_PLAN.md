# Plan Sửa Lỗi UI - Visibility & Usability Issues

## 🔴 Vấn Đề Hiện Tại (Từ Ảnh)

### 1. Layout Issues
- ❌ **Header không hiển thị** → Login button không có
- ❌ **Sidebar không hiển thị** → Projects không visible
- ❌ **Chỉ có Chat widget full-size** ở giữa màn hình

### 2. Chat Widget Issues  
- ❌ Chat widget hiển thị **full widget** thay vì button toggle
- ❌ Không có cách để **minimize/close** chat
- ❌ Chat chiếm quá nhiều không gian

### 3. Projects Visibility Issues
- ❌ Sidebar không render → **Projects hoàn toàn không visible**
- ❌ Không có cách access projects từ main view
- ❌ Navigation không accessible

### 4. Login Issues
- ❌ Header không render → **Login button không visible**
- ❌ Không có user info display
- ❌ Không có logout option

## ✅ Giải Pháp

### Phase 1: Fix Layout Rendering (Priority: CRITICAL)

#### 1.1. Fix CSS Layout Issues
- Kiểm tra `height: 100vh` và `overflow` properties
- Đảm bảo flex layout hoạt động đúng
- Fix z-index conflicts

#### 1.2. Ensure Header Always Visible
- Header phải fixed/sticky ở top
- Z-index cao hơn content
- Visible trên mọi screen size

#### 1.3. Ensure Sidebar Always Visible  
- Sidebar fixed width 320px
- Visible trên desktop
- Collapsible trên mobile (nhưng vẫn có toggle)

### Phase 2: Chat Widget Redesign (Priority: HIGH)

#### 2.1. Convert to Toggleable Widget
- **Default state:** Button ở góc bottom-right
- **Open state:** Widget overlay/fixed ở bottom-right
- **Minimize button:** X button hoặc minimize icon
- **Toggle animation:** Smooth slide up/down

#### 2.2. Chat Button Design
- Floating button với chat icon
- Badge hiển thị số unread messages
- Hover effect
- Position: fixed bottom-right, z-index cao

#### 2.3. Chat Widget States
```typescript
type ChatState = 'minimized' | 'expanded';
```

### Phase 3: Projects Visibility (Priority: HIGH)

#### 3.1. Always Show Projects in Sidebar
- Sidebar luôn visible (trừ mobile với toggle)
- Projects list scrollable nếu nhiều
- Active project highlight rõ ràng

#### 3.2. Project Quick Access
- Sidebar có search/filter cho projects
- Empty state message rõ ràng khi chưa có project
- "Create New Project" button visible

#### 3.3. Mobile Responsive
- Hamburger menu để toggle sidebar
- Sidebar overlay trên mobile
- Projects list vẫn accessible

### Phase 4: Login/Auth Visibility (Priority: HIGH)

#### 4.1. Header Always Visible
- Header bar fixed top với:
  - Left: Logo/Brand name
  - Center: (empty hoặc breadcrumbs)
  - Right: ThemeToggle + Login/User info

#### 4.2. Login Button States
- **Not logged in:** Google Sign-In button visible
- **Logged in:** User avatar + name + logout button
- **Loading:** Spinner/skeleton

#### 4.3. User Info Display
- Avatar hiển thị
- Name và email (nếu có)
- Logout button accessible

## 🛠️ Implementation Steps

### Step 1: Fix Root Container & Layout
```css
/* Ensure proper height inheritance */
html, body, #root {
  height: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden;
}

.app-container {
  display: flex;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}
```

### Step 2: Fix Header Rendering
- Check z-index
- Ensure position fixed/relative
- Check background color contrast

### Step 3: Fix Sidebar Rendering
- Check width and visibility
- Ensure not hidden by CSS
- Check flex properties

### Step 4: Convert Chat to Toggleable
- Add state management
- Create ChatButton component
- Update DocumentCanvas to conditionally render chat

### Step 5: Test & Verify
- Test all breakpoints
- Test logged in/out states
- Test with/without projects
- Test chat toggle

## 📋 Checklist

- [ ] Fix root container height/overflow
- [ ] Ensure header always renders
- [ ] Ensure sidebar always renders  
- [ ] Create ChatButton component
- [ ] Implement chat toggle functionality
- [ ] Update DocumentCanvas chat rendering
- [ ] Test layout on all screen sizes
- [ ] Verify login button visibility
- [ ] Verify projects visibility
- [ ] Test chat toggle UX

## 🎯 Success Criteria

1. ✅ Header visible với login button hoặc user info
2. ✅ Sidebar visible với projects list
3. ✅ Chat button visible ở bottom-right (minimized)
4. ✅ Click chat button → widget expands
5. ✅ Click minimize → widget collapses to button
6. ✅ Projects scrollable và accessible
7. ✅ Layout responsive trên mobile















