import { FloatingOptions, Placement, computePosition } from "../index";

import { autoUpdate } from "../utils/autoUpdate";
import { flip } from "../middleware/flip";
import { offset } from "../middleware/offset";
import { placement } from "../middleware/placement";

// Create middleware array outside class
const createMiddleware = () => [placement(), offset(24), flip()];

export class DropdownMenu {
  private trigger: HTMLElement;
  private menu: HTMLElement;
  private placement: Placement;
  private container: HTMLElement;
  private options: FloatingOptions;
  isOpen: boolean = false;
  private cleanup: (() => void) | null = null;
  private clickHandler: () => void;

  constructor(
    trigger: HTMLElement,
    menuItems: string[],
    placement: Placement = "bottom-start",
    options: FloatingOptions = {}
  ) {
    this.trigger = trigger;
    this.placement = placement;
    this.container = options.container || document.body;
    this.options = options;

    // Create menu element
    this.menu = document.createElement("div");
    this.menu.className = "dropdown-menu";

    // Create menu items
    menuItems.forEach((item) => {
      const menuItem = document.createElement("div");
      menuItem.className = "dropdown-menu-item";
      menuItem.textContent = item;
      // menuItem.addEventListener("click", () => {
      //   // Emit custom event with selected item
      //   this.trigger.dispatchEvent(
      //     new CustomEvent("menuselect", { detail: item })
      //   );
      // });
      this.menu.appendChild(menuItem);
    });

    // Add styles
    this.addStyles();

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

  private addStyles() {
    const style = document.createElement("style");
    style.textContent = `
      .dropdown-menu {
        position: absolute;
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08),
                    0 0 1px rgba(0, 0, 0, 0.1);
        min-width: 180px;
        opacity: 0;
        transform-origin: top;
        transform: scale(0.95);
        transition-property: opacity, transform;
        transition-duration: 0.2s;
        transition-timing-function: cubic-bezier(0.2, 0, 0.13, 1);
        z-index: 1000;
        display: none;
        padding: 6px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      }

      .dropdown-menu.show {
        opacity: 1;
        transform: scale(1);
        display: block;
      }

      .dropdown-menu-item {
        padding: 8px 12px;
        cursor: pointer;
        transition: all 0.1s ease;
        border-radius: 6px;
        font-size: 13px;
        color: #1c1c1e;
        font-weight: 400;
        -webkit-font-smoothing: antialiased;
        line-height: 1.2;
      }

      .dropdown-menu-item:hover {
        background-color: rgba(0, 0, 0, 0.04);
        color: #006FFF;
      }
    `;
    document.head.appendChild(style);
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
    console.log("updatePosition", x, y);

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
    console.log("options", this.options);
    // Start position updates
    this.cleanup = autoUpdate(this.trigger, this.menu, this.updatePosition, {
      layoutShift: this.options.layoutShift ?? false,
      elementResize: this.options.elementResize ?? false,
      ancestorResize: false,
      ancestorScroll: false,
      animationFrame: false,
    });
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

    // // Remove menu after transition
    // const onTransitionEnd = () => {
    //   if (this.menu.parentNode) {
    //     this.menu.parentNode.removeChild(this.menu);
    //   }
    //   this.menu.removeEventListener("transitionend", onTransitionEnd);
    // };
    // this.menu.addEventListener("transitionend", onTransitionEnd);
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
