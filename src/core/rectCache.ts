type RectCache = Map<Element, DOMRect>;

export class RectCacheManager {
  private static cache: RectCache = new Map();

  static getBoundingClientRect(element: Element): DOMRect {
    let rect = this.cache.get(element);
    if (!rect) {
      rect = element.getBoundingClientRect();
      this.cache.set(element, rect);
    }
    return rect;
  }

  static clear(): void {
    this.cache.clear();
  }
}
