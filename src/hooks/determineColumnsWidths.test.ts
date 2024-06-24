import { IResponsiveConductorSchema } from "../IResponsiveConductor";
import { determineColumnWidths } from "./determineColumnWidths";

describe("determineColumnWidths", () => {
  test("should handle no schemas", () => {
    expect(determineColumnWidths(1000, [])).toEqual([]);
  });

  test("should handle single schema fitting within content width", () => {
    const schemas: IResponsiveConductorSchema[] = [
      { key: "single", minWidth: 50, maxWidth: 100, shrinkPriority: 1 },
    ];
    expect(determineColumnWidths(1000, schemas)).toEqual([100]);
  });

  test("should handle single schema exceeding content width", () => {
    const schemas: IResponsiveConductorSchema[] = [
      { key: "single", minWidth: 50, maxWidth: 200, shrinkPriority: 1 },
    ];
    expect(determineColumnWidths(100, schemas)).toEqual([100]);
  });

  test("should handle multiple schemas within content width", () => {
    const schemas: IResponsiveConductorSchema[] = [
      { key: "a", minWidth: 50, maxWidth: 100, shrinkPriority: 1 },
      { key: "b", minWidth: 100, maxWidth: 200, shrinkPriority: 2 },
    ];
    expect(determineColumnWidths(500, schemas)).toEqual([100, 200]);
  });

  test("should handle multiple schemas exceeding content width", () => {
    const schemas: IResponsiveConductorSchema[] = [
      { key: "a", minWidth: 50, maxWidth: 100, shrinkPriority: 1 },
      { key: "b", minWidth: 100, maxWidth: 200, shrinkPriority: 2 },
    ];
    // Content width is 100, so we should only allocate 50 to the first schema and 100 to the second since we're out of space
    // This is a forceful overflow scenario
    expect(determineColumnWidths(100, schemas)).toEqual([50, 100]);
  });

  test("should handle schemas with isAllowedToHide and hide if needed", () => {
    const schemas: IResponsiveConductorSchema[] = [
      { key: "a", minWidth: 50, maxWidth: 100, shrinkPriority: 1 },
      {
        key: "b",
        minWidth: 100,
        maxWidth: 200,
        shrinkPriority: 2,
        isAllowedToHide: true,
      },
    ];
    expect(determineColumnWidths(60, schemas)).toEqual([60, 0]);
  });

  test("should reintroduce hidden schemas if space allows", () => {
    const schemas: IResponsiveConductorSchema[] = [
      { key: "a", minWidth: 50, maxWidth: 100, shrinkPriority: 1 },
      {
        key: "b",
        minWidth: 100,
        maxWidth: 200,
        shrinkPriority: 2,
        isAllowedToHide: true,
      },
    ];
    expect(determineColumnWidths(300, schemas)).toEqual([100, 200]);
  });

  test("should allocate extra space to elements with isAllowedToGrowBeyondMaxWidth", () => {
    const schemas: IResponsiveConductorSchema[] = [
      { key: "a", minWidth: 50, maxWidth: 100, shrinkPriority: 1 },
      {
        key: "b",
        minWidth: 100,
        maxWidth: 200,
        shrinkPriority: 2,
        isAllowedToGrowBeyondMaxWidth: true,
      },
    ];
    expect(determineColumnWidths(400, schemas)).toEqual([100, 300]);
  });

  test("should not grow elements beyond maxWidth if not allowed", () => {
    const schemas: IResponsiveConductorSchema[] = [
      { key: "a", minWidth: 50, maxWidth: 100, shrinkPriority: 1 },
      { key: "b", minWidth: 100, maxWidth: 200, shrinkPriority: 2 },
    ];
    expect(determineColumnWidths(400, schemas)).toEqual([100, 200]);
  });

  test("should handle complex cases with hiding and growing", () => {
    const schemas: IResponsiveConductorSchema[] = [
      { key: "a", minWidth: 50, maxWidth: 100, shrinkPriority: 1 },
      {
        key: "b",
        minWidth: 100,
        maxWidth: 200,
        shrinkPriority: 2,
        isAllowedToHide: true,
      },
      {
        key: "c",
        minWidth: 50,
        maxWidth: 150,
        shrinkPriority: 3,
        isAllowedToGrowBeyondMaxWidth: true,
      },
      { key: "d", minWidth: 50, maxWidth: 100, shrinkPriority: 4 },
    ];
    expect(determineColumnWidths(500, schemas)).toEqual([100, 150, 150, 100]);
  });

  test("should not reintroduce hidden elements if not enough space", () => {
    const schemas: IResponsiveConductorSchema[] = [
      { key: "a", minWidth: 50, maxWidth: 100, shrinkPriority: 1 },
      {
        key: "b",
        minWidth: 100,
        maxWidth: 200,
        shrinkPriority: 2,
        isAllowedToHide: true,
      },
      {
        key: "c",
        minWidth: 50,
        maxWidth: 150,
        shrinkPriority: 3,
        isAllowedToHide: true,
      },
    ];
    expect(determineColumnWidths(150, schemas)).toEqual([100, 0, 50]);
  });

  test("should handle schemas with static size", () => {
    const schemas: IResponsiveConductorSchema[] = [
      { key: "static", minWidth: 50, maxWidth: 50, shrinkPriority: 1 },
      {
        key: "flexible",
        minWidth: 100,
        maxWidth: 200,
        shrinkPriority: 2,
        isAllowedToGrowBeyondMaxWidth: true,
      },
    ];
    expect(determineColumnWidths(500, schemas)).toEqual([50, 450]);
  });
});
