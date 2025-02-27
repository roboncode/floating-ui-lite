/**
 * Basic coordinates type for positioning
 */
export type Coords = {
  x: number;
  y: number;
};

/**
 * Represents the dimensions of an element
 */
export type Dimensions = {
  width: number;
  height: number;
};

/**
 * Represents the boundaries of an element
 */
export type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

/**
 * Virtual element interface for non-DOM elements
 */
export interface VirtualElement {
  getBoundingClientRect(): DOMRect;
  contextElement?: Element;
}

/**
 * Available placement positions for the floating element
 */
export type Placement =
  | "top"
  | "top-start"
  | "top-end"
  | "right"
  | "right-start"
  | "right-end"
  | "bottom"
  | "bottom-start"
  | "bottom-end"
  | "left"
  | "left-start"
  | "left-end";

/**
 * Strategy for positioning the floating element
 */
export type Strategy = "absolute" | "fixed";

/**
 * Core elements involved in the positioning
 */
export type Elements = {
  reference: HTMLElement;
  floating: HTMLElement;
  container?: HTMLElement;
};

/**
 * Middleware options interface
 */
export interface MiddlewareOptions {
  placement?: Placement;
  strategy?: Strategy;
  [key: string]: any;
}

/**
 * Middleware function type
 */
export type Middleware = {
  name: string;
  fn: (state: ComputePositionState) => Promise<Partial<ComputePositionState>>;
};

/**
 * State object used during position computation
 */
export interface ComputePositionState {
  x: number;
  y: number;
  placement: Placement;
  strategy: Strategy;
  rects: {
    reference: Rect;
    floating: Rect;
  };
  elements: Elements;
  middlewareData: Record<string, any>;
  visibilityState?: VisibilityState;
  update?: () => void;
  cleanup?: () => void;
}

export interface VisibilityState {
  isReferenceVisible: boolean;
  isFloatingVisible: boolean;
  isWithinViewport: boolean;
}

export interface FloatingOptions {
  container?: HTMLElement;
  ancestorScroll?: boolean;
  ancestorResize?: boolean;
  elementResize?: boolean;
  layoutShift?: boolean;
  animationFrame?: boolean;
}

export interface ComputePositionOptions {
  placement?: Placement;
  strategy?: Strategy;
  middleware?: Middleware[];
  container?: HTMLElement;
  visibilityState?: VisibilityState;
}
