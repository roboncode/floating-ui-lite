import { FloatingOptions, Placement, computePosition } from "../index";

import { autoUpdate } from "../utils/autoUpdate";
import { flip } from "../middleware/flip";
import { offset } from "../middleware/offset";
import { placement } from "../middleware/placement";
import { shift } from "../middleware/shift";

// Create middleware array outside class
const createMiddleware = () => [
  placement(),
  offset(24),
  shift({ padding: 8, mainAxis: true, crossAxis: false }),
  flip(),
];

export class DropdownMenu {
  private trigger: HTMLElement;
  private menu: HTMLElement;
  private placement: Placement;
  private container: HTMLElement;
  private options: FloatingOptions;
  private cleanup: (() => void) | null = null;
  private clickHandler: () => void;

  isOpen: boolean = false;

  constructor(
    trigger: HTMLElement,
    menuItems: string[],
    placement: Placement = "bottom-start",
    options: FloatingOptions = {},
    additionalClasses: string[] = []
  ) {
    this.trigger = trigger;
    this.placement = placement;
    this.container = options.container || document.body;
    this.options = options;

    // Create menu element
    this.menu = document.createElement("div");
    this.menu.className = "dropdown-menu";

    // Add any additional classes
    if (additionalClasses.length > 0) {
      this.menu.classList.add(...additionalClasses);
    }

    // Create menu items
    menuItems.forEach((item) => {
      const menuItem = document.createElement("div");
      menuItem.className = "dropdown-menu-item";
      menuItem.textContent = item;
      this.menu.appendChild(menuItem);
    });

    // Setup click handler
    this.clickHandler = () => {
      if (this.isOpen) {
        this.hide();
      } else {
        this.show();
      }
    };

    // Setup event listeners
    this.setupEventListeners();
  }

  private setupEventListeners() {
    this.trigger.addEventListener("click", this.clickHandler);
  }

  private updatePosition = async () => {
    const { x, y } = await computePosition(this.trigger, this.menu, {
      placement: this.placement,
      strategy: "absolute",
      container: this.container,
      middleware: createMiddleware(),
    });

    Object.assign(this.menu.style, {
      left: `${x}px`,
      top: `${y}px`,
    });
  };

  show() {
    if (this.isOpen) return;

    this.isOpen = true;
    this.container.appendChild(this.menu);

    // Update position before showing to prevent flash
    this.updatePosition().then(() => {
      requestAnimationFrame(() => {
        this.menu.classList.add("show");
      });
    });

    // Start position updates
    this.cleanup = autoUpdate(this.trigger, this.menu, this.updatePosition, {});
  }

  hide() {
    if (!this.isOpen) return;

    this.isOpen = false;
    this.menu.classList.remove("show");

    // Stop position updates
    if (this.cleanup) {
      this.cleanup();
      this.cleanup = null;
    }
  }

  destroy() {
    this.hide();
    this.trigger.removeEventListener("click", this.clickHandler);

    // Force cleanup if menu is still in DOM
    if (this.menu.parentNode) {
      this.menu.parentNode.removeChild(this.menu);
    }

    // Reset state
    this.isOpen = false;
    if (this.cleanup) {
      this.cleanup();
      this.cleanup = null;
    }
  }

  updatePlacement(newPlacement: Placement) {
    this.placement = newPlacement;
    if (this.isOpen) {
      this.updatePosition();
    }
  }
}
