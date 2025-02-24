import { beforeEach, describe, expect, it } from "vitest";

import { arrow } from "../middleware/arrow";
import { computePosition } from "../core/computePosition";
import { flip } from "../middleware/flip";
import { placement } from "../middleware/placement";
import { shift } from "../middleware/shift";
import { size } from "../middleware/size";

describe("Middleware Integration", () => {
  let reference: HTMLElement;
  let floating: HTMLElement;
  let arrowElement: HTMLElement;

  beforeEach(() => {
    // Setup reference element
    reference = document.createElement("div");
    Object.defineProperty(reference, "getBoundingClientRect", {
      value: () => ({
        x: 50,
        y: 50,
        width: 100,
        height: 50,
        top: 50,
        left: 50,
        right: 150,
        bottom: 100,
      }),
    });

    // Setup floating element
    floating = document.createElement("div");
    Object.defineProperty(floating, "getBoundingClientRect", {
      value: () => ({
        x: 50,
        y: 150,
        width: 200,
        height: 100,
        top: 150,
        left: 50,
        right: 250,
        bottom: 250,
      }),
    });

    // Setup arrow element
    arrowElement = document.createElement("div");
    Object.defineProperty(arrowElement, "getBoundingClientRect", {
      value: () => ({
        width: 10,
        height: 10,
        x: 0,
        y: 0,
        top: 0,
        left: 0,
        right: 10,
        bottom: 10,
      }),
    });
  });

  it("should handle placement with flip and shift", async () => {
    // Mock a viewport that's too small for bottom placement
    Object.defineProperty(window, "innerHeight", { value: 200 });
    Object.defineProperty(window, "innerWidth", { value: 400 });

    const result = await computePosition(reference, floating, {
      placement: "bottom",
      middleware: [flip(), shift({ padding: 5 })],
    });

    // Should flip to top since there's not enough space at bottom
    expect(result.placement).toBe("top");
    // Should be within viewport bounds
    expect(result.y).toBeGreaterThanOrEqual(5);
  });

  it("should handle size constraints with arrow positioning", async () => {
    const result = await computePosition(reference, floating, {
      placement: "bottom",
      middleware: [
        size({
          padding: 5,
          maxWidth: 150,
        }),
        arrow({ element: arrowElement }),
      ],
    });

    // Check if size middleware applied constraints
    expect(result.middlewareData.size?.width).toBeLessThanOrEqual(150);
    // Check if arrow was positioned
    expect(result.middlewareData.arrow?.x).toBeDefined();
    expect(result.middlewareData.arrow?.y).toBeDefined();
  });

  it("should handle multiple fallback placements", async () => {
    // Mock a viewport that's too small for vertical placements
    Object.defineProperty(window, "innerHeight", { value: 150 }); // Only enough space for left/right
    Object.defineProperty(window, "innerWidth", { value: 1000 });

    // Create new elements for this test
    const testReference = document.createElement("div");
    Object.defineProperty(testReference, "getBoundingClientRect", {
      value: () => ({
        x: 100,
        y: 100,
        width: 100,
        height: 50,
        top: 100,
        left: 100,
        right: 200,
        bottom: 150,
      }),
    });

    const testFloating = document.createElement("div");
    Object.defineProperty(testFloating, "getBoundingClientRect", {
      value: () => ({
        x: 100,
        y: 150,
        width: 200,
        height: 100,
        top: 150,
        left: 100,
        right: 300,
        bottom: 250,
      }),
    });

    const result = await computePosition(testReference, testFloating, {
      placement: "bottom",
      middleware: [
        placement({
          fallbackPlacements: ["top", "right", "left"],
        }),
        shift({ padding: 5 }),
      ],
    });

    // Should use one of the fallback placements that fits
    expect(result.placement).toBe("top");
    expect(result.middlewareData?.placement).toEqual({
      originalPlacement: "bottom",
      finalPlacement: "top",
    });
  });

  it("should maintain aspect ratio when resizing", async () => {
    const result = await computePosition(reference, floating, {
      placement: "bottom",
      middleware: [
        size({
          padding: 5,
          maxWidth: 150,
          maxHeight: 75,
          maintainAspectRatio: true,
        }),
      ],
    });

    const originalAspectRatio =
      floating.getBoundingClientRect().width /
      floating.getBoundingClientRect().height;
    const newAspectRatio = result.middlewareData.size?.aspectRatio;

    expect(newAspectRatio).toBeDefined();
    expect(Math.abs(originalAspectRatio - newAspectRatio!)).toBeLessThan(0.01);
  });
});
