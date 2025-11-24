import type { Node, Arrow } from "./backend";

type TransitionMatrix = Map<number, Map<number, string>>;

/**
 * @param nodes
 * @param arrows
 * @param startId
 * @returns
 */
export function dfaToRegex(
    nodes: Node[],
    arrows: Arrow[],
    startId: string,
): string {
    const startNodeId = Number(startId);
    const finalNodeIds = nodes.filter(n => n.type === 'final' || n.isFinal).map(n => n.id);
    const allNodeIds = nodes.map(n => n.id);

    // Language accepts nothing
    if (finalNodeIds.length === 0) {
        return "";
    }

    // Prepare DFA Structure
    const R: TransitionMatrix = new Map();

    for (const i of allNodeIds) {
        R.set(i, new Map());
        for (const j of allNodeIds) {
            R.get(i)!.set(j, "");
        }
    }

    // Populate the matrix with direct transitions from the arrows
    for (const arrow of arrows) {
        const i = arrow.from;
        const j = arrow.to;
        const symbol = arrow.name;

        const currentRegex = R.get(i)!.get(j)!;
        R.get(i)!.set(j, currentRegex === "" ? symbol : `(${currentRegex})+(${symbol})`);
    }

    // State Elimination
    const intermediateStates = allNodeIds.filter(id => id !== startNodeId && !finalNodeIds.includes(id));
    
    intermediateStates.sort((a, b) => b - a);

    for (const k of intermediateStates) {

        const R_kk = R.get(k)!.get(k) || "";
        const R_kk_star = R_kk === "" ? "" : R_kk === "ε" ? "" : R_kk.length > 1 ? `(${R_kk})*` : `${R_kk}*`;
        
        for (const i of allNodeIds) {
            if (i === k) continue;

            for (const j of allNodeIds) {
                if (j === k) continue;

                const R_ij = R.get(i)!.get(j) || "";
                const R_ik = R.get(i)!.get(k) || "";
                const R_kj = R.get(k)!.get(j) || "";

                // Apply the State Elimination/Arden's Rule formula 
                let newPath = "";
                if (R_ik !== "" && R_kj !== "") {

                    newPath = R_ik.length > 1 ? `(${R_ik})` : R_ik;

                    if (R_kk_star !== "") {
                        newPath += R_kk_star;
                    }
                    newPath += (R_kj.length > 1 && R_kj !== R_kk) ? `(${R_kj})` : R_kj;
                }
                
                // Combine the paths
                let newR_ij = R_ij;

                if (newPath !== "") {
                    if (newR_ij === "") {
                        newR_ij = newPath;
                    } else {
                        newR_ij = `${R_ij}+${newPath}`;
                    }
                }

                R.get(i)!.set(j, newR_ij);
            }
        }
        
        // Remove the state k row and column from future consideration
        R.delete(k);
        for (const i of allNodeIds) {
            R.get(i)?.delete(k);
        }
    }

    // Final Result
    let finalRegex = "";

    // If the start state is also a final state
    const startIsFinal = finalNodeIds.includes(startNodeId);
    
    // Combine paths from the start state to all final states
    const startToFinalPaths: string[] = [];
    for (const f of finalNodeIds) {
        const R_sf = R.get(startNodeId)?.get(f);
        if (R_sf && R_sf !== "") {
            startToFinalPaths.push(R_sf);
        }
    }

    if (finalNodeIds.length === 1 && finalNodeIds[0] === startNodeId && intermediateStates.length === allNodeIds.length - 1) {
        const R_ss = R.get(startNodeId)?.get(startNodeId) || "";
        finalRegex = R_ss === "" ? "ε" : R_ss.length > 1 ? `(${R_ss})*` : `${R_ss}*`;
    } 

    else if (startToFinalPaths.length > 0) {
        finalRegex = startToFinalPaths.join(" + ");

        if (startIsFinal && !finalRegex.includes("ε")) {
        }
    }

    finalRegex = finalRegex.replace(/\+/g, "|");
    
    return finalRegex || (startIsFinal ? "ε" : "");
}

/**
 * Normalizes regex components to ensure they are properly grouped for the R_ik (R_kk)* R_kj concatenation.
 * This is crucial because concatenation (implicit in a string) takes higher precedence than union ('+').
 * @param regex The regex fragment.
 * @returns The fragment wrapped in parentheses if it contains a union operator.
 */
function groupRegex(regex: string): string {
    if (regex.length > 1 && regex.includes('+')) {
        return `(${regex})`;
    }
    return regex;
}