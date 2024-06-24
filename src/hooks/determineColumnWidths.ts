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
  const shrinkPriorities = schemas.map((schema) => schema.shrinkPriority);
  shrinkPriorities.sort((a, b) => a - b);
  for (let i = 0; i < shrinkPriorities.length - 1; i++) {
    if (shrinkPriorities[i] + 1 !== shrinkPriorities[i + 1]) {
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
  // Initialize finalSizes object to store calculated widths mapped by unique keys
  const finalSizes: { [key: string]: number } = {};

  // If there are no schemas, return an empty array
  if (schemas.length === 0) {
    return [];
  }

  // Check for errors in the schemas if in DEBUG mode
  if (DEBUG) {
    determineColumnWidthsDebugs(contentWidth, schemas);
  }

  // Separate schemas into visible and hidden based on the isAllowedToHide flag
  const visibleSchemas: IResponsiveConductorSchema[] = [];
  const hiddenSchemas: IResponsiveConductorSchema[] = [];
  for (const schema of schemas) {
    if (schema.isAllowedToHide) {
      hiddenSchemas.push(schema);
    } else {
      visibleSchemas.push(schema);
    }
  }

  // Sort schemas by priority (ascending, lower numbers are higher priority) O(nlogn)
  visibleSchemas.sort((a, b) => a.shrinkPriority - b.shrinkPriority);
  hiddenSchemas.sort((a, b) => a.shrinkPriority - b.shrinkPriority);

  // Calculate initial widths for visible schemas based on max width O(n)
  let initialWidths = visibleSchemas.map((schema) => schema.maxWidth);
  const totalInitialWidth = initialWidths.reduce(
    (acc, width) => acc + width,
    0
  );
  let remainingContentWidth = contentWidth - totalInitialWidth;

  // Shrink elements based on priority if needed to fit within content width O(n)
  if (remainingContentWidth < 0) {
    for (
      let i = visibleSchemas.length - 1;
      i >= 0 && remainingContentWidth < 0;
      i--
    ) {
      const schema = visibleSchemas[i];
      const excessWidth = initialWidths[i] - schema.minWidth;
      const reduceBy = Math.min(-remainingContentWidth, excessWidth);
      initialWidths[i] -= reduceBy;
      remainingContentWidth += reduceBy;
    }
  }

  // Attempt to reintroduce hidden elements if there is enough remaining content width O(n)
  if (remainingContentWidth > 0) {
    for (const hidden of hiddenSchemas) {
      if (remainingContentWidth >= hidden.minWidth) {
        visibleSchemas.push(hidden);
        initialWidths.push(Math.min(hidden.maxWidth, remainingContentWidth));
        remainingContentWidth -= initialWidths[initialWidths.length - 1];
      }
    }
  }

  // Calculate the total minimum width required by all visible schemas O(n)
  const sumOfMinWidths = visibleSchemas.reduce(
    (acc, schema) => acc + schema.minWidth,
    0
  );

  // If the total minimum width exceeds available content width, return minimum widths for all O(n)
  if (sumOfMinWidths > contentWidth) {
    visibleSchemas.forEach((schema) => {
      finalSizes[schema.key] = schema.minWidth;
    });
    return schemas.map((schema) => finalSizes[schema.key] ?? 0);
  }

  // Calculate the total maximum width required by all visible schemas O(n)
  const sumOfMaxWidths = visibleSchemas.reduce(
    (acc, schema) => acc + schema.maxWidth,
    0
  );

  // If the content width is greater than or equal to the sum of maximum widths
  if (contentWidth >= sumOfMaxWidths) {
    // Distribute the extra space proportionally among all visible schemas that are allowed to grow beyond max width O(n)
    const extraSpace = contentWidth - sumOfMaxWidths;
    const growableBeyondMaxSchemas = visibleSchemas.filter(
      (schema) => schema.isAllowedToGrowBeyondMaxWidth
    );
    const numGrowableElements = growableBeyondMaxSchemas.length;
    const additionalWidthPerElement = extraSpace / numGrowableElements;

    visibleSchemas.forEach((schema, index) => {
      if (schema.isAllowedToGrowBeyondMaxWidth) {
        initialWidths[index] += additionalWidthPerElement;
      }
    });

    // Update the finalSizes with the adjusted widths
    visibleSchemas.forEach((schema, i) => {
      finalSizes[schema.key] = initialWidths[i];
    });

    return schemas.map((schema) => finalSizes[schema.key] ?? 0);
  } else {
    // Distribute remaining content width after accounting for minimum widths
    remainingContentWidth = contentWidth - sumOfMinWidths;
    const finalWidths = visibleSchemas.map((schema) => schema.minWidth);

    // Allocate additional space to each schema based on remaining available space
    for (
      let i = 0;
      remainingContentWidth > 0 && i < visibleSchemas.length;
      i++
    ) {
      const schema = visibleSchemas[i];
      const currentWidth = finalWidths[i];
      if (currentWidth < schema.maxWidth) {
        const additionalSpace = Math.min(
          schema.maxWidth - currentWidth,
          remainingContentWidth
        );
        finalWidths[i] += additionalSpace;
        remainingContentWidth -= additionalSpace;
      }
    }

    // Map final widths back to original keys to maintain the input order
    visibleSchemas.forEach((schema, i) => {
      finalSizes[schema.key] = finalWidths[i];
    });

    // Return the widths mapped back to the original order using the unique keys
    return schemas.map((schema) => finalSizes[schema.key] ?? 0);
  }
}
