import { Ref } from "preact";
import { JSX } from "preact/jsx-runtime";

export interface IResponsiveConductorSchema {
  /** Unique identifier for each element's schema */
  key: string;
  /** The minimum width the element should occupy before collapsing. */
  minWidth: number;
  /** The maximum width of the element */
  maxWidth: number;
  /** A number indicating the order in which elements disappear. Higher numbers disappear first. */
  shrinkPriority: number;
  /** Determines if the element is allowed to hide once the minWidth is reached and other elements have higher priority */
  isAllowedToHide?: boolean;
  /** Determines if the element is allowed to grow beyond maxWidth if space allows */
  isAllowedToGrowBeyondMaxWidth?: boolean;
}

export interface IResponsiveConductorChildren {
  /** The child element */
  element: JSX.Element;
  /** The schema for the responsive conductor (instructions) */
  schema: IResponsiveConductorSchema;
}

export interface IResponsiveConductorProps {
  /** The children to render */
  children: IResponsiveConductorChildren[];
  /** The ref of the root element */
  rootRef: Ref<HTMLDivElement>;
}
