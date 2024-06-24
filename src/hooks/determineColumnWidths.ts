import { IResponsiveConductorSchema } from "../IResponsiveConductor";
const DEBUG = true;

/**
 * Helper function to determine if the schemas have any errors in their input for Debug mode
 * @param schemas The schemas for the controls
 */
function determineColumnWidthsDebugs(
  contentWidth: number,
  schemas: IResponsiveConductorSchema[]
): void {
  if (!DEBUG) {
    // If not in debug mode, return early
    return;
  }

  // Check if the shrinkPriority is in consecutive order
  const sortedShrinkPriorities = schemas
    .map((schema) => schema.shrinkPriority)
    .sort((a, b) => a - b);
  for (let i = 0; i < sortedShrinkPriorities.length - 1; i++) {
    if (sortedShrinkPriorities[i] + 1 !== sortedShrinkPriorities[i + 1]) {
      throw new Error(
        "[ResponsiveConductor] You must have consecutive shrinkPriorities, input error!"
      );
    }
  }

  // Check if the sum of minWidths is greater than the contentWidth
  const sumOfTheirMinWidths = schemas.reduce(
    (acc, child) => acc + child.minWidth,
    0
  );

  if (sumOfTheirMinWidths > contentWidth) {
    throw new Error(
      "[ResponsiveConductor] You cannot have minWidths larger than the contentSize, overflow expected!"
    );
  }

  // Check if any of the schemas have a minWidth larger than maxWidth
  schemas.some((schema) => {
    if (schema.minWidth > schema.maxWidth) {
      throw new Error(
        "[ResponsiveConductor] You cannot have the schema.minWidth larger than the schema.maxWidth, input error!"
      );
    }
  });

  // Check if any of the schemas have the same shrinkPriority
  const shrinkPrioritySet = new Set();
  schemas.some((schema) => {
    if (shrinkPrioritySet.has(schema.shrinkPriority)) {
      throw new Error(
        "[ResponsiveConductor] You cannot have the same shrinkPriority for multiple schemas, input error!"
      );
    }
    shrinkPrioritySet.add(schema.shrinkPriority);
  });

  // Check if any of the schemas have the same key
  const keySet = new Set();
  schemas.some((schema) => {
    if (keySet.has(schema.key)) {
      throw new Error(
        "[ResponsiveConductor] You cannot have the same key for multiple schemas, input error!"
      );
    }
    keySet.add(schema.key);
  });
}

/**
 * Function to determine content column widths based on provided schemas and available width
 *
 * This is a greedy algorithm that attempts to distribute the available width to the schemas based on their priority and constraints.
 * The algorithm first calculates the minimum width required by all schemas and ensures that the content width is greater than or equal to this sum.
 * If the content width is greater than the sum of maximum widths, the algorithm distributes the extra space proportionally among schemas that are allowed to grow beyond max width.
 * If the content width is less than the sum of maximum widths, the algorithm distributes the remaining space among schemas based on their minimum and maximum widths.
 * If the content width is less than the sum of minimum widths, the algorithm returns the minimum widths for all schemas.
 *
 * Time Complexity: O(nlogn)
 * Space Complexity: O(n)
 * @param contentWidth The available width for the controls
 * @param schemas The schemas for the controls
 * @returns An array of numbers for the column widths
 */
export function determineColumnWidths(
  contentWidth: number,
  schemas: IResponsiveConductorSchema[]
): number[] {
  // Early return if there are no schemas
  if (schemas.length === 0) {
    return [];
  }

  if (DEBUG) {
    determineColumnWidthsDebugs(contentWidth, schemas);
  }

  // Initialize widthMap object to store calculated widths mapped by unique keys
  const widthMap: { [key: string]: number } = {};

  // Separate schemas into visible and hidden based on the isAllowedToHide flag
  const visibleSchemas: IResponsiveConductorSchema[] = [];
  const hiddenSchemas: IResponsiveConductorSchema[] = [];

  // Iterate through schemas and classify them as visible or hidden
  for (const schema of schemas) {
    if (schema.isAllowedToHide) {
      hiddenSchemas.push(schema); // Add to hiddenSchemas if it can be hidden
    } else {
      visibleSchemas.push(schema); // Add to visibleSchemas if it cannot be hidden
    }
  }

  // Sort schemas by shrinkPriority (ascending, lower numbers are higher priority)
  visibleSchemas.sort((a, b) => a.shrinkPriority - b.shrinkPriority);
  hiddenSchemas.sort((a, b) => a.shrinkPriority - b.shrinkPriority);

  // Calculate initial widths for visible schemas based on their maxWidth
  let initialWidths = visibleSchemas.map((schema) => schema.maxWidth);

  // Calculate remaining content width after accounting for initial widths
  const totalInitialWidths = initialWidths.reduce(
    (acc, width) => acc + width,
    0
  );
  let remainingContentWidth = contentWidth - totalInitialWidths;

  // If the total initial width exceeds available content width, shrink elements
  // The backwards loop ensures that elements with higher indices, which are typically less critical
  // are shrunk first. This preserves the widths of higher-priority elements as much as possible.
  if (remainingContentWidth < 0) {
    for (
      let i = visibleSchemas.length - 1;
      i >= 0 && remainingContentWidth < 0;
      i--
    ) {
      const schema = visibleSchemas[i];

      //This represents the maximum amount by which we can shrink this element.
      const excessWidth = initialWidths[i] - schema.minWidth;

      // The smaller value between the negative of the remaining content width (the amount we need to reduce to fit within the content width) and the excessWidth.
      // This ensures we do not shrink the element below its minimum width or reduce more than necessary to fit within the content width.
      const reduceBy = Math.min(-remainingContentWidth, excessWidth);

      // We subtract reduceBy from the current width of the element.
      initialWidths[i] -= reduceBy;

      // We add reduceBy to the remainingContentWidth, effectively reducing the negative deficit
      // by the amount we have shrunk the element.
      remainingContentWidth += reduceBy;
    }
  }

  // Attempt to reintroduce hidden elements if there is enough remaining content width
  if (remainingContentWidth > 0) {
    for (const hidden of hiddenSchemas) {
      if (remainingContentWidth >= hidden.minWidth) {
        visibleSchemas.push(hidden); // Add hidden schema to visibleSchemas
        initialWidths.push(Math.min(hidden.maxWidth, remainingContentWidth)); // Set its width
        remainingContentWidth -= initialWidths[initialWidths.length - 1]; // Update remaining width
      }
    }
  }

  // Calculate the total minimum width required by all visible schemas
  const sumOfMinWidths = visibleSchemas.reduce(
    (acc, schema) => acc + schema.minWidth,
    0
  );

  // If the total minimum width exceeds available content width, return minimum widths for all
  if (sumOfMinWidths > contentWidth) {
    visibleSchemas.forEach((schema) => {
      widthMap[schema.key] = schema.minWidth; // Assign minimum widths
    });
    // Map final widths back to original keys to maintain the input order
    return schemas.map((schema) => widthMap[schema.key] ?? 0);
  }

  // Calculate the total maximum width required by all visible schemas
  const sumOfMaxWidths = visibleSchemas.reduce(
    (acc, schema) => acc + schema.maxWidth,
    0
  );

  // If the content width is greater than or equal to the sum of maximum widths
  if (contentWidth >= sumOfMaxWidths) {
    // Distribute the extra space proportionally among all visible schemas that are allowed to grow beyond max width
    const extraSpace = contentWidth - sumOfMaxWidths;
    const growableBeyondMaxSchemas = visibleSchemas.filter(
      (schema) => schema.isAllowedToGrowBeyondMaxWidth
    );
    const numGrowableElements = growableBeyondMaxSchemas.length;
    const additionalWidthPerElement = extraSpace / numGrowableElements;

    // Allocate the additional space to the schemas that are allowed to grow beyond max width
    visibleSchemas.forEach((schema, index) => {
      if (schema.isAllowedToGrowBeyondMaxWidth) {
        initialWidths[index] += additionalWidthPerElement;
      }
    });

    // Update the widthMap with the adjusted widths
    visibleSchemas.forEach((schema, i) => {
      widthMap[schema.key] = initialWidths[i];
    });

    // Map final widths back to original keys to maintain the input order
    return schemas.map((schema) => widthMap[schema.key] ?? 0);
  } else {
    // Distribute remaining content width after accounting for minimum widths
    remainingContentWidth = contentWidth - sumOfMinWidths;
    const calculatedWidths = visibleSchemas.map((schema) => schema.minWidth);

    // Allocate additional space to each schema based on remaining available space
    for (
      let i = 0;
      remainingContentWidth > 0 && i < visibleSchemas.length;
      i++
    ) {
      const schema = visibleSchemas[i];
      const currentWidth = calculatedWidths[i];
      if (currentWidth < schema.maxWidth) {
        const additionalSpace = Math.min(
          schema.maxWidth - currentWidth,
          remainingContentWidth
        );
        calculatedWidths[i] += additionalSpace; // Increase width
        remainingContentWidth -= additionalSpace; // Decrease remaining width
      }
    }

    // Update the widthMap with the adjusted widths
    visibleSchemas.forEach((schema, i) => {
      widthMap[schema.key] = calculatedWidths[i];
    });

    // Map final widths back to original keys to maintain the input order
    return schemas.map((schema) => widthMap[schema.key] ?? 0);
  }
}
