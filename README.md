# Dropdown Menu Library

A lightweight and flexible positioning library for creating tooltips, dropdowns, popovers, and other floating UI elements. Built with TypeScript and zero dependencies.

## Features

- 🎯 Precise positioning with multiple placement options
- 🔄 Smart flipping when there's not enough space
- ↔️ Shift to keep elements in view
- 📏 Automatic size adjustments
- ➡️ Arrow positioning support
- 🌐 Virtual element support
- 🎨 Customizable middleware system
- 📱 Framework agnostic

## Installation

```bash
npm install dropdown-menu
```

## Basic Usage

```typescript
import { computePosition, flip, shift } from "dropdown-menu";

// Basic positioning
const { x, y } = await computePosition(referenceElement, floatingElement, {
  placement: "bottom",
  middleware: [flip(), shift()],
});

// Apply the position
Object.assign(floatingElement.style, {
  left: `${x}px`,
  top: `${y}px`,
});
```

## Components

### Tooltip Example

```typescript
import { Tooltip } from "dropdown-menu/examples";

const button = document.querySelector("#my-button");
const tooltip = new Tooltip(button, "I'm a tooltip!", "top");

// Cleanup when needed
tooltip.destroy();
```

### Dropdown Menu Example

```typescript
import { DropdownMenu } from "dropdown-menu/examples";

const trigger = document.querySelector("#menu-trigger");
const items = ["Profile", "Settings", "Logout"];
const menu = new DropdownMenu(trigger, items, "bottom-start");

// Listen for item selection
trigger.addEventListener("menuselect", (event) => {
  console.log("Selected:", event.detail);
});

// Cleanup when needed
menu.destroy();
```

## Middleware

### Placement

Controls the preferred placement of the floating element.

```typescript
import { placement } from "dropdown-menu";

placement({
  fallbackPlacements: ["top", "right"],
});
```

### Flip

Automatically flips the placement when there isn't enough space.

```typescript
import { flip } from "dropdown-menu";

flip({
  fallbackPlacements: ["top", "right"],
});
```

### Shift

Shifts the floating element to keep it in view.

```typescript
import { shift } from "dropdown-menu";

shift({
  padding: 5,
});
```

### Size

Adjusts the size of the floating element to fit available space.

```typescript
import { size } from "dropdown-menu";

size({
  padding: 5,
  minWidth: 100,
  maxWidth: 300,
});
```

### Arrow

Positions an arrow element pointing to the reference.

```typescript
import { arrow } from "dropdown-menu";

arrow({
  element: arrowElement,
  padding: 5,
});
```

### Virtual

Handles positioning for virtual/detached elements.

```typescript
import { virtual } from "dropdown-menu";

virtual({
  ancestorScroll: true,
  ancestorResize: true,
});
```

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

## License

MIT
