import { afterEach, describe, expect, it, vi } from 'vitest';
import { getTableGridEdges, getTableOuterRect } from './table-edges';

const rect = (left: number, top: number, width: number, height: number): DOMRect => ({
  left,
  top,
  width,
  height,
  right: left + width,
  bottom: top + height,
  x: left,
  y: top,
  toJSON: () => ({}),
});

const place = (element: Element, geometry: DOMRect): void => {
  vi.spyOn(element, 'getBoundingClientRect').mockReturnValue(geometry);
};

describe('table edge geometry', () => {
  afterEach(() => {
    document.body.replaceChildren();
    vi.restoreAllMocks();
  });

  it('keeps a caption outside the table silhouette', () => {
    const table = document.createElement('table');
    document.body.append(table);
    const caption = table.createCaption();
    const row = table.insertRow();
    place(caption, rect(20, 20, 200, 20));
    place(row, rect(20, 48, 200, 40));

    const outer = getTableOuterRect(table, rect(20, 20, 200, 68));
    expect([outer.left, outer.top, outer.right, outer.bottom]).toEqual([20, 48, 220, 88]);
    // Some browsers already exclude the caption from this rectangle.
    expect(getTableOuterRect(table, rect(20, 48, 200, 40)).top).toBe(48);
  });

  it('draws only existing inner borders, clipped to the viewport in either direction', () => {
    const table = document.createElement('table');
    document.body.append(table);
    const firstRow = table.insertRow();
    const secondRow = table.insertRow();
    const topLeft = firstRow.insertCell();
    const topRight = firstRow.insertCell();
    const bottomLeft = secondRow.insertCell();
    const bottomRight = secondRow.insertCell();
    place(firstRow, rect(0, 0, 200, 40));
    place(secondRow, rect(0, 40, 200, 40));
    place(topLeft, rect(0, 0, 100, 40));
    place(topRight, rect(100, 0, 100, 40));
    place(bottomLeft, rect(0, 40, 100, 40));
    place(bottomRight, rect(100, 40, 100, 40));
    topLeft.style.borderRight = '1px solid black';
    topLeft.style.borderBottom = '1px solid black';
    topRight.style.borderBottom = '1px solid black';
    bottomLeft.style.borderRight = '1px solid black';
    // The perimeter is owned by the table, even if a cell paints a border there.
    bottomRight.style.borderRight = '1px solid black';

    const outer = rect(0, 0, 200, 80);
    const edges = getTableGridEdges(table, outer, outer, rect(50, 10, 100, 60), 1, window);
    expect(edges).toHaveLength(3);
    expect(edges.map(({ cell, strips }) => [cell, strips.length])).toEqual([
      [topLeft, 2],
      [topRight, 1],
      [bottomLeft, 1],
    ]);
    expect(edges.flatMap(({ strips }) => strips).every((strip) => strip.left >= 50)).toBe(true);
    expect(edges.flatMap(({ strips }) => strips).every((strip) => strip.right <= 150)).toBe(true);

    // Physical left borders are also honored, as with RTL inline-end.
    topLeft.style.borderRight = '';
    topRight.style.borderLeft = '1px solid black';
    const rtl = getTableGridEdges(table, outer, outer, outer, 1, window);
    expect(rtl.find(({ cell }) => cell === topRight)?.strips).toHaveLength(2);
  });

  it('keeps a spanning cell visible when its originating row is offscreen', () => {
    const table = document.createElement('table');
    document.body.append(table);
    const firstRow = table.insertRow();
    const secondRow = table.insertRow();
    const spanning = firstRow.insertCell();
    spanning.rowSpan = 2;
    spanning.style.borderRight = '1px solid black';
    place(firstRow, rect(0, 0, 200, 40));
    place(secondRow, rect(0, 40, 200, 40));
    place(spanning, rect(0, 0, 100, 80));
    const outer = rect(0, 0, 200, 80);

    const edges = getTableGridEdges(table, outer, outer, rect(0, 45, 200, 30), 1, window);
    expect(edges).toHaveLength(1);
    expect(edges[0]?.cell).toBe(spanning);
    expect(edges[0]?.strips[0]).toMatchObject({ top: 45, bottom: 75 });
  });

});
