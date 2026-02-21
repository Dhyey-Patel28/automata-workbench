// frontend/src/lib/layout.ts
import type { Node } from "./backend";

export type Point = { x: number; y: number };

export type ArrowLayoutOptions = {
  /**
   * For bidirectional edges between the same pair of states:
   *  - 0  = straight line
   *  - +1 = curve to one side
   *  - -1 = curve to the opposite side
   */
  side?: -1 | 0 | 1;

  /**
   * Vertical offset for self-loops.
   * Default: 30.
   */
  selfLoopOffset?: number;

  /**
   * How "curvy" non-self edges are (for side ≠ 0).
   * This is a multiplier on the distance between states.
   * Default: 0.2.
   */
  arcHeightFactor?: number;
};

/**
 * Visual radius used everywhere in the app:
 * circle radius grows with the length of the state's name.
 */
export function getVisualRadius(
  node: Pick<Node, "radius" | "name">,
): number {
  return 2 * node.name.length + node.radius;
}

/**
 * Compute arrow polyline points for a transition between two nodes.
 *
 * Returns [x1, y1, x2, y2, x3, y3]:
 *  - (x1, y1) = start point (just outside the "from" node)
 *  - (x2, y2) = control / label point
 *  - (x3, y3) = end point (just outside the "to" node)
 *
 * If options.side === 0:
 *    straight line (control is the midpoint on the segment).
 * If options.side is ±1:
 *    slightly curved arc away from the straight line.
 */
export function computeArrowPoints(
  from: Pick<Node, "id" | "x" | "y" | "radius" | "name">,
  to: Pick<Node, "id" | "x" | "y" | "radius" | "name">,
  options?: ArrowLayoutOptions,
): number[] {
  const {
    side = 0,
    selfLoopOffset = 30,
    arcHeightFactor = 0.3,
  } = options || {};

  const fromR = getVisualRadius(from);
  const toR = getVisualRadius(to);

  // ----- Self-loop: draw above the node -----
  if (from.id === to.id) {
    const x = from.x;
    const y = from.y;
    const radius = fromR;
    const offset = selfLoopOffset;

    return [
      x - radius / 1.5,
      y - radius, // start (left)
      x,
      y - radius - 2 * offset, // control (top)
      x + radius / 1.5,
      y - radius, // end (right)
    ];
  }

  // ----- Regular edge -----
  let dx = to.x - from.x;
  let dy = to.y - from.y;
  let dist = Math.hypot(dx, dy);
  if (dist === 0) {
    dist = 1;
    dx = 1;
    dy = 0;
  }

  const ux = dx / dist;
  const uy = dy / dist;

  // Start / end on the edge of each state circle
  const startX = from.x + ux * fromR;
  const startY = from.y + uy * fromR;
  const endX = to.x - ux * toR;
  const endY = to.y - uy * toR;

  // Straight-line midpoint
  const midX = (startX + endX) / 2;
  const midY = (startY + endY) / 2;

  // If side === 0 → straight edge (control is geometric midpoint)
  if (side === 0) {
    return [startX, startY, midX, midY, endX, endY];
  }

  // side ±1 → slightly curved (for bidirectional edges)
  const perpX = -uy;
  const perpY = ux;
  const MAX_ARC_HEIGHT = 40;
  const rawOffset = arcHeightFactor * dist;
  const offsetMag = Math.min(Math.abs(rawOffset), MAX_ARC_HEIGHT);
  const signedOffset = offsetMag * (side > 0 ? 1 : -1);

  const ctrlX = midX + perpX * signedOffset;
  const ctrlY = midY + perpY * signedOffset;

  return [startX, startY, ctrlX, ctrlY, endX, endY];
}
