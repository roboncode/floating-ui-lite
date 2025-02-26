import { beforeEach, describe, expect, it } from "vitest";

import { arrow } from "../middleware/arrow";
import { flip } from "../middleware/flip";
import { placement } from "../middleware/placement";
import { shift } from "../middleware/shift";
import { size } from "../middleware/size";
import { virtual } from "../middleware/virtual";
import { ComputePositionState } from "../types";

describe("Middleware", () => {
  let reference: HTMLElement;
  let floating: HTMLElement;
  let baseState: ComputePositionState;

  beforeEach(() => {
    // Create reference element
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

    // Create floating element
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

    // Base state for testing
    baseState = {
      x: 50,
      y: 150,
      strategy: "absolute",
      placement: "bottom",
      elements: {
        reference,
        floating,
      },
      rects: {
        reference: {
          x: 50,
          y: 50,
          width: 100,
          height: 50,
        },
        floating: {
          x: 50,
          y: 150,
          width: 200,
          height: 100,
        },
      },
      middlewareData: {},
    };
  });

  describe("placement middleware", () => {
    it("should maintain position when placement fits", async () => {
      // Mock viewport to be large enough for any placement
      Object.defineProperty(window, "innerWidth", { value: 1000 });
      Object.defineProperty(window, "innerHeight", { value: 1000 });

      // Create a state where the placement fits
      const state = {
        ...baseState,
        x: 100,
        y: 100,
        rects: {
          reference: {
            x: 100,
            y: 100,
            width: 100,
            height: 50,
          },
          floating: {
            x: 100,
            y: 150,
            width: 200,
            height: 100,
          },
        },
      };

      const middleware = placement();
      const result = await middleware.fn(state);
      expect(result).toEqual({});
    });

    it("should try fallback placements when primary placement doesnt fit", async () => {
      const middleware = placement({
        fallbackPlacements: ["top", "right", "left"],
      });

      // Mock viewport to make bottom and top placements not fit
      Object.defineProperty(window, "innerWidth", { value: 1000 });
      Object.defineProperty(window, "innerHeight", { value: 150 }); // Only enough space for left/right

      // Create a state where vertical placements won't fit
      const state = {
        ...baseState,
        x: 100,
        y: 100,
        rects: {
          reference: {
            x: 100,
            y: 100,
            width: 100,
            height: 50,
          },
          floating: {
            x: 100,
            y: 150,
            width: 200,
            height: 100,
          },
        },
      };

      const result = await middleware.fn(state);

      // Should use one of the fallback placements that fits
      expect(result.placement).toBe("top");
      expect(result.middlewareData?.placement).toEqual({
        originalPlacement: "bottom",
        finalPlacement: "top",
      });
    });
  });

  describe("flip middleware", () => {
    it("should flip placement when there isnt enough space", async () => {
      const middleware = flip();

      // Mock viewport to make bottom placement not fit
      Object.defineProperty(window, "innerHeight", { value: 200 });

      const result = await middleware.fn({
        ...baseState,
        y: 150,
      });

      expect(result.placement).toBe("top");
    });
  });

  describe("shift middleware", () => {
    it("should shift element to keep it in bounds", async () => {
      const middleware = shift({ padding: 5 });

      const result = await middleware.fn({
        ...baseState,
        x: -50, // Would place floating element outside viewport
      });

      expect(result.x).toBe(5); // Should be shifted to padding
    });
  });

  describe("size middleware", () => {
    it("should adjust size to fit available space", async () => {
      const middleware = size({
        padding: 5,
        maxWidth: 150,
      });

      const result = await middleware.fn(baseState);

      expect(result.middlewareData?.size?.width).toBeLessThanOrEqual(150);
    });
  });

  describe("arrow middleware", () => {
    it("should position arrow element correctly", async () => {
      const arrowElement = document.createElement("div");
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

      const middleware = arrow({ element: arrowElement });
      const result = await middleware.fn(baseState);

      expect(result.middlewareData?.arrow).toBeDefined();
      expect(typeof result.middlewareData?.arrow?.x).toBe("number");
      expect(typeof result.middlewareData?.arrow?.y).toBe("number");
    });
  });

  describe("virtual middleware", () => {
    it("should handle scroll offset", async () => {
      const middleware = virtual();

      // Mock scroll position
      Object.defineProperty(document.documentElement, "scrollTop", {
        value: 50,
      });
      Object.defineProperty(document.documentElement, "scrollLeft", {
        value: 25,
      });

      const result = await middleware.fn(baseState);

      expect(result.x).toBeGreaterThan(baseState.x);
      expect(result.y).toBeGreaterThan(baseState.y);
    });
  });
});
