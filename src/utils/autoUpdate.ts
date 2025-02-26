import { throttle } from "./throttle";

const THROTTLE_INTERVAL = 100;

export function autoUpdate(
  reference: HTMLElement,
  floating: HTMLElement,
  update: () => void | Promise<void>
): () => void {
  const throttledUpdate = throttle(update, THROTTLE_INTERVAL);
  let animationFrame: number | null = null;

  // Start update loop with throttling
  const startLoop = async () => {
    await throttledUpdate();
    animationFrame = requestAnimationFrame(startLoop);
  };

  // Start the animation loop
  startLoop();

  // Return cleanup function
  return () => {
    if (animationFrame !== null) {
      cancelAnimationFrame(animationFrame);
      animationFrame = null;
    }
  };
}
