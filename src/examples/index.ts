import { DropdownMenu } from "./DropdownMenu";
import { PlacementDemo } from "./PlacementDemo";
import { Tooltip } from "./Tooltip";

// Helper function to get container by ID
const getContainer = (id: string) => document.getElementById(id) as HTMLElement;

// Store all instances for placement control
const instances: { tooltips: Tooltip[]; dropdowns: DropdownMenu[] } = {
  tooltips: [],
  dropdowns: [],
};

// Initialize default examples (in document.body)
instances.tooltips.push(
  new Tooltip(
    document.getElementById("tooltip-default")!,
    "Default tooltip in document.body",
    "top"
  )
);

instances.dropdowns.push(
  new DropdownMenu(
    document.getElementById("dropdown-default")!,
    ["Profile", "Settings", "Help", "Sign Out"],
    "bottom-start"
  )
);

// Container 1: Simple container
const container1 = getContainer("container1");
instances.tooltips.push(
  new Tooltip(
    document.getElementById("tooltip-container1")!,
    "Tooltip in Container 1",
    "top",
    { container: container1 }
  )
);

instances.dropdowns.push(
  new DropdownMenu(
    document.getElementById("dropdown-container1")!,
    ["Item 1", "Item 2", "Item 3"],
    "bottom-start",
    { container: container1 }
  )
);

// Container 2: Scrollable container
const container2 = getContainer("container2");
instances.tooltips.push(
  new Tooltip(
    document.getElementById("tooltip-container2")!,
    "Tooltip in scrollable container",
    "top",
    { container: container2 }
  )
);

instances.dropdowns.push(
  new DropdownMenu(
    document.getElementById("dropdown-container2")!,
    ["Scroll Item 1", "Scroll Item 2", "Scroll Item 3"],
    "bottom-start",
    { container: container2 }
  )
);

// Container 3: Nested scrollable containers
const container3Inner = getContainer("container3-inner");

// Elements contained within the nested container
instances.tooltips.push(
  new Tooltip(
    document.getElementById("tooltip-container3")!,
    "Tooltip in nested container",
    "top",
    { container: container3Inner }
  )
);

instances.dropdowns.push(
  new DropdownMenu(
    document.getElementById("dropdown-container3")!,
    ["Nested Item 1", "Nested Item 2", "Nested Item 3"],
    "bottom-start",
    { container: container3Inner }
  )
);

// Elements that float to document.body from nested container
instances.tooltips.push(
  new Tooltip(
    document.getElementById("tooltip-container3-floating")!,
    "Tooltip that floats to body from nested container",
    "top"
  )
);

instances.dropdowns.push(
  new DropdownMenu(
    document.getElementById("dropdown-container3-floating")!,
    ["Float Item 1", "Float Item 2", "Float Item 3"],
    "bottom-start"
  )
);

// Container 4: Mixed container targets
const container4 = getContainer("container4");

// Tooltip in container, floating element in body
instances.tooltips.push(
  new Tooltip(
    document.getElementById("tooltip-mixed1")!,
    "Tooltip from container to body",
    "top"
  )
);

// Tooltip in body, floating element in container
instances.tooltips.push(
  new Tooltip(
    document.getElementById("tooltip-mixed2")!,
    "Tooltip from body to container",
    "bottom",
    { container: container4 }
  )
);

// Dropdown in container, floating element in body
instances.dropdowns.push(
  new DropdownMenu(
    document.getElementById("dropdown-mixed1")!,
    ["Item 1", "Item 2", "Item 3"],
    "bottom-start"
  )
);

// Dropdown in body, floating element in container
instances.dropdowns.push(
  new DropdownMenu(
    document.getElementById("dropdown-mixed2")!,
    ["Item A", "Item B", "Item C"],
    "bottom-start",
    { container: container4 }
  )
);

// Initialize placement demo with all instances
new PlacementDemo(instances);

// Resize and Layout Shift Testing
const resizeContainer = getContainer("resize-container1");
instances.dropdowns.push(
  new DropdownMenu(
    document.getElementById("dropdown-resize1")!,
    ["Item 1", "Item 2", "Item 3"],
    "bottom-start",
    { container: resizeContainer }
  )
);

// Element resize testing
const resizableElement = getContainer("resizable-trigger");
instances.dropdowns.push(
  new DropdownMenu(
    document.getElementById("dropdown-resize2")!,
    ["Resize Item 1", "Resize Item 2", "Resize Item 3"],
    "bottom-start"
  )
);

// Toggle element size
document.getElementById("toggle-size")?.addEventListener("click", () => {
  resizableElement.classList.toggle("expanded");
});

// Layout shift testing
const shiftContainer = getContainer("layout-shift-container");
instances.dropdowns.push(
  new DropdownMenu(
    document.getElementById("dropdown-shift")!,
    ["Shift Item 1", "Shift Item 2", "Shift Item 3"],
    "bottom-start",
    { container: shiftContainer }
  )
);

// Trigger layout shift
document.getElementById("trigger-shift")?.addEventListener("click", () => {
  const spacer = shiftContainer.querySelector(".shift-spacer");
  spacer?.classList.toggle("expanded");
});
