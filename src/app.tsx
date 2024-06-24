import { useRef } from "preact/hooks";
import { ResponsiveConductor } from "./ResponsiveConductor";

export function App() {
  const rootRef = useRef<HTMLDivElement>(null);

  const box1 = (
    <div
      style={{
        background: "cyan",
        width: "100%",
        whiteSpace: "nowrap",
      }}
    >
      <p style={{ fontSize: "1.25rem" }}>Add New</p>
    </div>
  );
  const box2 = (
    <div style={{ background: "orange", width: "100%" }}>
      <p style={{ fontSize: "1.25rem" }}>
        BreadcrumbBreadcrumbBreadBreadBreadBread
      </p>
    </div>
  );
  const box3 = (
    <div style={{ background: "lightgreen", width: "100%" }}>
      <p style={{ fontSize: "1.25rem" }}>Commands</p>
    </div>
  );
  const box5 = (
    <div style={{ background: "violet", width: "100%" }}>
      <p style={{ fontSize: "1.25rem" }}>Presence</p>
    </div>
  );
  const box6 = (
    <div style={{ background: "yellow", width: "100%" }}>
      <p style={{ fontSize: "1.25rem" }}>Copilot</p>
    </div>
  );

  const props = {
    rootRef,
    children: [
      {
        element: box1,
        schema: {
          key: "addNew",
          minWidth: 50,
          maxWidth: 50,
          shrinkPriority: 2,
        },
      },
      {
        element: box2,
        schema: {
          key: "breadcrumb",
          minWidth: 40,
          maxWidth: 500,
          shrinkPriority: 5,
          isAllowedToGrowBeyondMaxWidth: true,
        },
      },
      {
        element: box3,
        schema: {
          key: "commands",
          minWidth: 40,
          maxWidth: 500,
          shrinkPriority: 3,
          isAllowedToHide: true,
          isAllowedToGrowBeyondMaxWidth: true,
        },
      },
      {
        element: box5,
        schema: {
          key: "presence",
          minWidth: 50,
          maxWidth: 200,
          shrinkPriority: 4,
          isAllowedToHide: true,
          isAllowedToGrowBeyondMaxWidth: true,
        },
      },
      {
        element: box6,
        schema: {
          key: "copilot",
          minWidth: 50,
          maxWidth: 100,
          shrinkPriority: 1,
        },
      },
    ],
  };

  return (
    <div ref={rootRef}>
      <h1 class="text-3xl">ResponsiveConductor</h1>
      <h2 class="text-2xl">HeaderBar</h2>
      <ResponsiveConductor {...props} />
      <h2 class="text-2xl">ContentBar</h2>
      <ResponsiveConductor {...props} />
    </div>
  );
}
