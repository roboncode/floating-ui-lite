import { Float } from "./float";
import { PlacementControl } from "./placement";

// Helper function to get container by ID
const getContainer = (id: string) => document.getElementById(id) as HTMLElement;

// Store all instances for placement control
const instances: { dropdowns: Float[] } = {
  dropdowns: [],
};

// Initialize default examples (in document.body)
instances.dropdowns.push(
  new Float(document.getElementById("dropdown-default")!, "bottom-start"),
);

// Simple container
const simpleContainer = getContainer("simpleContainer");
instances.dropdowns.push(
  new Float(document.getElementById("dropdown-simple")!, "bottom-start", {
    container: simpleContainer,
  }),
);

// Scrollable container
const scrollableContainer = getContainer("scrollableContainer");
instances.dropdowns.push(
  new Float(document.getElementById("dropdown-scrollable")!, "bottom-start", {
    container: scrollableContainer,
  }),
);

// Nested scrollable containers
const nestedInnerContainer = getContainer("nestedInnerContainer");

// Elements contained within the nested container
instances.dropdowns.push(
  new Float(document.getElementById("dropdown-nested")!, "bottom-start", {
    container: nestedInnerContainer,
  }),
);

// Elements that float to document.body from nested container
instances.dropdowns.push(
  new Float(
    document.getElementById("dropdown-nested-floating")!,
    "bottom-start",
  ),
);

// Mixed container targets
const mixedTargetContainer = getContainer("mixedTargetContainer");

// Dropdown in container, floating element in body
instances.dropdowns.push(
  new Float(document.getElementById("dropdown-mixed-to-body")!, "bottom-start"),
);

// Dropdown in body, floating element in container
instances.dropdowns.push(
  new Float(
    document.getElementById("dropdown-mixed-to-container")!,
    "bottom-start",
    {
      container: mixedTargetContainer,
    },
  ),
);

// Initialize placement demo with all instances
new PlacementControl(instances);

// Resize and Layout Shift Testing
const resizableContainer = getContainer("resizableContainer");
const resizableDropdown = document.getElementById("dropdown-resizable")!;
instances.dropdowns.push(
  new Float(
    resizableDropdown,
    "bottom-start",
    {
      container: resizableContainer,
      // Event-based approach - explicit listeners
      ancestorScroll: true,
      elementResize: true,
      layoutShift: true,
    },
    resizableDropdown.dataset.dropdownClass?.split(" ") || [],
  ),
);

// Element resize testing
const elementResizeContainer = getContainer("elementResizeContainer");
const resizeTriggerDropdown = document.getElementById(
  "dropdown-resize-trigger",
)!;
instances.dropdowns.push(
  new Float(
    resizeTriggerDropdown,
    "bottom-start",
    {
      // RAF approach - continuous updates
      animationFrame: true,
      container: elementResizeContainer,
    },
    resizeTriggerDropdown.dataset.dropdownClass?.split(" ") || [],
  ),
);

// Toggle element size
document.getElementById("toggle-size")?.addEventListener("click", () => {
  const button = document.getElementById("dropdown-resize-trigger");
  button?.classList.toggle("expanded");
});

// Toggle adjacent element
document.getElementById("toggle-adjacent")?.addEventListener("click", () => {
  const container = document.querySelector(".shift-element") as HTMLElement;
  if (container) {
    container.classList.toggle("expanded");
  }
});

// Toggle container width
document.getElementById("toggle-container")?.addEventListener("click", () => {
  const container = getContainer("elementResizeContainer");
  container.classList.toggle("expanded");
});
