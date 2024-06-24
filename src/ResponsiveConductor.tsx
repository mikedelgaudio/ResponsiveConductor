import { Fragment, JSX } from "preact";
import { useCallback, useMemo } from "preact/hooks";
import { IResponsiveConductorProps } from "./IResponsiveConductor";
import { determineColumnWidths } from "./hooks/determineColumnWidths";
import { useContentWidth } from "./useContentWidth";

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
    const columnsSizes = determineColumnWidths(contentWidth, schemas);

    const gridTemplateColumnsOutput: string[] = new Array(
      columnsSizes.length
    ).fill("");

    const elements = children.map((child, childIndex) => {
      const { element } = child;

      const columnSize = columnsSizes[childIndex];

      if (!columnSize) {
        return;
      }

      // Set the column size in the outputColumns array
      gridTemplateColumnsOutput[childIndex] = `${columnSize}px`;

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
          <i>Current grid-template-columns:</i>{" "}
          {gridTemplateColumnsOutput.join(" ")}
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `${gridTemplateColumnsOutput.join(" ")}`,
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
