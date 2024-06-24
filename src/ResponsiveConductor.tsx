import { Fragment, JSX } from "preact";
import { useCallback, useMemo } from "preact/hooks";
import { IResponsiveConductorProps } from "./IResponsiveConductor";
import { determineColumnWidths } from "./hooks/determineColumnWidths";
import { useContentWidth } from "./useContentWidth";

const DEBUG = true;
/**
 * The responsive conductor is a component that manages the visibility of children based on the available space.
 *
 * The conductor will hide children based on the available space and the priority of the children.
 * The children should be responsible for their own width and behaviors at certain breakpoints
 */
export function ResponsiveConductor(
  props: IResponsiveConductorProps
): JSX.Element {
  const { children, rootRef } = props;

  /** The available space for the children */
  const contentWidth = useContentWidth(rootRef);

  const schemas = useMemo(() => {
    return children.map((child) => child.schema);
  }, [children]);

  const renderChildren = useCallback(() => {
    const sumOfTheirMinWidths = children.reduce(
      (acc, child) => acc + child.schema.minWidth,
      0
    );

    if (DEBUG && sumOfTheirMinWidths > contentWidth) {
      throw new Error(
        "You cannot have minWidths larger than the contentSize, overflow expected!"
      );
    }

    const columnSizesSortedFromHighestToLowest = determineColumnWidths(
      contentWidth,
      schemas
    );

    const outputColumns: string[] = new Array(
      columnSizesSortedFromHighestToLowest.length
    ).fill("");

    const elements = children.map((child, childIndex) => {
      const { element, schema } = child;
      const { shrinkPriority, minWidth, isAllowedToHide } = schema;

      // We need to map the columnSizesSortedFromHighestToLowest to the correct array position in the outputColumns array
      // The outputColumns array is the final array that contains the width of each column in the grid, matching the order of the children
      // TODO Remove
      const columnSize = columnSizesSortedFromHighestToLowest.find(
        (_, index) => {
          return children[index].schema.shrinkPriority === shrinkPriority;
        }
      );

      if (!columnSize || (columnSize < minWidth && isAllowedToHide)) {
        return;
      }

      // Set the column size in the outputColumns array
      outputColumns[childIndex] = `${columnSize}px`;

      return (
        <Fragment key={`RESPONSIVE_CONDUCTOR_${childIndex}`}>
          {element}
        </Fragment>
      );
    });

    return (
      <Fragment>
        <h2 class="text-3xl">Current conductor width: {contentWidth}px</h2>
        <h3>
          <i>Current grid-template-columns:</i> {outputColumns.join(" ")}
        </h3>
        <h4 style={{ background: "red", color: "white", fontWeight: "bold" }}>
          {sumOfTheirMinWidths > contentWidth
            ? "EXPECTED OVERFLOW DETECTED! You must adjust minWidths!"
            : ""}
        </h4>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `${outputColumns.join(" ")}`,
            background: "lightblue",
            gridTemplateRows: "1fr",
            paddingBlock: "1rem",
            alignItems: "center",
            overflow: "hidden",
          }}
        >
          {elements}
        </div>
      </Fragment>
    );
  }, [children, contentWidth]);

  return renderChildren();
}
