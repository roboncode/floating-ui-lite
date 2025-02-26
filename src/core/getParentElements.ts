/**
 * Gets all parent elements up to the root
 */
export function getParentElements(element: Element): Element[] {
  const parents: Element[] = [];
  let current = element.parentElement;

  while (current) {
    parents.push(current);
    current = current.parentElement;
  }

  return parents;
}
