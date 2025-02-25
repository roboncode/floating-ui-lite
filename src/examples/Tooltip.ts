import { FloatingOptions, Placement, computePosition } from "../index";

import { offset } from "../middleware/offset";
import { placement } from "../middleware/placement";
import { throttle } from "../utils/throttle";

// Create middleware array outside class
const createMiddleware = () => [offset(6), placement()];

// Throttle interval in ms
const THROTTLE_INTERVAL = 100; // Approximately 60fps

export class Tooltip {
  private reference: HTMLElement;
  private floating: HTMLElement;
  private placement: Placement;
  private container: HTMLElement;
  private cleanup: (() => void) | null = null;
  private throttledUpdate: () => void;

  constructor(
    reference: HTMLElement,
    content: string,
    placement: Placement = "top",
    options: FloatingOptions = {}
  ) {
    this.reference = reference;
    this.placement = placement;
    this.container = options.container || document.body;
    this.throttledUpdate = throttle(this.update, THROTTLE_INTERVAL);

    // Create tooltip element
    this.floating = document.createElement("div");
    this.floating.className = "tooltip";
    this.floating.textContent = content;

    // Add styles
    this.addStyles();

    // Setup event listeners
    this.reference.addEventListener("mouseenter", this.show);
    this.reference.addEventListener("mouseleave", this.hide);
  }

  private addStyles() {
    const style = document.createElement("style");
    style.textContent = `
      .tooltip {
        position: absolute;
        background: #1c1c1e;
        color: white;
        padding: 6px 10px;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 500;
        pointer-events: none;
        transition: opacity 0.2s cubic-bezier(0.2, 0, 0.13, 1);
        opacity: 0;
        z-index: 1000;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        -webkit-font-smoothing: antialiased;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.12);
        max-width: 200px;
        text-align: center;
        line-height: 1.4;
      }
    `;
    document.head.appendChild(style);
  }

  private update = async () => {
    const { x, y } = await computePosition(this.reference, this.floating, {
      placement: this.placement,
      strategy: "absolute",
      container: this.container,
      middleware: createMiddleware(),
    });

    Object.assign(this.floating.style, {
      left: `${x}px`,
      top: `${y}px`,
    });
  };

  private show = () => {
    this.container.appendChild(this.floating);

    // Update position before showing to prevent flash
    this.update().then(() => {
      requestAnimationFrame(() => {
        this.floating.style.opacity = "1";
      });
    });

    // Setup update loop with throttling
    let frame: number;
    const update = async () => {
      await this.throttledUpdate();
      frame = requestAnimationFrame(update);
    };
    update();

    // Cleanup function
    this.cleanup = () => {
      cancelAnimationFrame(frame);
      this.floating.style.opacity = "0";

      // Remove tooltip after transition
      const onTransitionEnd = () => {
        this.floating.remove();
        this.floating.removeEventListener("transitionend", onTransitionEnd);
      };
      this.floating.addEventListener("transitionend", onTransitionEnd);
    };
  };

  private hide = () => {
    if (this.cleanup) {
      this.cleanup();
      this.cleanup = null;
    }
  };

  destroy() {
    this.reference.removeEventListener("mouseenter", this.show);
    this.reference.removeEventListener("mouseleave", this.hide);
    this.hide();
  }

  // Add method to update placement
  updatePlacement(newPlacement: Placement) {
    this.placement = newPlacement;
    if (this.floating.isConnected) {
      this.update();
    }
  }
}
