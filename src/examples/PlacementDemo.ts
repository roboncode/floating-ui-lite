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
  private isVisible: boolean = false;
  private toggleButton: HTMLButtonElement;

  constructor(instances: Instances) {
    this.instances = instances;

    // Create container for the grid
    this.container = document.createElement("div");
    this.container.className = "placement-demo collapsed";

    // Create toggle button with hamburger icon
    this.toggleButton = document.createElement("button");
    this.toggleButton.className = "placement-toggle-button";
    this.toggleButton.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M3 4.5H15M3 9H15M3 13.5H15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
    `;
    this.toggleButton.addEventListener("click", this.toggleVisibility);

    // Create grid container
    const gridContainer = document.createElement("div");
    gridContainer.className = "grid-container";

    // Create grid buttons
    const placements: (Placement | null)[][] = [
      ["top-start", "top", "top-end"],
      ["left-start", null, "right-start"],
      ["left", null, "right"],
      ["left-end", null, "right-end"],
      ["bottom-start", "bottom", "bottom-end"],
    ];

    placements.forEach((row) => {
      const rowDiv = document.createElement("div");
      rowDiv.className = "placement-row";

      row.forEach((placement) => {
        if (placement === null) {
          const spacer = document.createElement("div");
          spacer.className = "placement-button-spacer";
          rowDiv.appendChild(spacer);
        } else {
          const button = document.createElement("button");
          button.className = "placement-button";
          button.textContent = placement.split("-").join(" ");
          button.addEventListener("click", () => {
            this.updatePlacement(placement, button);
            this.hide();
          });
          rowDiv.appendChild(button);
        }
      });

      gridContainer.appendChild(rowDiv);
    });

    // Add toggle button and grid to container
    this.container.appendChild(this.toggleButton);
    this.container.appendChild(gridContainer);

    // Add to document
    document.body.appendChild(this.container);

    // Add click outside listener
    document.addEventListener("click", this.handleClickOutside);
  }

  private handleClickOutside = (event: MouseEvent) => {
    if (this.isVisible && !this.container.contains(event.target as Node)) {
      this.hide();
    }
  };

  private toggleVisibility = (event: Event) => {
    event.stopPropagation();
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  };

  private show = () => {
    this.isVisible = true;
    this.container.classList.remove("collapsed");
    this.toggleButton.classList.add("active");
  };

  private hide = () => {
    this.isVisible = false;
    this.container.classList.add("collapsed");
    this.toggleButton.classList.remove("active");
  };

  private updatePlacement(placement: Placement, button: HTMLElement) {
    if (this.currentButton) {
      this.currentButton.classList.remove("active");
    }
    button.classList.add("active");
    this.currentButton = button;

    this.instances.tooltips.forEach((tooltip) =>
      tooltip.updatePlacement(placement)
    );
    this.instances.dropdowns.forEach((dropdown) =>
      dropdown.updatePlacement(placement)
    );
  }

  destroy() {
    document.removeEventListener("click", this.handleClickOutside);
    this.instances.tooltips.forEach((tooltip) => tooltip.destroy());
    this.instances.dropdowns.forEach((dropdown) => dropdown.destroy());
    this.container.remove();
  }
}
