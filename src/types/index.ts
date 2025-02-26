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
export type Rect = Coords & Dimensions;

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
  | "bottom"
  | "bottom-start"
  | "bottom-end"
  | "left"
  | "left-start"
  | "left-end"
  | "right"
  | "right-start"
  | "right-end";

/**
 * Strategy for positioning the floating element
 */
export type Strategy = "absolute" | "fixed";

/**
 * Core elements involved in the positioning
 */
export type Elements = {
  reference: Element | null;
  floating: HTMLElement | null;
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
  strategy: Strategy;
  placement: Placement;
  elements: {
    reference: Element;
    floating: HTMLElement;
    container?: HTMLElement;
  };
  rects: {
    reference: Rect;
    floating: Rect;
  };
  middlewareData: Record<string, any>;
  update?: () => void;
  cleanup?: () => void;
}

export interface FloatingOptions {
  container?: HTMLElement;
  strategy?: Strategy;
  layoutShift?: boolean;
  elementResize?: boolean;
}

export interface ComputePositionOptions {
  placement?: Placement;
  strategy?: Strategy;
  middleware?: Middleware[];
  container?: HTMLElement;
}
