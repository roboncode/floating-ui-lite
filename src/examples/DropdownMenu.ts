import { FloatingOptions, Placement, computePosition } from "../index";

import { VisibilityState } from "../types";
import { autoUpdate } from "../utils/autoUpdate";
import { flip } from "../middleware/flip";
import { hide } from "../middleware/hide";
import { offset } from "../middleware/offset";
import { placement } from "../middleware/placement";
import { shift } from "../middleware/shift";

// Create middleware array outside class
const createMiddleware = () => [
  placement(),
  offset(24),
  shift({ padding: 8, mainAxis: true, crossAxis: false }),
  flip(),
  hide({ strategy: "referenceHidden" }),
];

export class DropdownMenu {
  private trigger: HTMLElement;
  private menu: HTMLElement;
  private placement: Placement;
  private container: HTMLElement;
  private cleanup: (() => void) | null = null;
  private clickHandler: () => void;
  private middleware: ReturnType<typeof createMiddleware>;

  // Separate state tracking for DOM presence and visibility
  private isOpen: boolean = false;
  private isVisible: boolean = true;

  constructor(
    trigger: HTMLElement,
    menuItems: string[],
    placement: Placement = "bottom-start",
    options: FloatingOptions = {},
    additionalClasses: string[] = [],
  ) {
    this.trigger = trigger;
    this.placement = placement;
    this.container = options.container || document.body;
    this.middleware = createMiddleware();

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
        this.close();
      } else {
        this.open();
      }
    };

    // Setup event listeners
    this.setupEventListeners();
  }

  private setupEventListeners() {
    this.trigger.addEventListener("click", this.clickHandler);
  }

  /**
   * Updates the position and handles visibility based on middleware data
   * Separates DOM state (open/close) from visibility state (show/hide)
   */
  private updatePosition = async (visibilityState?: VisibilityState) => {
    // Only proceed with updates if menu is open
    if (!this.isOpen) return;

    const { x, y, middlewareData } = await computePosition(
      this.trigger,
      this.menu,
      {
        placement: this.placement,
        strategy: "absolute",
        container: this.container,
        middleware: this.middleware,
        visibilityState,
      },
    );

    // Handle visibility based on middleware data and visibility state
    const hideData = middlewareData.hide;
    // const isHidden =
    //   hideData.referenceHidden ||
    //   (hideData.escaped && hideData.strategy === "escaped");
    const shouldBeVisible =
      !hideData.referenceHidden ||
      (!hideData.escaped && hideData.strategy === "escaped");

    // Only update visibility if it changed
    if (shouldBeVisible !== this.isVisible) {
      this.isVisible = shouldBeVisible;
      if (shouldBeVisible) {
        console.log("🔍 Reference visible, showing menu");
        this.show();
      } else {
        console.log("🚫 Reference hidden, hiding menu");
        this.hide();
      }
    }

    // Update position if menu is in DOM
    if (this.menu.parentNode) {
      Object.assign(this.menu.style, {
        left: `${x}px`,
        top: `${y}px`,
      });
    }
  };

  /**
   * Opens the menu by adding it to the DOM
   * Initial visibility state is determined by current isVisible flag
   */
  open() {
    if (this.isOpen) return;

    console.log("📂 Opening menu");
    this.isOpen = true;
    this.container.appendChild(this.menu);

    // Set initial visibility based on current state
    if (this.isVisible) {
      this.show();
    } else {
      this.hide();
    }

    // Update position and start updates
    this.updatePosition();
    this.cleanup = autoUpdate(this.trigger, this.menu, this.updatePosition, {});
  }

  /**
   * Closes the menu by removing it from the DOM
   * Preserves the current visibility state for next open
   */
  close() {
    if (!this.isOpen) return;

    console.log("📕 Closing menu");
    this.isOpen = false;

    // Remove from DOM
    if (this.menu.parentNode) {
      this.menu.parentNode.removeChild(this.menu);
    }

    // Stop position updates
    if (this.cleanup) {
      this.cleanup();
      this.cleanup = null;
    }
  }

  /**
   * Shows the menu by adding the show class
   * Only affects visibility, not DOM presence
   */
  show() {
    console.log("👁️ Showing menu");
    this.menu.style.visibility = "visible";
    this.menu.style.pointerEvents = "auto";
  }

  /**
   * Hides the menu by removing the show class
   * Only affects visibility, not DOM presence
   */
  hide() {
    console.log("🙈 Hiding menu");
    this.menu.style.visibility = "hidden";
    this.menu.style.pointerEvents = "none";
  }

  destroy() {
    this.close();
    this.trigger.removeEventListener("click", this.clickHandler);

    // Reset all state
    this.isOpen = false;
    this.isVisible = true;
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
