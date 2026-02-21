import type { Arrow, Node, NodeTransition } from "./backend";
import { computeArrowPoints } from "./layout";

const EPSILON = "__EPS__";

type TransitionMap = Map<number, Map<string, Set<number>>>;

type NfaGraph = {
  states: number[];
  startStates: Set<number>;
  acceptStates: Set<number>;
  transitions: TransitionMap;
  alphabet: Set<string>;
};

type DfaState = {
  id: number;
  nfaStates: Set<number>;
  transitions: Map<string, number>;
  isAccepting: boolean;
};

type DfaGraph = {
  states: DfaState[];
  startId: number;
  alphabet: Set<string>;
};

// In future versions, we might want to log more details of the conversion steps.
export type ConversionLogEntry = {
  title: string;
  details: string;
};

export type NfaToDfaResult = {
  nodes: Node[];
  transitions: Arrow[];
  startId: string;
  log: ConversionLogEntry[];
};

// Helper function to normalize transition labels
function normalizeLabel(label: string): string {
  const trimmed = label.trim();

  // Epsilon-like labels
  if (
    trimmed === "" ||
    trimmed === "ε" ||
    trimmed.toLowerCase() === "epsilon" ||
    trimmed.toLowerCase() === "eps"
  ) {
    return EPSILON;
  }

  // Disallow default auto-generated labels like "transition 1"
  if (/^transition\b/i.test(trimmed)) {
    throw new Error(
      `Transition "${trimmed}" must be renamed to an input symbol before converting to DFA.`,
    );
  }

  return trimmed;
}

// Add a transition to the transition map
function addTransition(
  map: TransitionMap,
  from: number,
  symbol: string,
  to: number,
): void {
  let bySymbol = map.get(from);
  if (!bySymbol) {
    bySymbol = new Map<string, Set<number>>();
    map.set(from, bySymbol);
  }
  let targets = bySymbol.get(symbol);
  if (!targets) {
    targets = new Set<number>();
    bySymbol.set(symbol, targets);
  }
  targets.add(to);
}

// build NFA from editor data
function buildNfaFromEditor(nodes: Node[], arrows: Arrow[]): NfaGraph {

  // filter out any undefined/null nodes
  const presentNodes = nodes.filter(
    (node): node is Node => node !== undefined && node !== null,
  );

  // if no nodes present, show error
  if (presentNodes.length === 0) {
    throw new Error("There are no states in the current automaton.");
  }

  // build transition map NFA (Total states, Alphabet, Transition functions, Starting state, Final states)
  const transitions: TransitionMap = new Map();
  const alphabet = new Set<string>();
  const startStates = new Set<number>();
  const acceptStates = new Set<number>();

  // identify start and final states
  for (const node of presentNodes) {
    if (node.type === "initial") {
      startStates.add(node.id);
    }
    if (node.type === "final") {
      acceptStates.add(node.id);
    }
  }

  // if no start state marked, show error
  if (startStates.size === 0) {
    throw new Error(
      "Please mark one state as the initial state before converting to a DFA.",
    );
  }

  // filter for transition arrows
  const presentArrows = arrows.filter(
    (tr): tr is Arrow => tr !== undefined && tr !== null,
  );

  // build transition map
  for (const tr of presentArrows) {
    if (tr.from === undefined || tr.to === undefined) continue;
    
    const raw = tr.name ?? ""; // default to empty label
    const parts = raw.split(/[,|]/); // support "a,b" or "a|b" styled labels

    for (const part of parts) {
      const symbol = normalizeLabel(part);
      if (symbol === EPSILON) {
        addTransition(transitions, tr.from, EPSILON, tr.to);
      } else {
        alphabet.add(symbol);
        addTransition(transitions, tr.from, symbol, tr.to);
      }
    }
  }

  // return constructed NFA
  return {
    states: presentNodes.map((n) => n.id),
    startStates,
    acceptStates,
    transitions,
    alphabet,
  };
}

// subset construction (NFA -> DFA)
function epsilonClosure(
  transitions: TransitionMap,
  states: Set<number>,
): Set<number> {

  // compute ε-closure of given set of NFA states
  const closure = new Set<number>(states);
  const stack: number[] = Array.from(states);

  // Use a stack to explore all states reachable via ε-transitions
  while (stack.length > 0) {
    const state = stack.pop() as number;
    const bySymbol = transitions.get(state);
    if (!bySymbol) continue;
    const epsTargets = bySymbol.get(EPSILON);
    if (!epsTargets) continue;

    // For each ε-transition target, add it and continue exploring
    for (const t of epsTargets) {
      if (!closure.has(t)) {
        closure.add(t);
        stack.push(t);
      }
    }
  }

  return closure;
}

// Move function: from a set of NFA states and an input symbol, find reachable states
function move(
  transitions: TransitionMap,
  states: Set<number>,
  symbol: string,
): Set<number> {

  // compute set of NFA states reachable from 'states' on 'symbol'
  const result = new Set<number>();
  for (const s of states) {
    const bySymbol = transitions.get(s);
    if (!bySymbol) continue;
    const targets = bySymbol.get(symbol);
    if (!targets) continue;
    for (const t of targets) {
      result.add(t);
    }
  }
  return result;
}

// Generate a unique key for a set of states to identify DFA states
// (e.g., {1},{3},{4} -> {1,3,4})
function keyOfSet(states: Set<number>): string {
  const arr = Array.from(states);
  arr.sort((a, b) => a - b);
  return arr.join(",");
}

// Build DFA from NFA using subset construction
function buildDfaFromNfa(nfa: NfaGraph): DfaGraph {

   // define NFA as (Total states, Alphabet, Transition functions, Starting state, Final states)
  const { transitions, alphabet, startStates, acceptStates } = nfa;

  // initial ε-closure of start states
  const startClosure = epsilonClosure(transitions, startStates);
  if (startClosure.size === 0) {
    throw new Error("Initial state has no reachable NFA states.");
  }

  // define DFA states and transitions
  const dfaStates: DfaState[] = [];
  const visited = new Map<string, DfaState>();
  const queue: DfaState[] = [];

  // helper to create/get DFA state for a given set of NFA states
  const makeState = (nfaStates: Set<number>): DfaState => {
    const key = keyOfSet(nfaStates);
    const existing = visited.get(key);
    if (existing) return existing;

    // determine if the current DFA state is final state
    const isAccepting = Array.from(nfaStates).some((s) =>
      acceptStates.has(s),
    );

    // dfa state has unique id, set of nfa states, transition map, and isAccepting flag
    const dfaState: DfaState = {
      id: dfaStates.length,
      nfaStates,
      transitions: new Map<string, number>(),
      isAccepting,
    };

    // push all newly created dfa states to queue for processing
    dfaStates.push(dfaState);
    visited.set(key, dfaState);
    queue.push(dfaState);

    return dfaState;
  };

  const startDfa = makeState(startClosure);

  // process each DFA state in the queue
  while (queue.length > 0) {
    const current = queue.shift() as DfaState;
    
    // for each symbol in the alphabet, compute transitions
    for (const symbol of alphabet) {

      // compute move and epsilon-closure for the current symbol
      const m = move(transitions, current.nfaStates, symbol);
      if (m.size === 0) continue;

      // compute epsilon-closure of the move result
      const next = epsilonClosure(transitions, m);
      if (next.size === 0) continue;

      // get or create the next DFA state
      const nextDfaState = makeState(next);
      current.transitions.set(symbol, nextDfaState.id);
    }
  }

  // return the constructed DFA
  return {
    states: dfaStates,
    startId: startDfa.id,
    alphabet,
  };
}

// Make DFA complete by adding a trap state if necessary
function makeCompleteDfa(dfa: DfaGraph): DfaGraph {
  const alphabet = Array.from(dfa.alphabet);
  if (alphabet.length === 0) return dfa;

  const states = [...dfa.states];

  const trapId = states.length;
  const trapState: DfaState = {
    id: trapId,
    nfaStates: new Set<number>(),
    transitions: new Map<string, number>(),
    isAccepting: false,
  };

  for (const sym of alphabet) {
    trapState.transitions.set(sym, trapId);
  }

  let needTrap = false;

  // check if any state lacks transitions for any symbol
  for (const s of states) {
    for (const sym of alphabet) {
      if (!s.transitions.has(sym)) {
        s.transitions.set(sym, trapId);
        needTrap = true;
      }
    }
  }

  // add trap state if needed
  if (needTrap) {
    states.push(trapState);
    return {
      states,
      startId: dfa.startId,
      alphabet: dfa.alphabet,
    };
  }

  return dfa;
}

// DFA minimization (Step 1: find reachable states)
function reachableStates(dfa: DfaGraph): Set<number> {
  const reachable = new Set<number>();
  const stack: number[] = [dfa.startId];

  // perform Depth First Search to find all reachable states
  while (stack.length > 0) {
    const id = stack.pop() as number;
    if (reachable.has(id)) continue;
    reachable.add(id);
    const state = dfa.states[id];
    if (!state) continue;

    // explore all transitions from the current state
    for (const target of state.transitions.values()) {
      if (!reachable.has(target)) {
        stack.push(target);
      }
    }
  }

  // return the set of reachable states
  return reachable;
}

// DFA minimization (Step 2: Use partition refinement algorithm)
function minimizeDfa(dfa: DfaGraph): DfaGraph {
  const alphabet = Array.from(dfa.alphabet);
  const reachable = reachableStates(dfa);

  // filter states to only include reachable ones
  const reachableStatesArr = dfa.states.filter((s) => reachable.has(s.id));
  const idToState = new Map<number, DfaState>();
  for (const s of reachableStatesArr) {
    idToState.set(s.id, s);
  }

  // separate states into final and non-final sets
  const accepting = new Set<number>();
  const nonAccepting = new Set<number>();
  for (const s of reachableStatesArr) {
    if (s.isAccepting) accepting.add(s.id);
    else nonAccepting.add(s.id);
  }

  // initialize partitions with accepting and non-accepting states
  let partitions: Set<number>[] = [];
  if (accepting.size > 0) partitions.push(accepting);
  if (nonAccepting.size > 0) partitions.push(nonAccepting);

  // helper function to find the partition index of a state
  const findBlockIndex = (stateId: number, blocks: Set<number>[]): number => {
    for (let i = 0; i < blocks.length; i++) {
      if (blocks[i].has(stateId)) return i;
    }
    return -1;
  };

  let changed = true; // flag to track if partitions have changed

  // refine partitions until no further changes occur
  while (changed) {
    changed = false;
    const newPartitions: Set<number>[] = [];

    for (const block of partitions) {
      // group states in the block by their transition signatures
      // key: signature string, value: set of state IDs
      const signatures = new Map<string, Set<number>>();

      // build signatures for each state in the block
      for (const stateId of block) {
        const state = idToState.get(stateId);
        if (!state) continue;

        const signatureParts: string[] = [];

        // for each symbol, record which partition the target state belongs to
        for (const symbol of alphabet) {
          const target = state.transitions.get(symbol);
          if (target === undefined) {
            signatureParts.push("x"); // no transition on this symbol
          } else { // find which partition the target state is in
            const blockIndex = findBlockIndex(target, partitions);
            signatureParts.push(blockIndex.toString());
          }
        }

        // create a signature string for the state
        const sig = signatureParts.join("|");
        let group = signatures.get(sig);
        
        // group states with the same signature together
        if (!group) {
          group = new Set<number>();
          signatures.set(sig, group);
        }
        group.add(stateId);
      }

      // if the block was split into multiple groups, update partitions
      if (signatures.size === 1) {
        newPartitions.push(block);
      } else {
        // split the block into multiple groups based on signatures
        changed = true;
        for (const subset of signatures.values()) {
          newPartitions.push(subset);
        }
      }
    }

    partitions = newPartitions;
  }

  const oldToNew = new Map<number, number>();
  const newStates: DfaState[] = [];

  // build new minimized states based on partitions
  partitions.forEach((block, newId) => {
    const members = Array.from(block);
    if (members.length === 0) return;

    const rep = idToState.get(members[0]);
    if (!rep) return;

    for (const oldId of members) {
      oldToNew.set(oldId, newId);
    }

    // merge NFA states from all members of the partition
    const mergedNfaStates = new Set<number>();
    for (const oldId of members) {
      const oldState = idToState.get(oldId);
      if (!oldState) continue;
      for (const nfaState of oldState.nfaStates) {
        mergedNfaStates.add(nfaState);
      }
    }

    const newState: DfaState = {
      id: newId,
      nfaStates: mergedNfaStates,
      transitions: new Map<string, number>(),
      isAccepting: rep.isAccepting,
    };

    newStates.push(newState);
  });

  for (const newState of newStates) {
    const block = partitions[newState.id];
    if (!block) continue;
    const oldId = Array.from(block.values())[0] as number;
    const oldState = idToState.get(oldId);
    if (!oldState) continue;

    for (const [symbol, oldTarget] of oldState.transitions.entries()) {
      const newTargetId = oldToNew.get(oldTarget);
      if (newTargetId !== undefined) {
        newState.transitions.set(symbol, newTargetId);
      }
    }
  }

  const newStartId = oldToNew.get(dfa.startId);
  if (newStartId === undefined) {
    throw new Error("Start state became unreachable during minimization.");
  }

  return {
    states: newStates,
    startId: newStartId,
    alphabet: dfa.alphabet,
  };
}

// -------------------- reorder & trap detection --------------------

function reorderAndDetectTrap(
  dfa: DfaGraph,
): {
  states: DfaState[];
  startId: number;
  alphabet: Set<string>;
  trapId: number | null;
} {
  const oldStates = dfa.states;
  const startOldId = dfa.startId;
  const startState = oldStates.find((s) => s.id === startOldId);
  if (!startState) {
    throw new Error("Internal error: start state not found after minimization.");
  }

  const others = oldStates
    .filter((s) => s.id !== startOldId)
    .sort((a, b) => a.id - b.id);

  const ordered = [startState, ...others];

  const oldToNew = new Map<number, number>();
  ordered.forEach((s, idx) => {
    oldToNew.set(s.id, idx);
  });

  const renamedStates: DfaState[] = ordered.map((s, idx) => ({
    id: idx,
    nfaStates: new Set(s.nfaStates),
    transitions: new Map<string, number>(),
    isAccepting: s.isAccepting,
  }));

  for (const s of ordered) {
    const newId = oldToNew.get(s.id)!;
    const newState = renamedStates[newId];
    for (const [symbol, oldTarget] of s.transitions.entries()) {
      const newTarget = oldToNew.get(oldTarget);
      if (newTarget === undefined) continue;
      newState.transitions.set(symbol, newTarget);
    }
  }

  const alphabetArr = Array.from(dfa.alphabet);
  let trapId: number | null = null;

  if (alphabetArr.length > 0) {
    for (const st of renamedStates) {
      if (st.isAccepting) continue;
      let allSelf = true;
      for (const sym of alphabetArr) {
        const t = st.transitions.get(sym);
        if (t !== st.id) {
          allSelf = false;
          break;
        }
      }
      if (allSelf) {
        trapId = st.id;
        break;
      }
    }
  }

  return {
    states: renamedStates,
    startId: 0, // start state is now index 0
    alphabet: dfa.alphabet,
    trapId,
  };
}

// -------------------- layout helpers --------------------

type CircleLayoutOptions = {
  centerX?: number;
  centerY?: number;
  desiredSpacing?: number;
};

// simple circular layout for minimized DFA
function layoutCircle(
  count: number,
  options?: CircleLayoutOptions,
): { x: number; y: number }[] {
  const positions: { x: number; y: number }[] = [];
  if (count === 0) return positions;

  const centerX = options?.centerX ?? 600;
  const centerY = options?.centerY ?? 350;
  const desiredSpacing = options?.desiredSpacing ?? 150;

  if (count === 1) {
    positions[0] = { x: centerX, y: centerY };
    return positions;
  }

  // radius so that average distance along circle ≈ desiredSpacing
  const radius = Math.max(
    desiredSpacing,
    (desiredSpacing * count) / (2 * Math.PI),
  );

  for (let i = 0; i < count; i++) {
    const angle = (2 * Math.PI * i) / count - Math.PI / 2; // start at top
    positions[i] = {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    };
  }

  return positions;
}

// main API
// Convert NFA (from editor) to minimal DFA (to editor)
export function nfaToMinimalDfa(
  nodes: Node[],
  arrows: Arrow[],
): NfaToDfaResult {
  const log: ConversionLogEntry[] = [];

  // 1) Build NFA
  const nfa = buildNfaFromEditor(nodes, arrows);
  const nfaStatesStr = nfa.states.map((id) => `q${id}`).join(", ");
  const nfaStartStr = Array.from(nfa.startStates)
    .sort((a, b) => a - b)
    .map((id) => `q${id}`)
    .join(", ");
  const nfaAcceptStr = Array.from(nfa.acceptStates)
    .sort((a, b) => a - b)
    .map((id) => `q${id}`)
    .join(", ");
  const alphabetStr = `{${Array.from(nfa.alphabet).join(", ")}}`;

  log.push({
    title: "Parsed NFA",
    details: `States: {${nfaStatesStr}}; Start: {${nfaStartStr}}; Accepting: {${nfaAcceptStr}}; Alphabet: ${alphabetStr}.`,
  });

  // 2) Subset construction
  const dfaRaw = buildDfaFromNfa(nfa);
  const subsetSummary = dfaRaw.states
    .slice(0, 5)
    .map((s) => {
      const subsetLabel = Array.from(s.nfaStates)
        .sort((a, b) => a - b)
        .map((id) => `q${id}`)
        .join(",");
      return `D${s.id}={${subsetLabel}}`;
    })
    .join("; ");
  log.push({
    title: "Subset construction (NFA → DFA)",
    details: `Created ${dfaRaw.states.length} DFA states via subset construction. First few: ${subsetSummary}${
      dfaRaw.states.length > 5 ? "; ..." : ""
    }`,
  });

  // 3) Make DFA complete (add trap if needed)
  const dfaComplete = makeCompleteDfa(dfaRaw);
  if (dfaComplete.states.length > dfaRaw.states.length) {
    log.push({
      title: "Completed DFA",
      details:
        "DFA was not complete on every input symbol, so a trap state was added and missing transitions now go to that trap state.",
    });
  } else {
    log.push({
      title: "Completed DFA",
      details:
        "DFA was already complete on every input symbol; no trap state needed.",
    });
  }

  // 4) Minimize DFA
  const beforeMin = dfaComplete.states.length;
  const minDfaUnordered = minimizeDfa(dfaComplete);
  const afterMin = minDfaUnordered.states.length;

  log.push({
    title: "Minimization",
    details: `Minimized DFA from ${beforeMin} states to ${afterMin} states using partition-refinement.`,
  });

  // 5) Reorder states (start → q0) and detect trap
  const reordered = reorderAndDetectTrap(minDfaUnordered);
  const minDfa: DfaGraph = {
    states: reordered.states,
    startId: reordered.startId,
    alphabet: reordered.alphabet,
  };
  const trapId = reordered.trapId;

  const renamedSummary = minDfa.states
    .map((s) => {
      const subsetLabel = Array.from(s.nfaStates)
        .sort((a, b) => a - b)
        .map((id) => `q${id}`)
        .join(",");
      const label = trapId !== null && s.id === trapId ? "trap" : `q${s.id}`;
      return `${label} = {${subsetLabel}}`;
    })
    .join("; ");

  log.push({
    title: "Renamed states",
    details: `Renamed start state to q0 and others to q1, q2, ... (trap, if present, is named "trap"). Mapping: ${renamedSummary}.`,
  });

  const resultNodes: Node[] = [];
  const resultArrows: Arrow[] = [];

  // -------------------- circular layout for "prettier" DFA --------------------
  const totalStates = minDfa.states.length;

  const positions = layoutCircle(totalStates, {
    centerX: 600,
    centerY: 350,
    desiredSpacing: 150,
  });

  minDfa.states.forEach((state) => {
    const pos = positions[state.id];
    const x = pos?.x ?? 600;
    const y = pos?.y ?? 350;

    const isTrap = trapId !== null && state.id === trapId;
    const name = isTrap ? "trap" : `q${state.id}`;

    const type: Node["type"] =
      state.id === minDfa.startId
        ? "initial"
        : state.isAccepting
        ? "final"
        : "intermediate";

    const node: Node = {
      x,
      y,
      radius: 35,
      fill: "#ffffff80",
      id: state.id, // keep id aligned with DFA id
      strokeWidth: 0,
      strokeColor: "#ffffff",
      name,
      type,
      transitions: [],
    };

    // Ensure index == id alignment in array
    resultNodes[state.id] = node;
  });

  // Merge parallel edges: q_i --a,b--> q_j
  type EdgeKey = string;
  type EdgeAggregate = { from: number; to: number; symbols: Set<string> };

  const edgeMap = new Map<EdgeKey, EdgeAggregate>();

  for (const state of minDfa.states) {
    const fromIndex = state.id;
    for (const [symbol, targetId] of state.transitions.entries()) {
      const toIndex = targetId;
      const key = `${fromIndex}->${toIndex}`;
      let agg = edgeMap.get(key);
      if (!agg) {
        agg = { from: fromIndex, to: toIndex, symbols: new Set<string>() };
        edgeMap.set(key, agg);
      }
      agg.symbols.add(symbol);
    }
  }

  for (const [, agg] of edgeMap.entries()) {
    const fromIndex = agg.from;
    const toIndex = agg.to;

    const fromNode = resultNodes[fromIndex];
    const toNode = resultNodes[toIndex];
    if (!fromNode || !toNode) continue;

    const reverseKey = `${toIndex}->${fromIndex}`;
    const hasReverse = edgeMap.has(reverseKey);
    const side: -1 | 0 | 1 = hasReverse
      ? fromIndex < toIndex
        ? 1
        : -1
      : 0;

    const points = computeArrowPoints(fromNode, toNode, { side });
    const arrowId = resultArrows.length;

    const symbolsArray = Array.from(agg.symbols);
    symbolsArray.sort();
    const label = symbolsArray.join(",");

    const arrow: Arrow = {
      id: arrowId,
      from: fromIndex,
      to: toIndex,
      points,
      stroke: "#ffffffe6",
      strokeWidth: 2,
      fill: "#ffffffe6",
      name: label,
      tension: fromIndex === toIndex ? 1 : 0,
    };

    resultArrows.push(arrow);

    const fromTransition: NodeTransition = {
      from: undefined,
      to: toIndex,
      trId: arrowId,
    };

    const toTransition: NodeTransition = {
      from: fromIndex,
      to: undefined,
      trId: arrowId,
    };

    resultNodes[fromIndex].transitions.push(fromTransition);
    resultNodes[toIndex].transitions.push(toTransition);
  }

  return {
    nodes: resultNodes,
    transitions: resultArrows,
    startId: String(minDfa.startId), // "0"
    log,
  };
}
