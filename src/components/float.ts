import { FloatingOptions, Placement, computePosition } from "../index";

import { flip } from "../middleware/flip";
import { hide } from "../middleware/hide";
import { offset } from "../middleware/offset";
import { placement } from "../middleware/placement";
import { shift } from "../middleware/shift";
import { VisibilityState } from "../types";
import { autoUpdate } from "../utils/autoUpdate";

// Create middleware array outside class
const createMiddleware = () => [
  placement(),
  offset(8),
  shift({ padding: 8, mainAxis: true, crossAxis: false }),
  flip(),
  hide({ strategy: "referenceHidden" }),
];

export class Float {
  private trigger: HTMLElement;
  private float: HTMLElement;
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
    placement: Placement = "bottom-start",
    options: FloatingOptions = {},
    additionalClasses: string[] = [],
  ) {
    this.trigger = trigger;
    // console.log(
    //   "Initializing Float with placement:",
    //   placement,
    //   typeof placement
    // );
    this.placement = placement;
    this.container = options.container || document.body;
    this.middleware = createMiddleware();

    // Create float element
    this.float = document.createElement("div");
    this.float.className = "dropdown-float";

    // Add any additional classes
    if (additionalClasses.length > 0) {
      this.float.classList.add(...additionalClasses);
    }

    // Add a minimal content div to ensure proper positioning
    const content = document.createElement("div");
    this.float.appendChild(content);

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
    // Only proceed with updates if float is open
    if (!this.isOpen) return;

    console.log(
      "Updating position with placement:",
      this.placement,
      typeof this.placement,
    );

    const { x, y, middlewareData } = await computePosition(
      this.trigger,
      this.float,
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
        console.log("🔍 Reference visible, showing float");
        this.show();
      } else {
        console.log("🚫 Reference hidden, hiding float");
        this.hide();
      }
    }

    // Update position if float is in DOM
    if (this.float.parentNode) {
      Object.assign(this.float.style, {
        left: `${x}px`,
        top: `${y}px`,
      });
    }
  };

  /**
   * Opens the float by adding it to the DOM
   * Initial visibility state is determined by current isVisible flag
   */
  open() {
    if (this.isOpen) return;

    console.log("📂 Opening float");
    this.isOpen = true;
    this.container.appendChild(this.float);

    // Set initial visibility based on current state
    if (this.isVisible) {
      this.show();
    } else {
      this.hide();
    }

    // Update position and start updates
    this.updatePosition();
    this.cleanup = autoUpdate(
      this.trigger,
      this.float,
      this.updatePosition,
      {},
    );
  }

  /**
   * Closes the float by removing it from the DOM
   * Preserves the current visibility state for next open
   */
  close() {
    if (!this.isOpen) return;

    console.log("📕 Closing float");
    this.isOpen = false;

    // Remove from DOM
    if (this.float.parentNode) {
      this.float.parentNode.removeChild(this.float);
    }

    // Stop position updates
    if (this.cleanup) {
      this.cleanup();
      this.cleanup = null;
    }
  }

  /**
   * Shows the float by adding the show class
   * Only affects visibility, not DOM presence
   */
  show() {
    console.log("👁️ Showing float");
    this.float.style.visibility = "visible";
    this.float.style.pointerEvents = "auto";
  }

  /**
   * Hides the float by removing the show class
   * Only affects visibility, not DOM presence
   */
  hide() {
    console.log("🙈 Hiding float");
    this.float.style.visibility = "hidden";
    this.float.style.pointerEvents = "none";
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
