export type Placement =
  | "top"
  | "bottom"
  | "left"
  | "right"
  | "top-start"
  | "top-end"
  | "bottom-start"
  | "bottom-end"
  | "left-start"
  | "left-end"
  | "right-start"
  | "right-end";

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface VirtualElement {
  getBoundingClientRect(): DOMRect;
  contextElement?: Element;
}

export interface Elements {
  reference: Element | null;
  floating: HTMLElement | null;
}

export interface ComputePositionState {
  x: number;
  y: number;
  placement: Placement;
  strategy: "absolute" | "fixed";
  elements: Elements;
  rects: {
    reference: Rect;
    floating: Rect;
  };
  middlewareData: Record<string, any>;
}

export interface Middleware {
  name: string;
  fn: (state: ComputePositionState) => Promise<Partial<ComputePositionState>>;
}

export type Strategy = "absolute" | "fixed";

export type Coords = {
  x: number;
  y: number;
};

export type Dimensions = {
  width: number;
  height: number;
};

export interface MiddlewareOptions {
  placement?: Placement;
  strategy?: Strategy;
  [key: string]: any;
}
