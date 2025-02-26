# Core Positioning System

This folder contains the core positioning logic for the floating UI library. The system is designed to handle various positioning scenarios for floating elements (tooltips, dropdowns, etc.) in different container contexts.

## Key Concepts

### Positioning Contexts

The system handles three main types of positioning contexts:

1. **Body Container** (Default)

   - Floating elements are appended to `document.body`
   - Uses window scroll position for offset calculations
   - Coordinates are relative to the viewport

2. **Container-Relative**

   - Floating elements are contained within a specific element
   - Uses container's bounds for positioning
   - Handles scroll offsets within the container

3. **Mixed Contexts**
   - Supports elements that float from one container to another
   - Example: Button in a container with tooltip in body
   - Maintains correct positioning across scroll contexts

### Scroll Handling

The system tracks multiple types of scroll offsets:

- **Window Scroll**: Page-level scrolling
- **Container Scroll**: Scrolling within specific containers
- **Nested Scroll**: Multiple scrollable parent elements

Scroll offsets are calculated by:

1. Finding all scrollable parents up to the container
2. Accumulating scroll offsets from each parent
3. Applying offsets based on the positioning context

### Positioning Strategy

Two main positioning strategies are supported:

- **Absolute** (Default)

  - Position relative to closest positioned ancestor
  - Accounts for scroll offsets
  - Used for most floating elements

- **Fixed**
  - Position relative to viewport
  - Ignores scroll offsets
  - Useful for elements that should stay in view

## Implementation Details

### Core Functions

1. `computePosition(reference, floating, options)`

   - Main positioning function
   - Handles all positioning calculations
   - Returns final coordinates and state

2. `getScrollParents(element, container)`

   - Finds all scrollable parent elements
   - Stops at container boundary
   - Optimized with early returns

3. `computeInitialPosition(reference, floating, placement)`
   - Calculates base position
   - Handles different placement options
   - Supports cross-axis alignment

### Performance Optimizations

1. **Cached Values**

   - Window scroll position
   - Viewport dimensions
   - Container boundaries

2. **Minimal Calculations**

   - Only compute container rect when needed
   - Reuse existing calculations
   - Early returns for efficiency

3. **Type Safety**
   - Strong TypeScript types
   - Runtime type checking
   - Predictable state management

### Usage Example

```typescript
const position = await computePosition(referenceEl, floatingEl, {
  placement: "bottom",
  strategy: "absolute",
  container: customContainer, // optional
});

// Apply the position
Object.assign(floatingEl.style, {
  left: `${position.x}px`,
  top: `${position.y}px`,
});
```

## Container Scenarios

Here are the common scenarios the system handles:

1. **Default Body**

```typescript
computePosition(button, tooltip);
// Tooltip appears in document.body
```

2. **Container-Relative**

```typescript
computePosition(button, tooltip, { container: myContainer });
// Tooltip appears within myContainer
```

3. **Container → Body**

```typescript
// Button in container, tooltip in body
computePosition(containerButton, tooltip);
```

4. **Nested Containers**

```typescript
// Button and tooltip in nested container
computePosition(button, tooltip, { container: nestedContainer });
```

## Best Practices

1. **Container Choice**

   - Use body container for full-viewport floating elements
   - Use container-relative for contained UI components
   - Consider z-index stacking contexts

2. **Performance**

   - Minimize container rect calculations
   - Cache frequently accessed values
   - Use appropriate update frequencies

3. **Scroll Handling**

   - Monitor relevant scroll containers
   - Update positions on scroll when needed
   - Consider debouncing scroll handlers

4. **Positioning Strategy**
   - Use `absolute` for most cases
   - Use `fixed` only when elements must stay in viewport
   - Consider parent positioning contexts
