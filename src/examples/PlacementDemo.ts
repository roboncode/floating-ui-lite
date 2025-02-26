import { DropdownMenu } from "./DropdownMenu";
import { Placement } from "../index";
import { Tooltip } from "./Tooltip";

interface Instances {
  tooltips: Tooltip[];
  dropdowns: DropdownMenu[];
}

export class PlacementDemo {
  private container: HTMLElement;
  private currentButton: HTMLElement | null = null;
  private instances: Instances;

  constructor(instances: Instances) {
    this.instances = instances;

    // Create container for the grid
    this.container = document.createElement("div");
    this.container.className = "placement-demo";

    // Create grid buttons
    const placements: (Placement | null)[][] = [
      ["top-start", "top", "top-end"],
      ["left-start", null, "right-start"],
      ["left", null, "right"],
      ["left-end", null, "right-end"],
      ["bottom-start", "bottom", "bottom-end"],
    ];

    const gridContainer = document.createElement("div");
    gridContainer.className = "grid-container";

    placements.forEach((row) => {
      const rowDiv = document.createElement("div");
      rowDiv.className = "placement-row";

      row.forEach((placement) => {
        if (placement === null) {
          // Add empty space for center
          const spacer = document.createElement("div");
          spacer.className = "placement-button-spacer";
          rowDiv.appendChild(spacer);
        } else {
          const button = document.createElement("button");
          button.className = "placement-button";
          button.textContent = placement.split("-").join(" ");
          button.addEventListener("click", () =>
            this.updatePlacement(placement, button)
          );
          rowDiv.appendChild(button);
        }
      });

      gridContainer.appendChild(rowDiv);
    });

    this.container.appendChild(gridContainer);

    // Add styles
    this.addStyles();

    // Position the demo in top right corner
    Object.assign(this.container.style, {
      position: "fixed",
      top: "16px",
      right: "16px",
    });

    // Add to document
    document.body.appendChild(this.container);
  }

  private addStyles() {
    const style = document.createElement("style");
    style.textContent = `
      .placement-demo {
        background: rgba(250, 250, 250, 0.95);
        padding: 12px;
        border-radius: 12px;
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08),
                    0 0 1px rgba(0, 0, 0, 0.1);
        z-index: 1000;
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      }

      .grid-container {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .placement-row {
        display: flex;
        gap: 4px;
      }

      .placement-button {
        width: 64px;
        height: 28px;
        border: 1px solid rgba(0, 0, 0, 0.1);
        border-radius: 6px;
        background: white;
        cursor: pointer;
        font-size: 11px;
        font-weight: 500;
        color: #666;
        transition: all 0.2s ease;
        padding: 0 8px;
        line-height: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        -webkit-font-smoothing: antialiased;
      }

      .placement-button:hover {
        background: #f8f8f8;
        border-color: rgba(0, 0, 0, 0.15);
        color: #333;
      }

      .placement-button.active {
        background: #006FFF;
        color: white;
        border-color: #006FFF;
      }

      .placement-button-spacer {
        width: 64px;
        height: 28px;
      }
    `;
    document.head.appendChild(style);
  }

  private updatePlacement(placement: Placement, button: HTMLElement) {
    // Update active button
    if (this.currentButton) {
      this.currentButton.classList.remove("active");
    }
    button.classList.add("active");
    this.currentButton = button;

    // Update all tooltips and dropdowns
    this.instances.tooltips.forEach((tooltip) =>
      tooltip.updatePlacement(placement)
    );
    this.instances.dropdowns.forEach((dropdown) =>
      dropdown.updatePlacement(placement)
    );
  }

  destroy() {
    this.instances.tooltips.forEach((tooltip) => tooltip.destroy());
    this.instances.dropdowns.forEach((dropdown) => dropdown.destroy());
    this.container.remove();
  }
}
