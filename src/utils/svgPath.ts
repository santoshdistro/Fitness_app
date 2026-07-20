export type Point = { x: number; y: number };

export function smoothPath(points: Point[]): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M${points[0].x},${points[0].y}`;

  let d = `M${points[0].x},${points[0].y} `;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const midX = (prev.x + curr.x) / 2;
    const midY = (prev.y + curr.y) / 2;
    d += `Q${prev.x},${prev.y} ${midX},${midY} `;
  }
  const last = points[points.length - 1];
  d += `L${last.x},${last.y}`;
  return d;
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number): Point {
  const angleRad = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(angleRad), y: cy - r * Math.sin(angleRad) };
}

/** Semicircle gauge arc (180deg at left, 0deg at right, sweeping over the top). */
export function gaugeArcPath(percent: number): string {
  const clamped = Math.max(0, Math.min(1, percent));
  const start = polarToCartesian(50, 50, 40, 180);
  const end = polarToCartesian(50, 50, 40, 180 - clamped * 180);
  return `M ${start.x} ${start.y} A 40 40 0 0 1 ${end.x} ${end.y}`;
}
