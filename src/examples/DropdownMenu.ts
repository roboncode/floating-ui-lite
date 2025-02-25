import { FloatingOptions, Placement, computePosition } from "../index";

import { offset } from "../middleware/offset";

export class DropdownMenu {
  private trigger: HTMLElement;
  private menu: HTMLElement;
  private placement: Placement;
  private container: HTMLElement;
  isOpen: boolean = false;
  private cleanup: (() => void) | null = null;
  private animationFrame: number | null = null;
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

    // Create menu element
    this.menu = document.createElement("div");
    this.menu.className = "dropdown-menu";

    // Create menu items
    menuItems.forEach((item) => {
      const menuItem = document.createElement("div");
      menuItem.className = "dropdown-menu-item";
      menuItem.textContent = item;
      menuItem.addEventListener("click", () => {
        this.hide();
        // Emit custom event with selected item
        this.trigger.dispatchEvent(
          new CustomEvent("menuselect", { detail: item })
        );
      });
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
        border: 1px solid #ddd;
        border-radius: 4px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        min-width: 150px;
        opacity: 0;
        transform-origin: top;
        transform: scale(0.95);
        transition: opacity 0.1s, transform 0.1s;
        z-index: 1000;
        display: none;
      }

      .dropdown-menu.show {
        opacity: 1;
        transform: scale(1);
        display: block;
      }

      .dropdown-menu-item {
        padding: 8px 12px;
        cursor: pointer;
        transition: background-color 0.1s;
      }

      .dropdown-menu-item:hover {
        background-color: #f5f5f5;
      }

      .dropdown-menu-item:not(:last-child) {
        border-bottom: 1px solid #eee;
      }
    `;
    document.head.appendChild(style);
  }

  private setupEventListeners() {
    this.trigger.addEventListener("click", this.clickHandler);
  }

  private handleClickOutside = (event: MouseEvent) => {
    if (!this.isOpen) return;

    const target = event.target as Node;
    if (!this.menu.contains(target) && !this.trigger.contains(target)) {
      this.hide();
    }
  };

  private updatePosition = async () => {
    if (!this.isOpen) return;

    const { x, y } = await computePosition(this.trigger, this.menu, {
      placement: this.placement,
      strategy: "absolute",
      container: this.container,
      middleware: [offset(12)],
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

    // Add click outside listener
    document.addEventListener("click", this.handleClickOutside);

    // Start update loop
    const update = () => {
      if (!this.isOpen) return;
      this.updatePosition();
      this.animationFrame = requestAnimationFrame(update);
    };
    update();
  }

  hide() {
    if (!this.isOpen) return;

    this.isOpen = false;
    this.menu.classList.remove("show");

    // Cancel animation frame
    if (this.animationFrame !== null) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }

    // Remove click outside listener
    document.removeEventListener("click", this.handleClickOutside);

    // Remove menu after transition
    const onTransitionEnd = () => {
      if (this.menu.parentNode) {
        this.menu.parentNode.removeChild(this.menu);
      }
      this.menu.removeEventListener("transitionend", onTransitionEnd);
    };
    this.menu.addEventListener("transitionend", onTransitionEnd);
  }

  destroy() {
    this.hide();
    this.trigger.removeEventListener("click", this.clickHandler);
    document.removeEventListener("click", this.handleClickOutside);

    // Force cleanup if menu is still in DOM
    if (this.menu.parentNode) {
      this.menu.parentNode.removeChild(this.menu);
    }

    // Reset state
    this.isOpen = false;
    this.animationFrame = null;
  }
}
