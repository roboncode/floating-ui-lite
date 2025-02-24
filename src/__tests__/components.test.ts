import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DropdownMenu } from "../examples/DropdownMenu";
import { Tooltip } from "../examples/Tooltip";

describe("Components", () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  describe("Tooltip", () => {
    it("should create and show tooltip on hover", () => {
      const button = document.createElement("button");
      container.appendChild(button);

      const tooltip = new Tooltip(button, "Test tooltip", "top");

      // Simulate mouseenter
      button.dispatchEvent(new MouseEvent("mouseenter"));

      // Check if tooltip is in the document
      const tooltipElement = document.querySelector(".tooltip");
      expect(tooltipElement).toBeTruthy();
      expect(tooltipElement?.textContent).toBe("Test tooltip");
    });

    it("should remove tooltip on mouseleave", () => {
      const button = document.createElement("button");
      container.appendChild(button);

      const tooltip = new Tooltip(button, "Test tooltip", "top");

      // Show and hide tooltip
      button.dispatchEvent(new MouseEvent("mouseenter"));
      button.dispatchEvent(new MouseEvent("mouseleave"));

      // Check if tooltip is removed
      const tooltipElement = document.querySelector(".tooltip");
      expect(tooltipElement).toBeFalsy();
    });

    it("should cleanup properly on destroy", () => {
      const button = document.createElement("button");
      container.appendChild(button);

      const tooltip = new Tooltip(button, "Test tooltip", "top");

      // Show tooltip
      button.dispatchEvent(new MouseEvent("mouseenter"));

      // Destroy tooltip
      tooltip.destroy();

      // Check if tooltip is removed
      const tooltipElement = document.querySelector(".tooltip");
      expect(tooltipElement).toBeFalsy();

      // Try to show tooltip again
      button.dispatchEvent(new MouseEvent("mouseenter"));
      expect(document.querySelector(".tooltip")).toBeFalsy();
    });
  });

  describe("DropdownMenu", () => {
    it("should create and show menu on click", () => {
      const button = document.createElement("button");
      container.appendChild(button);

      const items = ["Item 1", "Item 2", "Item 3"];
      const menu = new DropdownMenu(button, items, "bottom");

      // Click button to show menu
      button.click();

      // Check if menu is in the document
      const menuElement = document.querySelector(".dropdown-menu");
      expect(menuElement).toBeTruthy();

      // Check if all items are rendered
      const menuItems = menuElement?.querySelectorAll(".dropdown-menu-item");
      expect(menuItems?.length).toBe(items.length);
      menuItems?.forEach((item, index) => {
        expect(item.textContent).toBe(items[index]);
      });
    });

    it("should emit event when menu item is selected", () => {
      const button = document.createElement("button");
      container.appendChild(button);

      const items = ["Item 1", "Item 2", "Item 3"];
      const menu = new DropdownMenu(button, items, "bottom");

      // Setup event listener
      const onSelect = vi.fn();
      button.addEventListener("menuselect", onSelect);

      // Show menu and click item
      button.click();
      const menuItem = document.querySelector(
        ".dropdown-menu-item"
      ) as HTMLElement;
      menuItem?.click();

      // Check if event was emitted
      expect(onSelect).toHaveBeenCalled();
      expect(onSelect.mock.calls[0][0].detail).toBe("Item 1");
    });

    it("should close when clicking outside", async () => {
      const button = document.createElement("button");
      container.appendChild(button);

      const menu = new DropdownMenu(button, ["Item 1"], "bottom");

      // Show menu
      button.click();
      expect(menu.isOpen).toBe(true);

      // Click outside
      document.body.click();

      // Wait for next tick to allow for DOM updates
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Check if menu is closed
      expect(menu.isOpen).toBe(false);
    });

    it("should cleanup properly on destroy", () => {
      const button = document.createElement("button");
      container.appendChild(button);

      const menu = new DropdownMenu(button, ["Item 1"], "bottom");

      // Show menu
      button.click();

      // Destroy menu
      menu.destroy();

      // Check if menu is removed
      expect(document.querySelector(".dropdown-menu")).toBeFalsy();

      // Try to show menu again
      button.click();
      expect(document.querySelector(".dropdown-menu")).toBeFalsy();
    });
  });
});
