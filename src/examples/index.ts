import { DropdownMenu } from "./DropdownMenu";
import { Tooltip } from "./Tooltip";

// Helper function to get container by ID
const getContainer = (id: string) => document.getElementById(id) as HTMLElement;

// Initialize default examples (in document.body)
new Tooltip(
  document.getElementById("tooltip-default")!,
  "Default tooltip in document.body",
  "top"
);

new DropdownMenu(
  document.getElementById("dropdown-default")!,
  ["Profile", "Settings", "Help", "Sign Out"],
  "bottom-start"
);

// Container 1: Simple container
const container1 = getContainer("container1");
new Tooltip(
  document.getElementById("tooltip-container1")!,
  "Tooltip in Container 1",
  "top",
  { container: container1 }
);

new DropdownMenu(
  document.getElementById("dropdown-container1")!,
  ["Item 1", "Item 2", "Item 3"],
  "bottom-start",
  { container: container1 }
);

// Container 2: Scrollable container
const container2 = getContainer("container2");
new Tooltip(
  document.getElementById("tooltip-container2")!,
  "Tooltip in scrollable container",
  "top",
  { container: container2 }
);

new DropdownMenu(
  document.getElementById("dropdown-container2")!,
  ["Scroll Item 1", "Scroll Item 2", "Scroll Item 3"],
  "bottom-start",
  { container: container2 }
);

// Container 3: Nested scrollable containers
const container3Inner = getContainer("container3-inner");
new Tooltip(
  document.getElementById("tooltip-container3")!,
  "Tooltip in nested container",
  "top",
  { container: container3Inner }
);

new DropdownMenu(
  document.getElementById("dropdown-container3")!,
  ["Nested Item 1", "Nested Item 2", "Nested Item 3"],
  "bottom-start",
  { container: container3Inner }
);

// Container 4: Mixed container targets
const container4 = getContainer("container4");

// Tooltip in container, floating element in body
new Tooltip(
  document.getElementById("tooltip-mixed1")!,
  "Tooltip from container to body",
  "top"
);

// Tooltip in body, floating element in container
new Tooltip(
  document.getElementById("tooltip-mixed2")!,
  "Tooltip from body to container",
  "bottom",
  { container: container4 }
);
