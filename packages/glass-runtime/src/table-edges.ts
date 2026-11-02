type Bounds = {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
};

export type TableGridEdge = {
  cell: HTMLTableCellElement;
  rect: DOMRect;
  strips: Bounds[];
};

const intersects = (a: Bounds, b: Bounds): boolean =>
  a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;

const bounds = (left: number, top: number, right: number, bottom: number): Bounds => ({
  left,
  top,
  right,
  bottom,
  width: Math.max(right - left, 0),
  height: Math.max(bottom - top, 0),
});

const rectWithBounds = (original: DOMRect, top: number, bottom: number): DOMRect => ({
  ...bounds(original.left, top, original.right, bottom),
  x: original.left,
  y: top,
  toJSON: () => ({}),
});

/** A table's CSSOM box can include its caption, which is outside the plate. */
export function getTableOuterRect(table: HTMLTableElement, rect: DOMRect): DOMRect {
  const caption = table.caption;
  if (!caption || table.rows.length === 0) return rect;
  const captionRect = caption.getBoundingClientRect();
  if (captionRect.width <= 0 || captionRect.height <= 0) return rect;

  let first: DOMRect | undefined;
  let last: DOMRect | undefined;
  for (let index = 0; index < table.rows.length && !first; index += 1) {
    const rowRect = table.rows[index]?.getBoundingClientRect();
    if (rowRect && rowRect.width > 0 && rowRect.height > 0) first = rowRect;
  }
  for (let index = table.rows.length - 1; index >= 0 && !last; index -= 1) {
    const rowRect = table.rows[index]?.getBoundingClientRect();
    if (rowRect && rowRect.width > 0 && rowRect.height > 0) last = rowRect;
  }
  if (!first || !last) return rect;

  let top = rect.top;
  let bottom = rect.bottom;
  if (captionRect.bottom <= first.top && captionRect.bottom > rect.top) top = first.top;
  if (captionRect.top >= last.bottom && captionRect.top < rect.bottom) bottom = last.bottom;
  return top < bottom && (top !== rect.top || bottom !== rect.bottom)
    ? rectWithBounds(rect, top, bottom)
    : rect;
}

/**
 * Use the borders the table actually paints, including RTL and spanning cells.
 * Only visible cells get style reads and draw calls; no cell gains a backdrop
 * filter or becomes a separate renderer/occlusion candidate.
 */
export function getTableGridEdges(
  table: HTMLTableElement,
  outer: DOMRect,
  clip: Bounds,
  viewport: Bounds,
  edgeWidth: number,
  view: Window,
): TableGridEdge[] {
  const visible = bounds(
    Math.max(outer.left, clip.left, viewport.left),
    Math.max(outer.top, clip.top, viewport.top),
    Math.min(outer.right, clip.right, viewport.right),
    Math.min(outer.bottom, clip.bottom, viewport.bottom),
  );
  if (visible.width <= 0 || visible.height <= 0) return [];

  const result: TableGridEdge[] = [];
  const reach = Math.max(edgeWidth + 1.5, 2);
  for (const row of table.rows) {
    const rowRect = row.getBoundingClientRect();
    const rowVisible = intersects(rowRect, visible);
    for (const cell of row.cells) {
      // A row-spanning cell can extend into view from an offscreen row.
      if (!rowVisible && cell.rowSpan === 1) continue;
      const rect = cell.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0 || !intersects(rect, visible)) continue;
      const style = view.getComputedStyle(cell);
      if (style.display === 'none' || style.visibility === 'hidden') continue;
      const hasBorder = (width: string, borderStyle: string, color: string): boolean =>
        Number.parseFloat(width) > 0 &&
        borderStyle !== 'none' &&
        borderStyle !== 'hidden' &&
        color !== 'transparent';
      const left =
        rect.left > outer.left + 0.5 &&
        hasBorder(style.borderLeftWidth, style.borderLeftStyle, style.borderLeftColor);
      const right =
        rect.right < outer.right - 0.5 &&
        hasBorder(style.borderRightWidth, style.borderRightStyle, style.borderRightColor);
      const top =
        rect.top > outer.top + 0.5 &&
        hasBorder(style.borderTopWidth, style.borderTopStyle, style.borderTopColor);
      const bottom =
        rect.bottom < outer.bottom - 0.5 &&
        hasBorder(style.borderBottomWidth, style.borderBottomStyle, style.borderBottomColor);
      const strips: Bounds[] = [];
      if (left) strips.push(bounds(rect.left, rect.top, rect.left + reach, rect.bottom));
      if (right) strips.push(bounds(rect.right - reach, rect.top, rect.right, rect.bottom));
      // Avoid painting the same pixels twice where two borders of a cell meet.
      const horizontalLeft = rect.left + (left ? reach : 0);
      const horizontalRight = rect.right - (right ? reach : 0);
      if (top) strips.push(bounds(horizontalLeft, rect.top, horizontalRight, rect.top + reach));
      if (bottom) {
        strips.push(bounds(horizontalLeft, rect.bottom - reach, horizontalRight, rect.bottom));
      }
      const clipped = strips
        .map((strip) =>
          bounds(
            Math.max(strip.left, visible.left),
            Math.max(strip.top, visible.top),
            Math.min(strip.right, visible.right),
            Math.min(strip.bottom, visible.bottom),
          ),
        )
        .filter((strip) => strip.width > 0 && strip.height > 0);
      if (clipped.length > 0) result.push({ cell, rect, strips: clipped });
    }
  }
  return result;
}
