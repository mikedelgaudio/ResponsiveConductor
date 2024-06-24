import { Ref } from "preact";
import { useLayoutEffect, useState } from "preact/hooks";

/**
 * Determines the size of the list based on the width of the container.
 * Example: This is used to determine whether to render the small or large tile content size and the number of tiles per row.
 */
export function useContentWidth(rootRef: Ref<HTMLDivElement>): number {
  if (!rootRef?.current) {
    console.error("No rootRef");
  }

  const [size, setSize] = useState(
    rootRef?.current?.getBoundingClientRect().width
  );

  useLayoutEffect(() => {
    function updateSize() {
      setSize(rootRef?.current?.getBoundingClientRect().width);
    }

    window.addEventListener("resize", updateSize);
    updateSize();

    return () => window.removeEventListener("resize", updateSize);
  }, []);

  return size;
}
