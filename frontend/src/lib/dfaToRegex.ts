// frontend/src/lib/dfaToRegex.ts
// Convert a drawn DFA/NFA in the editor into an equivalent regular expression
// using the standard state-elimination (GNFA) algorithm.
//
// Output syntax is JFLAP-style:
//   - union: "+"      e.g., (a+b)*
//   - concatenation:  juxtaposition, e.g., ab*, (a+b)c
//   - Kleene star:    "*"
//   - epsilon:        "ε"
//   - empty language: "∅"
//
// This works for any finite automaton you draw in the editor (not just strict DFAs).
// Multiple start/accept states and epsilon transitions are allowed; we add a
// new global start and accept state internally.

import type { Node, Arrow } from "./backend";

export type DfaToRegexResult = {
  regex: string;
};

/** Normalise a transition label the user typed on an arrow. */
function normalizeLabel(label: string): string {
  const trimmed = label.trim();

  // epsilon-like labels
  if (
    trimmed === "" ||
    trimmed === "ε" ||
    trimmed.toLowerCase() === "epsilon" ||
    trimmed.toLowerCase() === "eps"
  ) {
    return "ε";
  }

  // Prevent using generated names like "transition 1" etc.
  if (/^transition\b/i.test(trimmed)) {
    throw new Error(
      `Transition "${trimmed}" must be renamed to an input symbol before converting to a regular expression.`,
    );
  }

  return trimmed;
}

function isEmpty(re: string): boolean {
  return re === "";
}

function isEpsilon(re: string): boolean {
  return re === "ε";
}

/** a + b (union), using "+" like JFLAP. */
function unionRe(a: string, b: string): string {
  if (isEmpty(a)) return b;
  if (isEmpty(b)) return a;
  if (a === b) return a;
  return `${a}+${b}`;
}

/** Concatenation ab, respecting ε and ∅. */
function concat2(a: string, b: string): string {
  if (isEmpty(a) || isEmpty(b)) return "";
  if (isEpsilon(a)) return b;
  if (isEpsilon(b)) return a;
  return `${a}${b}`;
}

/** Concatenation of three pieces a (b) c. */
function concat3(a: string, b: string, c: string): string {
  return concat2(concat2(a, b), c);
}

/** Kleene star R* with a bit of simplification. */
function starRe(r: string): string {
  if (isEmpty(r) || isEpsilon(r)) {
    // ∅* = ε, ε* = ε
    return "ε";
  }
  // (R*)*  ==>  R*
  if (r.endsWith("*")) return r;

  // If r has a "+" (union) inside, wrap in parentheses like (a+b)*
  const needsParens = r.includes("+") && !(r.startsWith("(") && r.endsWith(")"));
  const body = needsParens ? `(${r})` : r;
  return `${body}*`;
}

/** Strip a single layer of outer parentheses when they wrap the whole expr. */
function stripOuterParens(re: string): string {
  while (re.length > 1 && re.startsWith("(") && re.endsWith(")")) {
    let depth = 0;
    let wrapsAll = true;
    for (let i = 0; i < re.length; i++) {
      const ch = re[i];
      if (ch === "(") depth++;
      else if (ch === ")") {
        depth--;
        if (depth === 0 && i < re.length - 1) {
          wrapsAll = false;
          break;
        }
      }
    }
    if (!wrapsAll) break;
    // Remove one outer pair and try again
    re = re.slice(1, -1);
  }
  return re;
}

/**
 * Build a GNFA adjacency matrix of regex labels from the editor nodes/arrows.
 *
 * Returns:
 *   - regexMatrix: 2D array of strings R[i][j]
 *   - startIndex:  index of the new global start state
 *   - finalIndex:  index of the new global final state
 */
function buildGnfaFromEditor(
  nodes: Node[],
  arrows: Arrow[],
): {
  regexMatrix: string[][];
  startIndex: number;
  finalIndex: number;
} {
  const presentNodes = nodes.filter(
    (n): n is Node => n !== undefined && n !== null,
  );
  const presentArrows = arrows.filter(
    (a): a is Arrow => a !== undefined && a !== null,
  );

  if (presentNodes.length === 0) {
    throw new Error("There are no states in the current automaton.");
  }

  const startNodes = presentNodes.filter((n) => n.type === "initial");
  const finalNodes = presentNodes.filter((n) => n.type === "final");

  if (startNodes.length === 0) {
    throw new Error(
      "Mark at least one state as the initial state before converting to a regular expression.",
    );
  }
  if (finalNodes.length === 0) {
    throw new Error(
      "Mark at least one state as a final (accepting) state before converting to a regular expression.",
    );
  }

  // Map from Node.id -> compact index [0..m-1]
  const idToIndex = new Map<number, number>();
  presentNodes.forEach((n, idx) => {
    idToIndex.set(n.id, idx);
  });

  const m = presentNodes.length;
  const newStart = m;
  const newFinal = m + 1;
  const totalStates = m + 2;

  // Initialise all entries to "" = "no edge"
  const R: string[][] = Array.from({ length: totalStates }, () =>
    Array<string>(totalStates).fill(""),
  );

  // Add labelled edges for every arrow in the drawing
  for (const tr of presentArrows) {
    const fromIndex = idToIndex.get(tr.from);
    const toIndex = idToIndex.get(tr.to);
    if (fromIndex === undefined || toIndex === undefined) continue;

    const raw = tr.name ?? "";
    const parts = raw.split(/[,|]/);
    for (const part of parts) {
      const sym = normalizeLabel(part);
      if (sym.length === 0) continue;
      R[fromIndex][toIndex] = unionRe(R[fromIndex][toIndex], sym);
    }
  }

  // Add ε-edges from new global start to every original start state
  for (const n of startNodes) {
    const idx = idToIndex.get(n.id);
    if (idx === undefined) continue;
    R[newStart][idx] = unionRe(R[newStart][idx], "ε");
  }

  // Add ε-edges from every original final state to the new global final
  for (const n of finalNodes) {
    const idx = idToIndex.get(n.id);
    if (idx === undefined) continue;
    R[idx][newFinal] = unionRe(R[idx][newFinal], "ε");
  }

  return {
    regexMatrix: R,
    startIndex: newStart,
    finalIndex: newFinal,
  };
}

/**
 * Run the standard state-elimination algorithm on a GNFA adjacency matrix.
 *
 * The matrix is modified in-place and the resulting regex from start to final
 * is returned. If there is no path, "∅" is returned.
 */
function eliminateStates(
  R: string[][],
  startIndex: number,
  finalIndex: number,
): string {
  const n = R.length;

  // Eliminate every intermediate state one by one
  for (let k = 0; k < n; k++) {
    if (k === startIndex || k === finalIndex) continue;

    const Rkk = R[k][k];

    for (let i = 0; i < n; i++) {
      if (i === k) continue;
      const Rik = R[i][k];
      if (isEmpty(Rik)) continue;

      for (let j = 0; j < n; j++) {
        if (j === k) continue;
        const Rkj = R[k][j];
        if (isEmpty(Rkj)) continue;

        const viaK = concat3(Rik, starRe(Rkk), Rkj);
        R[i][j] = unionRe(R[i][j], viaK);
      }
    }

    // After we've accounted for all paths using k, remove its incident edges
    for (let i = 0; i < n; i++) {
      R[i][k] = "";
      R[k][i] = "";
    }
  }

  const result = R[startIndex][finalIndex];
  if (isEmpty(result)) {
    return "∅";
  }
  return stripOuterParens(result);
}

/**
 * Main API: convert the current automaton (interpreted as DFA/NFA) to a regular
 * expression in JFLAP-style syntax.
 *
 * Typical usage with your editor atoms:
 *
 *   const { regex } = dfaToRegex(nodeList, transitions);
 */
export function dfaToRegex(
  nodes: Node[],
  arrows: Arrow[],
): DfaToRegexResult {
  const { regexMatrix, startIndex, finalIndex } = buildGnfaFromEditor(
    nodes,
    arrows,
  );
  const regex = eliminateStates(regexMatrix, startIndex, finalIndex);
  return { regex };
}
