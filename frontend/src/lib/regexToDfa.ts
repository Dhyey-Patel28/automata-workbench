import type { Arrow, Node, NodeTransition } from "./backend";
import { computeArrowPoints } from "./layout";

const EPSILON = "__EPS__";
const CONCAT = ".";

type TransitionMap = Map<number, Map<string, Set<number>>>;

type NfaFragment = {
  start: number;
  end: number;
};

type DfaState = {
  id: number;
  nfaStates: Set<number>;
  transitions: Map<string, number>;
  isAccepting: boolean;
};

export type RegexToDfaResult = {
  nodes: Node[];
  transitions: Arrow[];
  startId: string;
};

export function regexToDfa(regex: string): RegexToDfaResult {
  const sanitized = sanitizeRegex(regex);
  if (!sanitized) {
    throw new Error("Enter a non-empty regular expression");
  }

  const withConcat = insertConcatOperators(sanitized);
  const postfix = toPostfix(withConcat);
  const nfa = buildNfa(postfix);
  const dfa = buildDfa(nfa);
  if (dfa.states.length === 0) {
    throw new Error("Regex did not produce any states");
  }

  return buildEditorData(dfa);
}

function sanitizeRegex(regex: string): string {
  return regex.replace(/\s+/g, "").replace(/\+/g, "|");
}

function isLiteral(token: string): boolean {
  return /^[a-z0-9]$/i.test(token) || token === EPSILON;
}

function insertConcatOperators(regex: string): string {
  const tokens = Array.from(regex);
  const result: string[] = [];

  for (let i = 0; i < tokens.length; i++) {
    const current = tokens[i];
    const next = tokens[i + 1];
    result.push(current);

    if (next && needsConcat(current, next)) {
      result.push(CONCAT);
    }
  }

  return result.join("");
}

function needsConcat(prev: string, next: string): boolean {
  if (!prev || !next) return false;

  const prevLiteral = isLiteral(prev) || prev === ")" || prev === "*";
  const nextLiteral = isLiteral(next) || next === "(";

  return prevLiteral && nextLiteral;
}

function toPostfix(regex: string): string[] {
  const precedence: Record<string, number> = {
    "|": 1,
    [CONCAT]: 2,
  };

  const output: string[] = [];
  const stack: string[] = [];
  const tokens = Array.from(regex);

  let lastToken: string | null = null;

  for (const token of tokens) {
    if (isLiteral(token)) {
      output.push(token);
      lastToken = token;
      continue;
    }

    if (token === "(") {
      stack.push(token);
      lastToken = token;
      continue;
    }

    if (token === ")") {
      let foundOpening = false;
      while (stack.length) {
        const op = stack.pop()!;
        if (op === "(") {
          foundOpening = true;
          break;
        }
        output.push(op);
      }
      if (!foundOpening) {
        throw new Error("Mismatched parentheses in regex");
      }
      lastToken = token;
      continue;
    }

    if (token === "*") {
      if (!lastToken || lastToken === "(" || lastToken === "|") {
        throw new Error("Kleene star must follow an expression");
      }
      output.push(token);
      lastToken = token;
      continue;
    }

    if (!(token in precedence)) {
      throw new Error(`Unsupported token "${token}" in regex`);
    }

    while (
      stack.length &&
      stack[stack.length - 1] in precedence &&
      precedence[stack[stack.length - 1]] >= precedence[token]
    ) {
      output.push(stack.pop()!);
    }

    stack.push(token);
    lastToken = token;
  }

  while (stack.length) {
    const op = stack.pop()!;
    if (op === "(" || op === ")") {
      throw new Error("Mismatched parentheses in regex");
    }
    output.push(op);
  }

  return output;
}

function buildNfa(postfix: string[]) {
  let stateCounter = 0;
  const transitions: TransitionMap = new Map();

  const fragments: NfaFragment[] = [];

  const newState = () => {
    const state = stateCounter++;
    if (!transitions.has(state)) {
      transitions.set(state, new Map());
    }
    return state;
  };

  const addTransition = (from: number, symbol: string, to: number) => {
    if (!transitions.has(from)) {
      transitions.set(from, new Map());
    }
    const symbolMap = transitions.get(from)!;
    if (!symbolMap.has(symbol)) {
      symbolMap.set(symbol, new Set());
    }
    symbolMap.get(symbol)!.add(to);
  };

  for (const token of postfix) {
    if (isLiteral(token)) {
      const start = newState();
      const end = newState();
      addTransition(start, token === EPSILON ? EPSILON : token, end);
      fragments.push({ start, end });
      continue;
    }

    if (token === "*") {
      const frag = fragments.pop();
      if (!frag) throw new Error("Invalid regex structure");
      const start = newState();
      const end = newState();
      addTransition(start, EPSILON, frag.start);
      addTransition(start, EPSILON, end);
      addTransition(frag.end, EPSILON, frag.start);
      addTransition(frag.end, EPSILON, end);
      fragments.push({ start, end });
      continue;
    }

    if (token === CONCAT) {
      const right = fragments.pop();
      const left = fragments.pop();
      if (!right || !left) throw new Error("Invalid regex structure");
      addTransition(left.end, EPSILON, right.start);
      fragments.push({ start: left.start, end: right.end });
      continue;
    }

    if (token === "|") {
      const right = fragments.pop();
      const left = fragments.pop();
      if (!right || !left) throw new Error("Invalid regex structure");
      const start = newState();
      const end = newState();
      addTransition(start, EPSILON, left.start);
      addTransition(start, EPSILON, right.start);
      addTransition(left.end, EPSILON, end);
      addTransition(right.end, EPSILON, end);
      fragments.push({ start, end });
      continue;
    }

    throw new Error(`Unexpected token "${token}" in postfix expression`);
  }

  if (fragments.length !== 1) {
    throw new Error("Invalid regex structure");
  }

  const fragment = fragments[0];
  return {
    start: fragment.start,
    end: fragment.end,
    transitions,
  };
}

function buildDfa(nfa: {
  start: number;
  end: number;
  transitions: TransitionMap;
}) {
  const alphabet = new Set<string>();

  for (const [, symbolMap] of nfa.transitions) {
    for (const [symbol] of symbolMap) {
      if (symbol !== EPSILON) alphabet.add(symbol);
    }
  }

  const epsClosure = (states: Set<number>): Set<number> => {
    const result = new Set(states);
    const stack = Array.from(states);

    while (stack.length) {
      const state = stack.pop()!;
      const symbolMap = nfa.transitions.get(state);
      if (!symbolMap || !symbolMap.has(EPSILON)) continue;
      for (const next of symbolMap.get(EPSILON)!) {
        if (!result.has(next)) {
          result.add(next);
          stack.push(next);
        }
      }
    }

    return result;
  };

  const move = (states: Set<number>, symbol: string): Set<number> => {
    const result = new Set<number>();
    for (const state of states) {
      const symbolMap = nfa.transitions.get(state);
      if (!symbolMap) continue;
      const targets = symbolMap.get(symbol);
      if (!targets) continue;
      for (const target of targets) {
        result.add(target);
      }
    }
    return result;
  };

  const keyOf = (states: Set<number>) =>
    Array.from(states)
      .sort((a, b) => a - b)
      .join(",");

  const dfaStates: DfaState[] = [];
  const visited = new Map<string, DfaState>();
  const queue: DfaState[] = [];

  const addState = (states: Set<number>) => {
    const key = keyOf(states);
    if (visited.has(key)) return visited.get(key)!;
    const dfaState: DfaState = {
      id: dfaStates.length,
      nfaStates: states,
      transitions: new Map(),
      isAccepting: states.has(nfa.end),
    };
    dfaStates.push(dfaState);
    visited.set(key, dfaState);
    queue.push(dfaState);
    return dfaState;
  };

  const startClosure = epsClosure(new Set([nfa.start]));
  addState(startClosure);

  while (queue.length) {
    const current = queue.shift()!;
    for (const symbol of alphabet) {
      const moveSet = move(current.nfaStates, symbol);
      if (moveSet.size === 0) continue;
      const closure = epsClosure(moveSet);
      const targetState = addState(closure);
      current.transitions.set(symbol, targetState.id);
    }
  }

  return {
    states: dfaStates,
    alphabet: Array.from(alphabet).sort(),
    startId: 0,
  };
}

function formatSymbolSet(symbols: Set<string>): string {
  // Turn the set into a sorted array of displayable strings
  const parts = Array.from(symbols)
    .sort()
    .map((s) => (s === EPSILON ? "ε" : s));

  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0];

  // Regex-style: (a + b + c)
  return `(${parts.join(" + ")})`;
}

// simple grid layout for regex-generated DFA
function layoutGrid(count: number): { x: number; y: number }[] {
  const positions: { x: number; y: number }[] = [];
  if (count === 0) return positions;

  const cols = Math.ceil(Math.sqrt(count));
  const spacingX = 200;
  const spacingY = 150;
  const startX = 200;
  const startY = 150;

  for (let i = 0; i < count; i++) {
    const row = Math.floor(i / cols);
    const col = i % cols;
    positions[i] = {
      x: startX + col * spacingX,
      y: startY + row * spacingY,
    };
  }

  return positions;
}

function buildEditorData(dfa: {
  states: DfaState[];
  startId: number;
}): RegexToDfaResult {
  const nodes: Node[] = [];

  // Use grid layout
  const positions = layoutGrid(dfa.states.length);

  for (const state of dfa.states) {
    const pos = positions[state.id];
    const x = pos?.x ?? 200;
    const y = pos?.y ?? 200;

    const isStart = state.id === dfa.startId;
    const isAccepting = state.isAccepting;

    nodes[state.id] = {
      id: state.id,
      name: `q${state.id}`,
      type: isStart ? "initial" : isAccepting ? "final" : "intermediate",
      x,
      y,
      radius: 35,
      fill: "#ffffff80",
      strokeWidth: 0,
      strokeColor: "#ffffff",
      transitions: [],
    };
  }

  const grouped = new Map<
    string,
    { from: number; to: number; symbols: Set<string> }
  >();

  for (const state of dfa.states) {
    for (const [symbol, to] of state.transitions) {
      const key = `${state.id}->${to}`;
      if (!grouped.has(key)) {
        grouped.set(key, { from: state.id, to, symbols: new Set() });
      }
      grouped.get(key)!.symbols.add(symbol);
    }
  }

  const transitions: Arrow[] = [];
  let nextTransitionId = 0;

  for (const [, value] of grouped) {
    const fromNode = nodes[value.from];
    const toNode = nodes[value.to];
    if (!fromNode || !toNode) continue;

    const reverseKey = `${value.to}->${value.from}`;
    const hasReverse = grouped.has(reverseKey);
    const side: -1 | 0 | 1 = hasReverse
      ? value.from < value.to
        ? 1
        : -1
      : 0;

    const points = computeArrowPoints(fromNode, toNode, { side });
    const label = formatSymbolSet(value.symbols);

    const transition: Arrow = {
      id: nextTransitionId,
      from: value.from,
      to: value.to,
      points,
      stroke: "#ffffffe6",
      strokeWidth: 2,
      fill: "#ffffffe6",
      name: label, // now shows (a + b) etc.
      tension: value.from === value.to ? 1 : 0,
    };
    transitions.push(transition);

    const forwardTransition: NodeTransition = {
      to: value.to,
      trId: transition.id,
    };
    const backwardTransition: NodeTransition = {
      from: value.from,
      trId: transition.id,
    };

    fromNode.transitions.push(forwardTransition);
    toNode.transitions.push(backwardTransition);

    nextTransitionId++;
  }

  return {
    nodes,
    transitions,
    startId: String(dfa.startId),
  };
}
