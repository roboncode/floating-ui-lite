# Anchor

A lightweight positioning engine for floating elements, inspired by floating-ui.com. Zero dependencies.

## Basic Usage

```ts
import { computePosition, autoUpdate } from "anchor";

// Basic positioning
const { x, y } = await computePosition(reference, floating, {
  placement: "bottom",
  middleware: [offset(10), flip(), shift()],
});

// Apply position
floating.style.left = `${x}px`;
floating.style.top = `${y}px`;

// Keep position updated
const cleanup = autoUpdate(reference, floating, update);
```

## Core Middleware

### placement

Places the floating element relative to its reference.

```ts
placement("bottom"); // 'top' | 'right' | 'bottom' | 'left' with -start/-end variations
```

### offset

Offsets the floating element from its reference element.

```ts
offset(10); // number of pixels to offset
```

### flip

Flips placement to the opposite side when there isn't enough space.

```ts
flip({
  padding: 5, // padding from viewport edges
});
```

### shift

Shifts the floating element to keep it in view.

```ts
shift({
  padding: 5, // padding from viewport edges
  mainAxis: true, // enable/disable shift on main axis
  crossAxis: false, // enable/disable shift on cross axis
});
```

### hide

Shows/hides the floating element based on reference visibility and available space.
ReferenceHidden means the "trigger", escaped means "floating element"

```ts
hide({
  strategy: "referenceHidden", // 'referenceHidden' | 'escaped'
});
```
