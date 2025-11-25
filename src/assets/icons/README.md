# SVG Icons Directory

This directory contains all SVG icon files used in the Dialedger application.

## How It Works

The Icon component (`src/components/icons/Icon.jsx`) automatically loads all `.svg` files from this directory using Vite's glob import feature. Just drop your SVG files here and they'll be available immediately.

## Naming Convention

Use **lowercase with hyphens** (kebab-case) for icon filenames:
- ✅ `note.svg`, `email.svg`, `plus.svg`
- ❌ `NoteIcon.svg`, `Email.svg`, `plus-icon.svg`

The filename (without `.svg`) becomes the icon name used in the component.

## Required Icons

### Entry Type Icons
- `note.svg` - For note entries
- `email.svg` - For email entries
- `meeting.svg` - For meeting entries
- `conversation.svg` - For conversation entries
- `file.svg` - For file entries

### Action Icons
- `plus.svg` - Add/create actions
- `edit.svg` - Edit actions
- `delete.svg` - Delete actions
- `close.svg` - Close/cancel actions

## SVG Requirements

For best results, your SVG files should:

1. **Use `currentColor`** for stroke/fill to allow color customization:
   ```xml
   <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
     <path d="..." stroke="currentColor" stroke-width="2"/>
   </svg>
   ```

2. **Have a consistent viewBox** (recommended: `0 0 24 24`)

3. **Remove fixed width/height** attributes - the Icon component controls size

4. **Use stroke-based icons** for consistency (recommended stroke-width: 2)

## Usage

```jsx
import Icon from './components/icons/Icon';

// Basic usage
<Icon name="note" />

// With custom size and color
<Icon name="email" size={24} color="#3498db" />

// With className
<Icon name="plus" className="my-icon-class" />
```

## Adding New Icons

1. Save your SVG file in this directory with a kebab-case name
2. Ensure it uses `currentColor` for stroke/fill
3. Use the filename (without `.svg`) as the icon name in your code
4. No code changes needed - it's automatically available!

## Placeholder Icons

If you need placeholder icons to start with, use a simple geometric shape:

```xml
<!-- note.svg -->
<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" stroke-width="2"/>
  <line x1="8" y1="9" x2="16" y2="9" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
  <line x1="8" y1="13" x2="16" y2="13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
</svg>
```

## Troubleshooting

If an icon doesn't appear:
1. Check the filename matches exactly (case-sensitive, kebab-case)
2. Ensure the file extension is `.svg`
3. Check browser console for "Icon not found" warnings
4. Verify the SVG file is valid XML
5. Restart the dev server after adding new icons
