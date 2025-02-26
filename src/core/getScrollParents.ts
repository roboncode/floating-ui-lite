/**
 * Gets all scrollable parent elements up to the specified container
 */
export function getScrollParents(
  element: Element,
  container: HTMLElement
): Element[] {
  const parents: Element[] = [];
  let parent = element.parentElement;

  // Early return if no parent
  if (!parent) return parents;

  const containerParent = container.parentElement;
  while (parent && parent !== containerParent) {
    const { overflow, overflowX, overflowY } = window.getComputedStyle(parent);
    if (/(auto|scroll|overlay)/.test(overflow + overflowY + overflowX)) {
      parents.push(parent);
    }
    parent = parent.parentElement;
  }

  return parents;
}
