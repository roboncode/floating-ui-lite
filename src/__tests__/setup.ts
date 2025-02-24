import "@testing-library/jest-dom/vitest";

import { afterEach } from "vitest";

// Runs a cleanup after each test case
afterEach(() => {
  // Clean up any mounted elements
  document.body.innerHTML = "";
});
