# Responsive Design Quick Reference

## 🎯 Quick Start

### 1. Include Responsive CSS in HTML
```html
<head>
  <!-- Enhanced viewport meta tags -->
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, minimum-scale=1.0, user-scalable=yes, viewport-fit=cover">
  <meta name="format-detection" content="telephone=no, date=no, email=no, address=no">
  <meta name="mobile-web-app-capable" content="yes">
  <meta name="HandheldFriendly" content="true">
  
  <!-- Include responsive framework -->
  <link rel="stylesheet" href="/shared/responsive.css">
</head>
```

### 2. Use Responsive Utilities

#### Tailwind Classes (React Components)
```jsx
// Touch-optimized button
<button className="min-h-touch px-6 py-3">Click Me</button>

// Fluid typography
<h1 className="text-fluid-3xl">Heading</h1>

// Responsive grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {children}
</div>
```

#### CSS Classes (Static HTML)
```html
<!-- Container -->
<div class="container">
  <!-- Touch target -->
  <button class="touch-target touch-feedback">Click Me</button>
  
  <!-- Fluid text -->
  <h1 class="text-fluid-3xl">Heading</h1>
  
  <!-- Responsive grid -->
  <div class="grid-responsive">
    <div>Item 1</div>
    <div>Item 2</div>
    <div>Item 3</div>
  </div>
</div>
```

## 📐 Breakpoints Reference

```css
/* Mobile (portrait) */
320px - 639px

/* Mobile (landscape) / Small tablets */
375px - 767px

/* Tablets / iPads */
768px - 1023px

/* Desktop / Laptops */
1024px - 1279px

/* Large Desktop */
1280px - 1535px

/* Extra Large */
1536px+
```

## 🎨 Common Patterns

### Responsive Container
```html
<div class="container">
  <!-- Auto-scaling padding and max-width -->
</div>
```

### Touch-Friendly Button
```html
<button class="touch-target touch-feedback">
  Submit
</button>
```

### Fluid Typography
```html
<h1 class="text-fluid-3xl">Main Title</h1>
<h2 class="text-fluid-2xl">Subtitle</h2>
<p class="text-fluid-base">Body text</p>
```

### Responsive Grid (1-2-3 columns)
```html
<div class="grid-responsive">
  <div>Card 1</div>
  <div>Card 2</div>
  <div>Card 3</div>
</div>
```

### Responsive Spacing
```html
<section class="py-responsive px-responsive">
  <!-- Scales: 16px → 24px → 32px -->
</section>
```

### Device-Specific Content
```html
<div class="mobile-only">Mobile content</div>
<div class="tablet-up">Tablet+ content</div>
<div class="desktop-only">Desktop content</div>
```

## ⚡ Touch Targets

### Minimum Sizes
- Standard: **44px** (Apple HIG)
- Comfortable: **48px** (Material Design)
- Large: **56px** (Enhanced accessibility)

### Usage
```html
<!-- Standard -->
<button class="touch-target">Button</button>

<!-- Comfortable -->
<button class="touch-target-lg">Button</button>

<!-- Large -->
<button class="touch-target-xl">Button</button>
```

## 🎭 Fluid Typography Scale

```css
text-fluid-xs   → 12px - 14px
text-fluid-sm   → 14px - 16px
text-fluid-base → 16px - 18px
text-fluid-lg   → 18px - 24px
text-fluid-xl   → 20px - 30px
text-fluid-2xl  → 24px - 40px
text-fluid-3xl  → 30px - 48px
text-fluid-4xl  → 36px - 64px
```

## 🔄 Tailwind Breakpoints (React)

```jsx
// Mobile first approach
<div className="
  w-full           /* All sizes */
  md:w-1/2         /* Tablet+ */
  lg:w-1/3         /* Desktop+ */
  xl:w-1/4         /* Large desktop+ */
">
  Content
</div>

// Touch-specific
<button className="
  touch:min-h-touch-lg    /* Touch devices */
  mouse:hover:opacity-90   /* Mouse devices */
">
  Click
</button>
```

## 📱 Common Use Cases

### Responsive Card
```jsx
<div className="
  p-4 md:p-6 lg:p-8
  rounded-lg
  shadow-lg
  w-full
  max-w-md
">
  <h3 className="text-fluid-xl mb-4">Card Title</h3>
  <p className="text-fluid-base">Card content</p>
  <button className="
    mt-4 px-6 py-3
    min-h-touch
    w-full md:w-auto
  ">
    Action
  </button>
</div>
```

### Responsive Navigation
```jsx
<nav className="
  flex flex-col md:flex-row
  gap-2 md:gap-4
  p-responsive
">
  <a className="touch-target">Home</a>
  <a className="touch-target">About</a>
  <a className="touch-target">Contact</a>
</nav>
```

### Responsive Form
```html
<form class="container">
  <div class="grid-responsive">
    <div>
      <label>Name</label>
      <input type="text" class="touch-target">
    </div>
    <div>
      <label>Email</label>
      <input type="email" class="touch-target">
    </div>
  </div>
  <button class="touch-target-lg touch-feedback">
    Submit
  </button>
</form>
```

## 🎯 Testing Quick Checks

```bash
✅ Can you tap all buttons easily on phone?
✅ Is text readable without zooming?
✅ Do images scale properly?
✅ Does layout work in landscape?
✅ Are touch targets at least 44px?
✅ Can users pinch to zoom?
✅ Does keyboard navigation work?
```

## 🚀 Script Commands

```bash
# Update all HTML files with responsive meta tags
./update-responsive-meta.sh

# Clean up backup files after verification
find . -name '*.backup' -delete
```

## 📚 Class Reference

| Class | Purpose | Size |
|-------|---------|------|
| `.touch-target` | Standard touch size | 44px |
| `.touch-target-lg` | Comfortable touch | 48px |
| `.touch-target-xl` | Large touch | 56px |
| `.touch-feedback` | Press animation | - |
| `.container` | Responsive container | Max 1536px |
| `.grid-responsive` | 1→2→3 column grid | - |
| `.text-fluid-*` | Scalable typography | Varies |
| `.p-responsive` | Scalable padding | 16→24→32px |
| `.mobile-only` | Show on mobile | < 768px |
| `.tablet-up` | Show on tablet+ | ≥ 768px |
| `.desktop-only` | Show on desktop | ≥ 1024px |

---

**Quick Tip**: Always test on real devices, not just browser emulation! 📱
