import { FloatingOptions, Placement, computePosition } from "../index";

export class Tooltip {
  private reference: HTMLElement;
  private floating: HTMLElement;
  private placement: Placement;
  private container: HTMLElement;
  private cleanup: (() => void) | null = null;

  constructor(
    reference: HTMLElement,
    content: string,
    placement: Placement = "top",
    options: FloatingOptions = {}
  ) {
    this.reference = reference;
    this.placement = placement;
    this.container = options.container || document.body;

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
        background: #333;
        color: white;
        padding: 8px;
        border-radius: 4px;
        font-size: 14px;
        pointer-events: none;
        transition: opacity 0.2s;
        opacity: 0;
        z-index: 1000;
      }
    `;
    document.head.appendChild(style);
  }

  private update = async () => {
    const { x, y } = await computePosition(this.reference, this.floating, {
      placement: this.placement,
      strategy: "absolute",
      container: this.container,
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

    // Setup update loop
    let frame: number;
    const update = () => {
      this.update();
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
}
