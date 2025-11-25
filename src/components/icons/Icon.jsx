import React from 'react';

// Vite's glob import - automatically imports all SVG files from the icons directory
const iconModules = import.meta.glob('../../assets/icons/*.svg', {
  eager: true,
  query: '?react',
  import: 'default',
});

// Build icon map from filenames (e.g., 'note.svg' -> 'note')
const iconMap = Object.keys(iconModules).reduce((acc, path) => {
  const name = path.match(/\/([^/]+)\.svg$/)?.[1];
  if (name) {
    acc[name] = iconModules[path];
  }
  return acc;
}, {});

/**
 * Icon component wrapper - loads SVG files from src/assets/icons/
 * 
 * Place your SVG files in src/assets/icons/ with kebab-case names:
 * - note.svg, email.svg, meeting.svg, conversation.svg, file.svg
 * - plus.svg, edit.svg, delete.svg, close.svg
 * 
 * @param {string} name - Icon filename without .svg extension (e.g., 'note', 'email', 'plus')
 * @param {number} size - Icon size in pixels (default: 20)
 * @param {string} color - Icon color (default: currentColor) - works if SVG uses currentColor
 * @param {string} className - Additional CSS classes
 */
function Icon({ name, size = 20, color = 'currentColor', className = '', style = {}, ...props }) {
  const IconComponent = iconMap[name];

  if (!IconComponent) {
    console.warn(`Icon "${name}" not found. Available icons:`, Object.keys(iconMap));
    return null;
  }

  return (
    <IconComponent
      width={size}
      height={size}
      className={className}
      style={{ color, ...style }}
      {...props}
    />
  );
}

export default Icon;
