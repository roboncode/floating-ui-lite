import { beforeEach, describe, expect, it } from "vitest";

import { Placement } from "../types";
import { computePosition } from "../core/computePosition";

describe("computePosition", () => {
  let reference: HTMLElement;
  let floating: HTMLElement;

  beforeEach(() => {
    // Create reference element
    reference = document.createElement("div");
    Object.defineProperty(reference, "getBoundingClientRect", {
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

    // Create floating element
    floating = document.createElement("div");
    Object.defineProperty(floating, "getBoundingClientRect", {
      value: () => ({
        x: 0,
        y: 0,
        width: 200,
        height: 100,
        top: 0,
        left: 0,
        right: 200,
        bottom: 100,
      }),
    });
  });

  it("should compute position with default placement (bottom)", async () => {
    const result = await computePosition(reference, floating);

    expect(result.placement).toBe("bottom");
    expect(result.x).toBe(100); // Aligned with reference x
    expect(result.y).toBe(150); // Below reference (y + height)
  });

  const placements: Placement[] = [
    "top",
    "bottom",
    "left",
    "right",
    "top-start",
    "top-end",
    "bottom-start",
    "bottom-end",
    "left-start",
    "left-end",
    "right-start",
    "right-end",
  ];

  placements.forEach((placement) => {
    it(`should compute position for ${placement} placement`, async () => {
      const result = await computePosition(reference, floating, { placement });
      const [mainAxis, crossAxis] = placement.split("-");

      expect(result.placement).toBe(placement);

      // Test main axis positioning
      switch (mainAxis) {
        case "top":
          expect(result.y).toBe(100 - floating.getBoundingClientRect().height);
          break;
        case "bottom":
          expect(result.y).toBe(150);
          break;
        case "left":
          expect(result.x).toBe(100 - floating.getBoundingClientRect().width);
          break;
        case "right":
          expect(result.x).toBe(200);
          break;
      }

      // Test cross axis alignment
      if (crossAxis === "start") {
        if (mainAxis === "top" || mainAxis === "bottom") {
          expect(result.x).toBe(100);
        } else {
          expect(result.y).toBe(100);
        }
      } else if (crossAxis === "end") {
        if (mainAxis === "top" || mainAxis === "bottom") {
          expect(result.x).toBe(
            100 + 100 - floating.getBoundingClientRect().width
          );
        } else {
          expect(result.y).toBe(
            100 + 50 - floating.getBoundingClientRect().height
          );
        }
      }
    });
  });

  it("should run middleware in order", async () => {
    const calls: string[] = [];
    const middleware1 = {
      name: "test1",
      fn: async () => {
        calls.push("middleware1");
        return {};
      },
    };
    const middleware2 = {
      name: "test2",
      fn: async () => {
        calls.push("middleware2");
        return {};
      },
    };

    await computePosition(reference, floating, {
      middleware: [middleware1, middleware2],
    });

    expect(calls).toEqual(["middleware1", "middleware2"]);
  });

  it("should merge middleware data correctly", async () => {
    const middleware1 = {
      name: "test1",
      fn: async () => ({
        middlewareData: {
          test1: { value: 1 },
        },
      }),
    };
    const middleware2 = {
      name: "test2",
      fn: async () => ({
        middlewareData: {
          test2: { value: 2 },
        },
      }),
    };

    const result = await computePosition(reference, floating, {
      middleware: [middleware1, middleware2],
    });

    expect(result.middlewareData).toEqual({
      test1: { value: 1 },
      test2: { value: 2 },
    });
  });
});
