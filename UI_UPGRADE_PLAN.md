# Kế Hoạch Nâng Cấp UI - Studio Viết Lách AI

## Mục Tiêu
Tạo trải nghiệm UI sang trọng, dễ chịu mắt, phù hợp với người làm nội dung chữ và nghiên cứu, tối ưu cho việc làm việc lâu dài.

**Version**: 2.0 - Chi Tiết Đầy Đủ  
**Last Updated**: 2024  
**Target Audience**: Writers, Researchers, Content Creators

---

## Mục Lục
1. [Hệ Thống Màu Sắc Chi Tiết](#phan-1-he-thong-mau-sac-chi-tiet)
2. [Typography System Hoàn Chỉnh](#phan-2-typography-system-hoan-chinh)
3. [Layout & Spacing Specifications](#phan-3-layout--spacing-specifications)
4. [Component Specifications Chi Tiết](#phan-4-component-specifications-chi-tiet)
5. [Dark Mode Implementation Chi Tiết](#phan-5-dark-mode-implementation-chi-tiet)
6. [Animations & Transitions Specs](#phan-6-animations--transitions-specs)
7. [Accessibility Requirements](#phan-7-accessibility-requirements)
8. [Code Implementation](#phan-8-code-implementation)
9. [Component Breakdowns](#phan-9-component-breakdowns)
10. [State Specifications](#phan-10-state-specifications)

---

## Phần 1: Hệ Thống Màu Sắc Chi Tiết

### 1.1. Light Mode - Tông Màu Sang Trọng, Ấm Áp

#### Primary Palette
```css
/* Primary Colors - Burnt Sienna Family */
--color-primary: #8B6F47;
  /* RGB: rgb(139, 111, 71) */
  /* Usage: Buttons, links, active states, accents */
  /* Contrast Ratio: 4.8:1 trên white */

--color-primary-dark: #6B5435;
  /* RGB: rgb(107, 84, 53) */
  /* Usage: Hover states, pressed buttons */
  /* Contrast Ratio: 7.2:1 trên white */

--color-primary-light: #A0825F;
  /* RGB: rgb(160, 130, 95) */
  /* Usage: Subtle highlights, borders */
  /* Contrast Ratio: 3.9:1 trên white */

--color-primary-subtle: #D4C4B0;
  /* RGB: rgb(212, 196, 176) */
  /* Usage: Background tints, disabled states */
  /* Contrast Ratio: 1.8:1 trên white */

--color-primary-bg: #F5F0EA;
  /* RGB: rgb(245, 240, 234) */
  /* Usage: Subtle background areas */
  /* Contrast Ratio: N/A (background only) */
```

#### Background & Surface
```css
--color-bg: #FBF9F6;
  /* RGB: rgb(251, 249, 246) */
  /* Usage: Main app background */
  /* Visual: Warm ivory, soft beige tint */

--color-bg-soft: #F5F3EF;
  /* RGB: rgb(245, 243, 239) */
  /* Usage: Secondary backgrounds, section backgrounds */
  /* Visual: Slightly darker than main bg */

--color-surface: #FFFFFF;
  /* RGB: rgb(255, 255, 255) */
  /* Usage: Cards, content areas, modals */
  /* Visual: Pure white for maximum readability */

--color-surface-strong: #F8F6F2;
  /* RGB: rgb(248, 246, 242) */
  /* Usage: Sidebar, elevated panels */
  /* Visual: Warmer than pure white */

--color-surface-hover: #FDFCF9;
  /* RGB: rgb(253, 252, 249) */
  /* Usage: Hover states trên surfaces */
  /* Visual: Slightly lighter */
```

#### Text Colors
```css
--color-text: #2C2416;
  /* RGB: rgb(44, 36, 22) */
  /* Usage: Primary text, headings */
  /* Contrast Ratio: 15.8:1 trên white */
  /* WCAG AAA compliant */

--color-text-muted: #6B6054;
  /* RGB: rgb(107, 96, 84) */
  /* Usage: Secondary text, labels, captions */
  /* Contrast Ratio: 5.2:1 trên white */
  /* WCAG AA compliant */

--color-text-subtle: #9A8F82;
  /* RGB: rgb(154, 143, 130) */
  /* Usage: Placeholders, hints, disabled text */
  /* Contrast Ratio: 2.8:1 trên white */
  /* WCAG AA for large text */

--color-text-on-primary: #FFFFFF;
  /* RGB: rgb(255, 255, 255) */
  /* Usage: Text trên primary buttons */
  /* Contrast Ratio: 4.8:1 trên --color-primary */
```

#### Border & Divider
```css
--color-border: rgba(139, 111, 71, 0.12);
  /* Usage: Default borders, dividers */
  /* Opacity: 12% cho subtlety */

--color-border-strong: rgba(139, 111, 71, 0.20);
  /* Usage: Focus borders, active dividers */
  /* Opacity: 20% cho visibility */

--color-border-subtle: rgba(139, 111, 71, 0.08);
  /* Usage: Very subtle separations */
  /* Opacity: 8% cho minimalism */

--color-divider: rgba(107, 96, 84, 0.15);
  /* Usage: Section dividers */
  /* RGB: Based on text-muted với opacity */
```

#### Shadow System
```css
--shadow-xs: 0 1px 2px 0 rgba(139, 111, 71, 0.05);
  /* Usage: Subtle elevations, inputs */

--shadow-sm: 0 2px 4px 0 rgba(139, 111, 71, 0.06), 
             0 1px 2px 0 rgba(139, 111, 71, 0.04);
  /* Usage: Cards, dropdowns */

--shadow-md: 0 4px 8px -2px rgba(139, 111, 71, 0.08),
             0 2px 4px -1px rgba(139, 111, 71, 0.05);
  /* Usage: Elevated cards, modals */

--shadow-lg: 0 12px 24px -4px rgba(139, 111, 71, 0.12),
             0 4px 8px -2px rgba(139, 111, 71, 0.08);
  /* Usage: Modals, popovers */

--shadow-xl: 0 20px 40px -8px rgba(139, 111, 71, 0.15),
             0 8px 16px -4px rgba(139, 111, 71, 0.10);
  /* Usage: Important modals, dialogs */

--shadow-2xl: 0 32px 64px -12px rgba(139, 111, 71, 0.18),
              0 12px 24px -4px rgba(139, 111, 71, 0.12);
  /* Usage: Hero elements, splash screens */
```

#### Overlay
```css
--color-overlay: rgba(44, 36, 22, 0.45);
  /* Usage: Modal backdrops */
  /* Opacity: 45% cho visibility */

--color-overlay-light: rgba(44, 36, 22, 0.25);
  /* Usage: Subtle overlays */
  /* Opacity: 25% cho subtlety */
```

### 1.2. Dark Mode - Tối Ưu Cho Làm Việc Ban Đêm

#### Primary Palette (Dark)
```css
/* Dark Mode Primary - Golden Amber Family */
--color-primary-dark-mode: #D4A574;
  /* RGB: rgb(212, 165, 116) */
  /* Usage: Buttons, links, active states */
  /* Contrast Ratio: 4.6:1 trên #2E2B27 */
  /* Visual: Warm golden, amber glow */

--color-primary-dark-dark-mode: #B8935F;
  /* RGB: rgb(184, 147, 95) */
  /* Usage: Hover states, pressed */
  /* Contrast Ratio: 5.8:1 trên #2E2B27 */

--color-primary-light-dark-mode: #E6C199;
  /* RGB: rgb(230, 193, 153) */
  /* Usage: Subtle highlights */
  /* Contrast Ratio: 3.2:1 trên #2E2B27 */

--color-primary-subtle-dark-mode: rgba(212, 165, 116, 0.15);
  /* Usage: Background tints */
  /* Opacity: 15% cho subtlety */
```

#### Background & Surface (Dark)
```css
--color-bg-dark: #1A1816;
  /* RGB: rgb(26, 24, 22) */
  /* Usage: Main app background */
  /* Visual: Deep charcoal, warm black */

--color-bg-soft-dark: #25221F;
  /* RGB: rgb(37, 34, 31) */
  /* Usage: Secondary backgrounds */
  /* Visual: Lighter charcoal */

--color-surface-dark: #2E2B27;
  /* RGB: rgb(46, 43, 39) */
  /* Usage: Cards, content areas */
  /* Visual: Warm dark brown-gray */

--color-surface-strong-dark: #35322D;
  /* RGB: rgb(53, 50, 45) */
  /* Usage: Sidebar, elevated panels */
  /* Visual: Lighter than surface */

--color-surface-hover-dark: #383530;
  /* RGB: rgb(56, 53, 48) */
  /* Usage: Hover states */
  /* Visual: Slightly lighter */
```

#### Text Colors (Dark)
```css
--color-text-dark: #F5F3EF;
  /* RGB: rgb(245, 243, 239) */
  /* Usage: Primary text */
  /* Contrast Ratio: 14.2:1 trên #2E2B27 */
  /* WCAG AAA compliant */

--color-text-muted-dark: #C9C4BB;
  /* RGB: rgb(201, 196, 187) */
  /* Usage: Secondary text */
  /* Contrast Ratio: 6.8:1 trên #2E2B27 */
  /* WCAG AA compliant */

--color-text-subtle-dark: #9A958D;
  /* RGB: rgb(154, 149, 141) */
  /* Usage: Placeholders, hints */
  /* Contrast Ratio: 3.5:1 trên #2E2B27 */

--color-text-on-primary-dark: #1A1816;
  /* RGB: rgb(26, 24, 22) */
  /* Usage: Text trên primary buttons */
  /* Contrast Ratio: 4.6:1 trên #D4A574 */
```

#### Border & Shadow (Dark)
```css
--color-border-dark: rgba(212, 165, 116, 0.15);
  /* Opacity: 15% cho visibility */

--color-border-strong-dark: rgba(212, 165, 116, 0.25);
  /* Opacity: 25% cho focus states */

--shadow-xs-dark: 0 1px 2px 0 rgba(0, 0, 0, 0.3);
--shadow-sm-dark: 0 2px 4px 0 rgba(0, 0, 0, 0.35),
                  0 1px 2px 0 rgba(0, 0, 0, 0.25);
--shadow-md-dark: 0 4px 8px -2px rgba(0, 0, 0, 0.4),
                  0 2px 4px -1px rgba(0, 0, 0, 0.3);
--shadow-lg-dark: 0 12px 24px -4px rgba(0, 0, 0, 0.45),
                  0 4px 8px -2px rgba(0, 0, 0, 0.35);
--shadow-xl-dark: 0 20px 40px -8px rgba(0, 0, 0, 0.5),
                  0 8px 16px -4px rgba(0, 0, 0, 0.4);
--shadow-2xl-dark: 0 32px 64px -12px rgba(0, 0, 0, 0.55),
                   0 12px 24px -4px rgba(0, 0, 0, 0.45);

--color-overlay-dark: rgba(0, 0, 0, 0.65);
  /* Opacity: 65% cho dark mode */
```

### 1.3. Semantic Colors (Chi Tiết)

#### Success (Light & Dark)
```css
/* Light Mode */
--color-success: #7A9471;
  /* RGB: rgb(122, 148, 113) */
  /* Usage: Success messages, confirmations */
  /* Contrast: 4.3:1 trên white */

--color-success-light: #9FB89A;
  /* Usage: Success backgrounds */
--color-success-dark: #5F7560;
  /* Usage: Success borders, hover */

/* Dark Mode */
--color-success-dark-mode: #8FAC89;
  /* Contrast: 5.1:1 trên #2E2B27 */
--color-success-light-dark-mode: #A8C5A2;
--color-success-dark-dark-mode: #72856D;
```

#### Warning (Light & Dark)
```css
/* Light Mode */
--color-warning: #D4A574;
  /* RGB: rgb(212, 165, 116) */
  /* Usage: Warnings, cautions */
  /* Contrast: 3.2:1 trên white */

--color-warning-light: #E6C199;
--color-warning-dark: #B8935F;

/* Dark Mode */
--color-warning-dark-mode: #E6C199;
  /* Contrast: 4.8:1 trên #2E2B27 */
--color-warning-light-dark-mode: #F0D4B4;
--color-warning-dark-dark-mode: #D4A574;
```

#### Error (Light & Dark)
```css
/* Light Mode */
--color-error: #C97D60;
  /* RGB: rgb(201, 125, 96) */
  /* Usage: Errors, destructive actions */
  /* Contrast: 4.1:1 trên white */
  /* Visual: Terracotta, không chói như đỏ thuần */

--color-error-light: #E0A890;
--color-error-dark: #B3694D;

/* Dark Mode */
--color-error-dark-mode: #E0A890;
  /* Contrast: 5.2:1 trên #2E2B27 */
--color-error-light-dark-mode: #F0C4B0;
--color-error-dark-dark-mode: #D4967A;
```

#### Info (Light & Dark)
```css
/* Light Mode */
--color-info: #8B9FB8;
  /* RGB: rgb(139, 159, 184) */
  /* Usage: Information, tips */
  /* Contrast: 3.8:1 trên white */

--color-info-light: #B8C8D9;
--color-info-dark: #6B7F98;

/* Dark Mode */
--color-info-dark-mode: #9FB4CE;
  /* Contrast: 4.9:1 trên #2E2B27 */
--color-info-light-dark-mode: #B8CEE3;
--color-info-dark-dark-mode: #8B9FB8;
```

### 1.4. Color Usage Guidelines

#### Accessibility Standards
- **WCAG AA**: Tất cả text phải có contrast ≥ 4.5:1
- **WCAG AAA**: Primary text phải có contrast ≥ 7:1
- **Large Text**: ≥ 18pt hoặc ≥ 14pt bold có thể dùng contrast ≥ 3:1
- **Non-text**: UI elements phải có contrast ≥ 3:1

#### Color Combinations (Approved)
```
✅ Good Combinations:
- Primary text (#2C2416) trên White (#FFFFFF) - 15.8:1 ✅ AAA
- Primary text trên Surface Strong (#F8F6F2) - 13.2:1 ✅ AAA
- Primary button (#8B6F47) với White text - 4.8:1 ✅ AA
- Muted text (#6B6054) trên White - 5.2:1 ✅ AA
- Error (#C97D60) trên White - 4.1:1 ✅ AA

❌ Avoid:
- Primary (#8B6F47) trên Primary Subtle (#D4C4B0) - 1.8:1 ❌
- Text Subtle (#9A8F82) trên White - 2.8:1 ❌ (chỉ cho large text)
- Primary Light (#A0825F) với text - 3.9:1 ❌ (chỉ cho large text)
```

#### Dark Mode Combinations (Approved)
```
✅ Good Combinations:
- Text (#F5F3EF) trên Surface (#2E2B27) - 14.2:1 ✅ AAA
- Primary (#D4A574) trên Surface - 4.6:1 ✅ AA
- Muted text (#C9C4BB) trên Surface - 6.8:1 ✅ AA

❌ Avoid:
- Text Subtle (#9A958D) trên Surface - 3.5:1 ❌ (chỉ large text)
- Primary Light (#E6C199) với text dark - 3.2:1 ❌ (chỉ large text)
```

---

## Phần 2: Typography System Hoàn Chỉnh

### 2.1. Font Stack & Loading

#### Primary Font: Inter
```html
<!-- Google Fonts Import -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
```

```css
/* Font Family Stack */
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 
             'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 
             'Droid Sans', 'Helvetica Neue', sans-serif;

/* Characteristics */
/* - Optimized for screen reading */
/* - Excellent Vietnamese support */
/* - Variable weights: 300-700 */
/* - Letter spacing optimized */
/* - OpenType features: ligatures, oldstyle numbers */
```

#### Heading Font: Cormorant Garamond
```html
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600;700&display=swap" rel="stylesheet">
```

```css
--font-serif: 'Cormorant Garamond', 'Playfair Display', 
              'Georgia', 'Times New Roman', serif;

/* Usage: */
/* - Brand name (Dei8 AI Studio) */
/* - Page titles in cards */
/* - Headings within markdown content */
/* - Decorative elements */
```

#### Monospace Font: JetBrains Mono
```html
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
```

```css
--font-mono: 'JetBrains Mono', 'Fira Code', 'Consolas', 
             'Monaco', 'Courier New', monospace;

/* Usage: */
/* - Code blocks */
/* - Inline code */
/* - Technical documentation */
/* - File paths, URLs */
```

### 2.2. Typography Scale (Chi Tiết)

#### Font Sizes với Exact Specifications
```css
/* Extra Small - Labels, Captions */
--text-xs: 0.75rem;        /* 12px */
  /* Line-height: 1.5 (18px) */
  /* Letter-spacing: 0.01em */
  /* Usage: Form labels, timestamps, metadata */
  /* Weight: 500 (medium) */

/* Small - Secondary Text */
--text-sm: 0.875rem;       /* 14px */
  /* Line-height: 1.5 (21px) */
  /* Letter-spacing: 0em */
  /* Usage: Captions, helper text, side notes */
  /* Weight: 400 (regular) */

/* Base - Body Text */
--text-base: 1rem;          /* 16px */
  /* Line-height: 1.75 (28px) */
  /* Letter-spacing: -0.011em (tighter for readability) */
  /* Usage: Main content, paragraphs, chat messages */
  /* Weight: 400 (regular) */
  /* Max-width: 65ch (optimal reading width) */

/* Large - Emphasized Text */
--text-lg: 1.125rem;        /* 18px */
  /* Line-height: 1.67 (30px) */
  /* Letter-spacing: -0.014em */
  /* Usage: Important paragraphs, lead text */
  /* Weight: 400 (regular) */

/* Extra Large - Subheadings */
--text-xl: 1.25rem;         /* 20px */
  /* Line-height: 1.5 (30px) */
  /* Letter-spacing: -0.015em */
  /* Usage: Section subheadings, card titles */
  /* Weight: 600 (semibold) */

/* 2XL - Section Titles */
--text-2xl: 1.5rem;         /* 24px */
  /* Line-height: 1.33 (32px) */
  /* Letter-spacing: -0.019em */
  /* Usage: Section headings, sidebar sections */
  /* Weight: 600 (semibold) */
  /* Font: Serif cho headings */

/* 3XL - Page Titles */
--text-3xl: 1.875rem;       /* 30px */
  /* Line-height: 1.27 (38px) */
  /* Letter-spacing: -0.021em */
  /* Usage: Page titles, modal titles */
  /* Weight: 600 (semibold) */
  /* Font: Serif */

/* 4XL - Hero Text */
--text-4xl: 2.25rem;        /* 36px */
  /* Line-height: 1.22 (44px) */
  /* Letter-spacing: -0.022em */
  /* Usage: Hero text, major headings */
  /* Weight: 700 (bold) */
  /* Font: Serif */
```

#### Line Height Specifications
```css
/* Tight - For Headings */
--leading-tight: 1.25;
  /* Usage: H1-H6 headings */
  /* Visual: Compact, modern */

/* Normal - For UI Text */
--leading-normal: 1.5;
  /* Usage: Buttons, labels, short paragraphs */
  /* Visual: Balanced */

/* Relaxed - For Long Content */
--leading-relaxed: 1.75;
  /* Usage: Body text, articles, long-form content */
  /* Visual: Easy to scan, comfortable reading */
  /* Scientific optimal: 1.5-1.75 for readability */

/* Loose - For Special Content */
--leading-loose: 2.0;
  /* Usage: Poetry, quotes, special formatting */
  /* Visual: Very spacious */
```

#### Letter Spacing (Tracking)
```css
/* Tight - Headings */
--tracking-tight: -0.02em;
  /* Usage: Large headings */
  /* Visual: Modern, condensed */

/* Normal - Body Text */
--tracking-normal: 0em;
  /* Usage: Body text, paragraphs */
  /* Visual: Natural spacing */

/* Wide - Labels */
--tracking-wide: 0.05em;
  /* Usage: Uppercase labels, small caps */
  /* Visual: More space, formal */
  /* Example: "PHÂN TÍCH GOOGLE DOCS" */

/* Extra Wide - Special Cases */
--tracking-wider: 0.1em;
  /* Usage: Very small uppercase text */
  /* Visual: Maximum spacing */
```

#### Font Weights
```css
--font-light: 300;
  /* Usage: Large decorative text, thin accents */

--font-normal: 400;
  /* Usage: Body text, default weight */
  /* Most common weight */

--font-medium: 500;
  /* Usage: Labels, emphasized inline text */
  /* Slightly heavier than normal */

--font-semibold: 600;
  /* Usage: Headings, buttons, important text */
  /* Strong but not bold */

--font-bold: 700;
  /* Usage: Strong emphasis, hero text */
  /* Maximum weight */
```

### 2.3. Typography Utilities (Tailwind Classes)

#### Custom Typography Classes
```css
/* Body Text - Optimal for Reading */
.text-body {
  font-family: var(--font-sans);
  font-size: var(--text-base);
  line-height: var(--leading-relaxed);
  letter-spacing: var(--tracking-normal);
  font-weight: var(--font-normal);
  color: var(--color-text);
}

/* Heading Styles */
.heading-1 {
  font-family: var(--font-serif);
  font-size: var(--text-3xl);
  line-height: var(--leading-tight);
  letter-spacing: var(--tracking-tight);
  font-weight: var(--font-semibold);
  color: var(--color-text);
  margin-bottom: 1rem;
}

.heading-2 {
  font-family: var(--font-serif);
  font-size: var(--text-2xl);
  line-height: var(--leading-tight);
  letter-spacing: var(--tracking-tight);
  font-weight: var(--font-semibold);
  color: var(--color-text);
  margin-bottom: 0.75rem;
}

/* Label Style */
.text-label {
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  line-height: var(--leading-normal);
  letter-spacing: var(--tracking-wide);
  font-weight: var(--font-medium);
  color: var(--color-text-muted);
  text-transform: uppercase;
}
```

### 2.4. Reading Optimizations (Chi Tiết)

#### Optimal Line Length
```css
/* For Body Text */
.max-reading-width {
  max-width: 65ch;          /* 65 characters */
  /* ch unit = width of "0" character */
  /* Optimal range: 45-75 characters */
  /* For Vietnamese: 65-75 chars is ideal */
}

/* For Code Blocks */
.max-code-width {
  max-width: 80ch;
  /* Code can be wider due to monospace font */
}
```

#### Paragraph Spacing
```css
/* Standard Paragraph Spacing */
.paragraph-spacing {
  margin-bottom: 1.5em;     /* 24px at base size */
  /* Research: 1.5-2em optimal for readability */
}

/* Tight Paragraph Spacing */
.paragraph-spacing-tight {
  margin-bottom: 1em;       /* 16px at base size */
}

/* Loose Paragraph Spacing */
.paragraph-spacing-loose {
  margin-bottom: 2em;       /* 32px at base size */
}
```

#### Text Alignment
```css
/* Body Text - Always Left Aligned */
.text-left {
  text-align: left;
  /* Research: Left-aligned easier to read */
  /* Avoid justified text except for formal documents */
}

/* Center - Only for Headings */
.text-center {
  text-align: center;
  /* Usage: Hero text, decorative headings */
}
```

#### Word Breaking (Vietnamese Support)
```css
/* Word Wrap for Long Words */
.word-break {
  word-break: break-word;
  overflow-wrap: break-word;
  hyphens: auto;
  /* Important for Vietnamese long words */
  /* Example: "phân tích" breaks naturally */
}
```

### 2.5. Prose Styling (Markdown Content)

#### Tailwind Typography Configuration
```javascript
// tailwind.config.js (nếu sử dụng)
module.exports = {
  theme: {
    extend: {
      typography: {
        DEFAULT: {
          css: {
            color: 'var(--color-text)',
            maxWidth: '65ch',
            lineHeight: '1.75',
            fontSize: '1rem',
            '--tw-prose-headings': 'var(--color-text)',
            '--tw-prose-links': 'var(--color-primary)',
            '--tw-prose-bold': 'var(--color-text)',
            '--tw-prose-counters': 'var(--color-text-muted)',
            '--tw-prose-bullets': 'var(--color-text-muted)',
            '--tw-prose-hr': 'var(--color-border)',
            '--tw-prose-quotes': 'var(--color-text)',
            '--tw-prose-quote-borders': 'var(--color-primary)',
            '--tw-prose-captions': 'var(--color-text-muted)',
            '--tw-prose-code': 'var(--color-text)',
            '--tw-prose-pre-code': 'var(--color-text-dark)',
            '--tw-prose-pre-bg': 'var(--color-bg-soft)',
            '--tw-prose-th-borders': 'var(--color-border)',
            '--tw-prose-td-borders': 'var(--color-border-subtle)',
            
            // Headings
            h1: {
              fontFamily: 'var(--font-serif)',
              fontWeight: '600',
              fontSize: '1.875rem',
              lineHeight: '1.27',
              marginTop: '1.5em',
              marginBottom: '0.75em',
            },
            h2: {
              fontFamily: 'var(--font-serif)',
              fontWeight: '600',
              fontSize: '1.5rem',
              lineHeight: '1.33',
              marginTop: '1.25em',
              marginBottom: '0.5em',
            },
            h3: {
              fontFamily: 'var(--font-sans)',
              fontWeight: '600',
              fontSize: '1.25rem',
              lineHeight: '1.5',
              marginTop: '1em',
              marginBottom: '0.5em',
            },
            
            // Paragraphs
            p: {
              marginTop: '1em',
              marginBottom: '1.5em',
            },
            
            // Links
            a: {
              color: 'var(--color-primary)',
              textDecoration: 'underline',
              textDecorationThickness: '1px',
              textUnderlineOffset: '2px',
              transition: 'color 150ms ease-out',
              '&:hover': {
                color: 'var(--color-primary-dark)',
                textDecorationThickness: '2px',
              },
            },
            
            // Lists
            'ul, ol': {
              marginTop: '1em',
              marginBottom: '1.5em',
              paddingLeft: '1.5em',
            },
            li: {
              marginTop: '0.5em',
              marginBottom: '0.5em',
            },
            
            // Blockquotes
            blockquote: {
              borderLeft: '4px solid var(--color-primary)',
              paddingLeft: '1em',
              fontStyle: 'italic',
              color: 'var(--color-text-muted)',
              marginTop: '1.5em',
              marginBottom: '1.5em',
            },
            
            // Code
            code: {
              fontFamily: 'var(--font-mono)',
              fontSize: '0.9em',
              backgroundColor: 'var(--color-bg-soft)',
              padding: '0.125em 0.375em',
              borderRadius: '0.25rem',
              fontWeight: '500',
            },
            'pre code': {
              backgroundColor: 'transparent',
              padding: '0',
            },
            pre: {
              backgroundColor: 'var(--color-bg-soft)',
              padding: '1em',
              borderRadius: '0.5rem',
              overflowX: 'auto',
              lineHeight: '1.5',
            },
            
            // Tables
            table: {
              width: '100%',
              marginTop: '1.5em',
              marginBottom: '1.5em',
            },
            'thead tr': {
              borderBottom: '2px solid var(--color-border)',
            },
            'tbody tr': {
              borderBottom: '1px solid var(--color-border-subtle)',
              '&:nth-child(even)': {
                backgroundColor: 'var(--color-bg-soft)',
              },
            },
          },
        },
      },
    },
  },
};
```

### 2.6. Typography in Components

#### Document Canvas Cards
```css
/* Card Title */
.card-title {
  font-family: var(--font-serif);
  font-size: var(--text-xl);
  font-weight: var(--font-semibold);
  line-height: var(--leading-tight);
  letter-spacing: var(--tracking-tight);
  color: var(--color-text-on-primary);
  padding: 0.75rem 1rem;    /* 12px 16px */
}

/* Card Content */
.card-content {
  font-family: var(--font-sans);
  font-size: var(--text-base);
  line-height: var(--leading-relaxed);
  color: var(--color-text);
  padding: 1.5rem;           /* 24px */
}

/* Content Headings within Cards */
.card-content h1 {
  font-family: var(--font-serif);
  font-size: var(--text-2xl);
  font-weight: var(--font-semibold);
  margin-top: 1.5em;
  margin-bottom: 0.75em;
}

.card-content h2 {
  font-family: var(--font-serif);
  font-size: var(--text-xl);
  font-weight: var(--font-semibold);
  margin-top: 1.25em;
  margin-bottom: 0.5em;
}

.card-content h3 {
  font-family: var(--font-sans);
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  margin-top: 1em;
  margin-bottom: 0.5em;
}
```

#### Chat Widget Messages
```css
/* Message Text */
.message-text {
  font-family: var(--font-sans);
  font-size: var(--text-base);
  line-height: var(--leading-relaxed);
  color: var(--color-text);
  /* Max width: 80% of container */
  /* Padding: 0.75rem (12px) */
}

/* User Message */
.message-user {
  color: var(--color-text-on-primary);
  /* Background: var(--color-primary) */
}

/* Assistant Message */
.message-assistant {
  color: var(--color-text);
  /* Background: var(--color-surface-strong) */
}
```

#### Sidebar Navigation
```css
/* Section Heading */
.sidebar-section-heading {
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  color: var(--color-text-muted);
  padding: 0.5rem 0.75rem;   /* 8px 12px */
}

/* Navigation Item */
.nav-item {
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  line-height: var(--leading-normal);
  color: var(--color-text);
  padding: 0.75rem 1rem;     /* 12px 16px */
}

/* Active Navigation Item */
.nav-item-active {
  color: var(--color-text-on-primary);
  /* Background: var(--color-primary) */
  font-weight: var(--font-semibold);
}
```

### 2.7. Dark Mode Typography Adjustments

```css
/* Dark Mode - Slightly Lighter Weights for Readability */
@media (prefers-color-scheme: dark) {
  .text-body {
    font-weight: 400;       /* Same as light mode */
    /* Text color: var(--color-text-dark) */
  }
  
  .heading-1,
  .heading-2 {
    font-weight: 600;        /* Same as light mode */
    /* Text color: var(--color-text-dark) */
  }
  
  /* Links slightly lighter in dark mode */
  a {
    color: var(--color-primary-dark-mode);
    /* Slightly brighter for visibility */
  }
  
  /* Code blocks - Darker background */
  code {
    background-color: var(--color-surface-strong-dark);
    color: var(--color-text-dark);
  }
  
  pre {
    background-color: var(--color-surface-strong-dark);
    border: 1px solid var(--color-border-dark);
  }
}
```

---

## Phần 3: Layout & Spacing Specifications

### 3.1. Grid System (Chi Tiết)

#### Main Layout Structure
```css
/* Overall Layout */
.app-container {
  display: flex;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}

/* Sidebar */
.sidebar {
  width: 320px;              /* Fixed width */
  min-width: 280px;          /* Minimum responsive */
  max-width: 360px;          /* Maximum */
  flex-shrink: 0;
  height: 100vh;
  /* Background: var(--color-surface-strong) */
  /* Border-right: 1px solid var(--color-border) */
}

/* Main Content Area */
.main-content {
  flex: 1;
  min-width: 0;              /* Allow shrinking */
  height: 100vh;
  overflow: hidden;
  /* Background: var(--color-bg) */
}

/* Header */
.header {
  height: 64px;              /* Fixed height */
  padding: 0 24px;           /* Horizontal padding */
  /* Background: var(--color-surface-strong) */
  /* Border-bottom: 1px solid var(--color-border) */
}
```

#### Responsive Breakpoints
```css
/* Mobile (≤ 768px) */
@media (max-width: 768px) {
  .sidebar {
    width: 100%;
    position: fixed;
    z-index: 100;
    transform: translateX(-100%);
    transition: transform 300ms ease-out;
  }
  
  .sidebar.open {
    transform: translateX(0);
  }
}

/* Tablet (769px - 1024px) */
@media (min-width: 769px) and (max-width: 1024px) {
  .sidebar {
    width: 280px;
  }
}

/* Desktop (≥ 1025px) */
@media (min-width: 1025px) {
  .sidebar {
    width: 320px;
  }
}

/* Large Desktop (≥ 1440px) */
@media (min-width: 1440px) {
  .sidebar {
    width: 360px;
  }
}
```

### 3.2. Spacing System (8px Grid)

#### Base Spacing Scale
```css
/* Spacing Scale (8px base) */
--space-0: 0;
--space-1: 0.25rem;         /* 4px */
--space-2: 0.5rem;          /* 8px - Base unit */
--space-3: 0.75rem;         /* 12px */
--space-4: 1rem;            /* 16px */
--space-5: 1.25rem;         /* 20px */
--space-6: 1.5rem;          /* 24px */
--space-8: 2rem;            /* 32px */
--space-10: 2.5rem;         /* 40px */
--space-12: 3rem;           /* 48px */
--space-16: 4rem;           /* 64px */
--space-20: 5rem;           /* 80px */
--space-24: 6rem;           /* 96px */
```

#### Component-Specific Spacing

**Buttons:**
```css
/* Button Padding */
.btn-compact {
  padding: 0.5rem 1rem;      /* 8px 16px - Compact buttons */
}

.btn-normal {
  padding: 0.625rem 1.25rem; /* 10px 20px - Standard buttons */
}

.btn-comfortable {
  padding: 0.75rem 1.5rem;   /* 12px 24px - Large buttons */
}

/* Button Spacing (gap between buttons) */
.button-group {
  gap: 0.5rem;               /* 8px between buttons */
}
```

**Cards:**
```css
/* Card Padding */
.card-compact {
  padding: 1rem;             /* 16px - Compact cards */
}

.card-normal {
  padding: 1.5rem;            /* 24px - Standard cards */
}

.card-comfortable {
  padding: 2rem;               /* 32px - Spacious cards */
}

/* Card Margins (between cards) */
.card-spacing {
  margin-bottom: 1rem;         /* 16px between cards */
}
```

**Forms:**
```css
/* Form Element Spacing */
.form-group {
  margin-bottom: 1.5rem;      /* 24px between form groups */
}

.form-label {
  margin-bottom: 0.5rem;       /* 8px below label */
}

.form-input {
  padding: 0.625rem 0.875rem; /* 10px 14px */
  margin-bottom: 0.25rem;      /* 4px below input */
}

.form-error {
  margin-top: 0.375rem;        /* 6px above error text */
}
```

**Navigation:**
```css
/* Sidebar Navigation Spacing */
.nav-section {
  margin-bottom: 1.5rem;       /* 24px between sections */
}

.nav-item {
  padding: 0.75rem 1rem;       /* 12px 16px */
  margin-bottom: 0.25rem;      /* 4px between items */
}

.nav-section-heading {
  padding: 0.5rem 0.75rem;     /* 8px 12px */
  margin-bottom: 0.5rem;       /* 8px below heading */
}
```

### 3.3. Reading Zone Specifications

#### Optimal Reading Area
```css
/* Content Reading Width */
.reading-container {
  max-width: 720px;           /* 720px = ~65ch at 16px base */
  margin: 0 auto;              /* Centered */
  padding: 2.5rem;             /* 40px all sides */
}

/* Content Padding */
.reading-content {
  padding: 2.5rem;             /* 40px - Comfortable */
  /* For mobile: padding: 1.5rem (24px) */
}

/* Line Height for Reading */
.reading-text {
  line-height: 1.75;           /* 28px at 16px font */
  max-width: 65ch;             /* Optimal character width */
}
```

#### Canvas Card Dimensions
```css
/* Default Card Sizes */
.card-default {
  min-width: 300px;
  max-width: 800px;
  width: 400px;                /* Default width */
  min-height: 200px;
  /* Height: auto based on content */
}

.card-compact {
  width: 300px;
  min-height: 150px;
}

.card-wide {
  width: 600px;
  min-height: 250px;
}

/* Card Header */
.card-header {
  padding: 0.75rem 1rem;        /* 12px 16px */
  min-height: 48px;
}

/* Card Content */
.card-body {
  padding: 1.5rem;              /* 24px */
  min-height: 100px;
}
```

### 3.4. Z-Index Hierarchy
```css
/* Z-Index System */
--z-base: 0;
--z-dropdown: 100;
--z-sticky: 200;
--z-overlay: 300;
--z-modal-backdrop: 400;
--z-modal: 500;
--z-popover: 600;
--z-tooltip: 700;
--z-notification: 800;
```

### 3.5. Border Radius System
```css
/* Border Radius Scale */
--radius-none: 0;
--radius-sm: 0.25rem;          /* 4px - Small elements */
--radius-md: 0.5rem;           /* 8px - Buttons, inputs */
--radius-lg: 0.75rem;           /* 12px - Cards (old) */
--radius-xl: 1rem;              /* 16px - Cards (new) */
--radius-2xl: 1.5rem;           /* 24px - Modals, large cards */
--radius-full: 9999px;          /* Pills, badges */
```

### 3.6. Shadow Elevation System
```css
/* Elevation Levels */
.elevation-0 {
  box-shadow: none;
}

.elevation-1 {
  box-shadow: var(--shadow-xs);
  /* Usage: Subtle lifts, inputs */
}

.elevation-2 {
  box-shadow: var(--shadow-sm);
  /* Usage: Cards, dropdowns */
}

.elevation-3 {
  box-shadow: var(--shadow-md);
  /* Usage: Elevated cards, floating elements */
}

.elevation-4 {
  box-shadow: var(--shadow-lg);
  /* Usage: Modals, popovers */
}

.elevation-5 {
  box-shadow: var(--shadow-xl);
  /* Usage: Important modals */
}
```

---

## Phần 4: Component Enhancements

### 4.1. Document Pages (Canvas Cards)
**Cải tiến:**
- Border radius: 12px → 16px (hiện đại hơn)
- Shadow: Softer, multi-layer
- Header: Gradient subtle thay vì solid color
- Content area: Better padding, line-height 1.75
- Typography: Serif cho headings trong content, sans-serif cho body

**Dark mode:**
- Background: #2E2B27 với subtle texture
- Border: Glow effect nhẹ khi hover

### 4.2. Chat Widget
**Cải tiến:**
- Message bubbles: Rounded-2xl, softer shadows
- Avatar: Border subtle, size 10 → 11 (64px)
- Typography: Base size 16px, line-height 1.6
- Timestamp: Subtle, smaller font
- Input: Full-width với padding tốt hơn

### 4.3. Sidebar
**Cải tiến:**
- Background: Subtle texture/gradient
- Navigation items: Better hover states
- Active state: Indicator line bên trái thay vì full background
- Spacing: Consistent 12px vertical gap
- Icons: Slightly larger, better alignment

### 4.4. Input Fields & Forms
**Cải tiến:**
- Border: 1.5px khi focus
- Focus ring: Color + subtle glow
- Placeholder: Lighter color, italic
- Labels: Uppercase, tracking-wide, smaller size
- Error states: Red nhẹ nhàng, không chói

### 4.5. Buttons
**Cải tiến:**
- Primary: Gradient subtle hoặc solid với shadow mềm
- Hover: Scale 1.02, shadow tăng nhẹ
- Active: Scale 0.98
- Disabled: Opacity 0.5, cursor not-allowed
- Icon buttons: Padding tốt hơn, size 44x44px minimum

---

## Phần 5: Dark Mode Implementation

### 5.1. Strategy
- **Toggle**: Header, persistent trong localStorage
- **Transition**: Smooth 300ms cho tất cả elements
- **Icon**: Sun/Moon với animation

### 5.2. Color Mapping
- Tất cả colors theo system đã định nghĩa
- Images: Tự động adjust opacity trong dark mode
- Shadows: Tăng opacity trong dark mode

---

## Phần 6: Micro-interactions & Animations

### 6.1. Principles
- **Subtle**: Không làm phân tâm
- **Purposeful**: Mỗi animation có mục đích
- **Fast**: 150-300ms cho interactions
- **Easing**: ease-out cho most, spring cho special

### 6.2. Specific Animations
```
Hover States:
- Buttons: Scale 1.02, shadow tăng
- Cards: TranslateY -2px, shadow tăng
- Links: Color transition + underline

Loading:
- Skeleton screens thay vì spinners
- Progress bars với gradient
- Spinner: Softer, không chói

Page Transitions:
- Fade + slight scale cho modals
- Slide cho sidebar collapse
- Smooth scroll với easing

Drag & Drop:
- Ghost image với opacity
- Drop zone highlight subtle
```

---

## Phần 7: Accessibility (A11y)

### 7.1. Contrast Ratios
- **Text on Background**: Tối thiểu 4.5:1 (WCAG AA)
- **Large Text**: Tối thiểu 3:1
- **Interactive Elements**: Clear visual feedback

### 7.2. Keyboard Navigation
- Tab order: Logical flow
- Focus indicators: Visible, clear (2px solid)
- Skip links: Cho main content

### 7.3. Screen Readers
- ARIA labels cho tất cả interactive elements
- Landmarks: nav, main, aside
- Live regions: Cho dynamic content updates

---

## Phần 8: Performance Optimizations

### 8.1. Rendering
- **Virtual Scrolling**: Cho chat messages dài
- **Lazy Loading**: Images, heavy components
- **Memoization**: React.memo cho static components

### 8.2. Assets
- **Font Loading**: font-display: swap
- **Icons**: SVG inline, tối ưu size
- **Images**: WebP format, lazy load

---

## Phần 9: Reading & Writing Experience

### 9.1. Text Editor Enhancements
- **Focus Mode**: Dim các elements khác khi focus vào editor
- **Distraction-Free**: Có thể ẩn sidebar/navigation
- **Word Count**: Hiển thị real-time
- **Reading Time**: Estimate dựa trên word count
- **Format Bar**: Floating khi select text

### 9.2. Content Display
- **Prose Styling**: Tối ưu với Tailwind Typography
- **Code Blocks**: Syntax highlighting, copy button
- **Links**: Underline on hover, color subtle
- **Blockquotes**: Left border, italic, lighter background

### 9.3. Markdown Rendering
- **Heading Hierarchy**: Clear visual distinction
- **Lists**: Proper spacing, indentation
- **Tables**: Zebra striping nhẹ
- **Images**: Responsive, rounded corners

---

## Phần 10: Implementation Roadmap

### Phase 1: Foundation (Week 1)
1. ✅ Update color system trong `index.html`
2. ✅ Setup typography system
3. ✅ Implement dark mode toggle
4. ✅ Update CSS variables

### Phase 2: Components (Week 2)
1. ✅ Upgrade DocumentCanvas cards
2. ✅ Enhance ChatWidget
3. ✅ Improve Sidebar navigation
4. ✅ Update all forms và inputs

### Phase 3: Polish (Week 3)
1. ✅ Add micro-interactions
2. ✅ Improve animations
3. ✅ Accessibility audit & fixes
4. ✅ Performance optimization

### Phase 4: Testing & Refinement (Week 4)
1. ✅ User testing với writers/researchers
2. ✅ Gather feedback
3. ✅ Iterate based on feedback
4. ✅ Final polish

---

## Phần 11: Key Files to Modify

```
1. index.html
   - CSS variables cho color system
   - Font imports
   - Base styles

2. App.tsx
   - Dark mode toggle logic
   - Theme context
   - Layout adjustments

3. components/DocumentCanvas.tsx
   - Card styling improvements
   - Typography trong content
   - Dark mode styles

4. components/ChatWidget.tsx
   - Message bubble styling
   - Typography improvements
   - Spacing adjustments

5. components/UploadDocForm.tsx
   - Form styling
   - Input enhancements
   - Button updates

6. components/PublishModal.tsx
   - Modal styling
   - Form improvements

7. components/DeleteConfirmationModal.tsx
   - Modal improvements
   - Button styling

8. New: components/ThemeToggle.tsx
   - Dark mode toggle component
```

---

## Metrics for Success

- ✅ **Eye Comfort**: Giảm mỏi mắt khi làm việc 2+ giờ
- ✅ **Reading Speed**: Dễ đọc, không cần squint
- ✅ **Aesthetic**: Sang trọng, professional
- ✅ **Accessibility**: WCAG AA compliance
- ✅ **Performance**: No jank, smooth 60fps
- ✅ **User Satisfaction**: Positive feedback từ writers

---

## Additional Considerations

### For Writers:
- **Minimal Distractions**: Clean interface
- **Focus Mode**: Hide unnecessary UI
- **Word Count Visibility**: Always accessible
- **Export Options**: Easy access

### For Researchers:
- **Note-Taking**: Quick capture
- **References**: Easy to link
- **Annotations**: Visual markers
- **Organization**: Clear hierarchy

---

*Tài liệu này sẽ được cập nhật khi triển khai và nhận feedback.*

