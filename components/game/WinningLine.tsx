/** Draws a stroke through the three winning cells. The grid is symmetric, so cell centres sit at 1/6, 1/2 and 5/6. */
export function WinningLine({ cells }: { cells: number[] }) {
  const centre = (i: number) => ({ x: (i % 3) * 100 + 50, y: Math.floor(i / 3) * 100 + 50 });
  const a = centre(cells[0]);
  const b = centre(cells[cells.length - 1]);
  const dx = (b.x - a.x) * 0.16;
  const dy = (b.y - a.y) * 0.16;

  return (
    <svg viewBox="0 0 300 300" aria-hidden="true" className="mb-win-line pointer-events-none absolute">
      <line
        className="win-line"
        pathLength={1}
        x1={a.x - dx}
        y1={a.y - dy}
        x2={b.x + dx}
        y2={b.y + dy}
        stroke="var(--mb-win-ink)"
        strokeWidth={9}
        strokeLinecap="round"
      />
    </svg>
  );
}
