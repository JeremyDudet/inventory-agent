# Inventory Agent Style Guide

## Color Palette

### Primary Colors

- Text Colors:
  - Light Mode: `text-zinc-900` (dark text)
  - Dark Mode: `text-zinc-100` (light text)
  - Secondary Text: `text-zinc-500` (light mode), `text-zinc-400` (dark mode)
  - Muted Text: `text-zinc-700` (light mode), `text-zinc-300` (dark mode)

### Background Colors

- Light Mode: `bg-white`
- Dark Mode: `bg-zinc-800`
- Secondary Background: `bg-zinc-200` (light mode), `bg-zinc-700` (dark mode)
- Hover States: `hover:bg-zinc-300` (light mode), `hover:bg-zinc-700` (dark mode)

### Border Colors

- Light Mode: `border-zinc-200`
- Dark Mode: `border-zinc-700`
- Divider: `divide-zinc-200` (light mode), `divide-zinc-700` (dark mode)

## Typography

### Headings

- H1: `<Heading level={1}>` - Used for page titles
- H2: `<Heading level={2}>` - Used for section titles
- H3: `<Heading level={3}>` - Used for subsection titles

### Text

- Body: `<Text>` - Used for regular content
- Small: `text-sm` - Used for secondary information
- Muted: `text-zinc-500` (light mode), `text-zinc-400` (dark mode)

## Layout

### Spacing

- Container: `max-w-7xl` - Used for main content containers
- Padding:
  - Page: `px-4 sm:px-6 lg:px-8`
  - Section: `py-4`
  - Component: `p-4`
- Margins:
  - Between sections: `mt-12`
  - Between elements: `gap-2`

### Grid System

- Flex containers: `flex` with `gap-2` for spacing
- Grid layouts: `grid` with appropriate column definitions

## Components

### Buttons

- Primary: `<Button>` component with appropriate variants
- Secondary: `bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200`
- Hover states: `hover:bg-zinc-300 dark:hover:bg-zinc-700`

### Inputs

- Text Input: `<Input>` component
- Search: `<Input type="search">` with appropriate styling
- Textarea: `<Textarea>` component

### Tables

- Base: `min-w-full divide-y divide-gray-300 dark:divide-gray-700`
- Headers: `text-sm font-medium text-zinc-500 dark:text-zinc-400`
- Cells: `text-sm text-zinc-500 dark:text-zinc-400`
- Responsive: Use `hidden` and `sm:table-cell` for responsive columns

### Navigation

- Navbar: `<Navbar>` component with appropriate sections
- Sidebar: `<Sidebar>` component with header, body, and footer sections
- Links: Use appropriate hover states and active indicators

### Cards

- Base: `rounded-lg border border-zinc-200 dark:border-zinc-700`
- Content: `p-4`
- Hover: `hover:bg-zinc-50 dark:hover:bg-zinc-700`

### Modals & Dialogs

- Base: `<Dialog>` component from @headlessui/react
- Backdrop: `<DialogBackdrop>`
- Panel: `<DialogPanel>` with appropriate styling

### Dropdowns

- Base: `<Dropdown>` component
- Menu: `<DropdownMenu>` with appropriate positioning
- Items: `<DropdownItem>` with icons and labels

## Responsive Design

### Breakpoints

- Mobile: Default (no prefix)
- Small: `sm:` (640px)
- Medium: `md:` (768px)
- Large: `lg:` (1024px)
- Extra Large: `xl:` (1280px)

### Responsive Patterns

- Hide/Show elements: `hidden sm:block`
- Stack/Row layouts: `flex-col sm:flex-row`
- Spacing adjustments: `mt-4 sm:mt-0`

## Dark Mode Support

- Use dark mode variants for all colors
- Implement using the `dark:` prefix
- Ensure proper contrast in both modes

## Animation

- Use Framer Motion for complex animations
- Simple transitions: `transition` with appropriate duration and timing
- Hover effects: `hover:` prefix for interactive elements

## Accessibility

- Use semantic HTML elements
- Include appropriate ARIA labels
- Ensure proper color contrast
- Include screen reader text with `sr-only` class

## Best Practices

1. Use component composition for reusable elements
2. Maintain consistent spacing and alignment
3. Follow the established color palette
4. Implement responsive design patterns
5. Ensure dark mode compatibility
6. Maintain accessibility standards
7. Use appropriate typography hierarchy
8. Keep animations subtle and purposeful
