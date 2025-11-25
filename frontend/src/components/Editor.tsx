import { useRef, useState, useEffect, useCallback } from "react";
import Konva from "konva";
import type { KonvaEventObject } from "konva/lib/Node";
import { Stage, Layer, Group, Circle, Text, Arrow } from "react-konva";
import {
  editorState,
  currentSelected,
  arrowStates,
  arrows,
  saveFSMAtom,
  recentStateSave,
  start_state,
  alert as alertAtom,
  Nodes,
} from "../lib/backend";
import type { Node } from "../lib/backend";
import { computeArrowPoints } from "../lib/layout";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import type { ReactNode } from "react";
import clsx from "clsx";
import { Check, X } from "lucide-react";

type TrNameEditorState = [boolean, string, number | undefined];
type SaveFsmState = [number, string];

const Editor = () => {
  const currentEditorState = useAtomValue(editorState);

  // Konva Layer Reference
  const layerRef = useRef<Konva.Layer | null>(null);

  // Konva Stage Ref
  const stageRef = useRef<Konva.Stage | null>(null);

  const [nodeList, updateNodeList] = useAtom(Nodes);
  const [currSelected, setCurrSelected] = useAtom(currentSelected);
  const [transitionTracker, setTransitionTracker] = useAtom(arrowStates);
  const [transitions, updateTransitions] = useAtom(arrows);

  // [show/hide, current text, transition text id]
  const [trNameEditor, setTrNameEditor] = useState<TrNameEditorState>([
    false,
    "",
    undefined,
  ]);

  const [showSaveFSM, setShowSaveFSM] = useAtom(saveFSMAtom);

  // Pop settings for downloading FSM [scale, fileName]
  const [saveFSM, setSaveFSM] = useState<SaveFsmState>([1, ""]);

  const [recentStateControlSaved, setRecentStateControlSaved] =
    useAtom(recentStateSave);

  const [startState, setStartState] = useAtom(start_state);

  const setAlertMsg = useSetAtom(alertAtom);

  // Generate Points for drawing transition arrow
  const getPoints = useCallback(
    (id1: number, id2: number): number[] => {
      const fromNode = nodeList[id1];
      const toNode = nodeList[id2];
      if (!fromNode || !toNode) return [];

      // Detect whether we also have the reverse edge id2 -> id1.
      let hasReverse = false;
      for (const tr of transitions) {
        if (!tr) continue;
        if (tr.from === id2 && tr.to === id1) {
          hasReverse = true;
          break;
        }
      }

      // If there's a reverse edge, curve both edges with the same "side".
      // Because the perpendicular flips when you reverse direction,
      // this puts q0->q1 on top and q1->q0 on the bottom (for a left/right pair).
      const side: -1 | 0 | 1 = hasReverse ? -1 : 0;

      return computeArrowPoints(fromNode, toNode, { side });
    },
    [nodeList, transitions],
  );

  // Every time a state's controls are changed(size), its transition arrows should also be updated
  useEffect(() => {
    if (recentStateControlSaved === "nil") return;
    if (!layerRef.current) return;

    const recentId = Number(recentStateControlSaved);
    if (Number.isNaN(recentId)) return;

    // Update the transition arrow's positions
    for (let i = 0; i < transitions.length; i++) {
      const tr = transitions[i];
      if (!tr) continue;

      if (tr.to === recentId || tr.from === recentId) {
        const newPoints = getPoints(tr.from!, tr.to!);
        tr.points = newPoints;
        const arrow = layerRef.current.findOne(
          `#tr${tr.id}`,
        ) as Konva.Arrow | null;
        if (arrow) {
          arrow.points(newPoints);
        }
      }
    }

    // If node is a start state, additionally update its start arrow as well
    if (recentId === Number(startState)) {
      const startArrow = layerRef.current.findOne(
        "#startarrow",
      ) as Konva.Arrow | null;
      const startNode = layerRef.current.findOne(
        `#${startState}`,
      ) as Konva.Circle | null;

      if (startArrow && startNode) {
        const nodeRadius = startNode.radius();
        const points = [-nodeRadius / 1.5, 0, nodeRadius - 5, 0];

        startArrow.x(-1 * (nodeRadius + 40));
        startArrow.points(points);
      }
    }

    setRecentStateControlSaved("nil");
  }, [
    recentStateControlSaved,
    setRecentStateControlSaved,
    startState,
    transitions,
    getPoints,
  ]);

  // Handle Creating Nodes by clicking
  function handleEditorClick(e: KonvaEventObject<MouseEvent>) {
    // Return if not in create mode, and deselects if a node is selected
    if (currentEditorState !== "create") {
      if (currSelected !== "nil" && layerRef.current) {
        const selectedNode = layerRef.current.findOne(
          `#${currSelected}`,
        ) as Konva.Circle | null;
        if (selectedNode) {
          selectedNode.to({
            duration: 0.1,
            strokeWidth: 0,
            easing: Konva.Easings.EaseInOut,
          });
        }
        setCurrSelected("nil");
      }
      return;
    }

    const stage = e.target.getStage();
    if (!stage) return;

    const group = stage.findOne("Group") as Konva.Group | null;
    if (!group) return;

    const clickPos = group.getRelativePointerPosition();
    if (!clickPos) return;

    // if node is the first one, then make it the starting state
    if (nodeList.length === 0) {
      setStartState("0");
    }

    updateNodeList((nodes: Node[]) => [
      ...nodes,
      {
        x: clickPos.x,
        y: clickPos.y,
        radius: 35,
        fill: "#ffffff80",
        id: nodes.length,
        strokeWidth: 0,
        strokeColor: "#ffffff",
        name: `q${nodes.length}`,
        type: nodes.length === 0 ? "initial" : "intermediate",
        transitions: [],
      },
    ]);
  }

  // Handle Node Deletion/Selection
  function handleNodeClick(id: number) {
    if (!layerRef.current) return;

    // If editor state is set to delete mode, remove the state
    const clickedNode = layerRef.current.findOne(
      `#${id}`,
    ) as Konva.Circle | null;

    if (currentEditorState === "delete") {
      const clickedGroup = layerRef.current.findOne(
        `#g${id}`,
      ) as Konva.Group | null;
      if (!clickedGroup) return;

      clickedGroup.destroy(); // Delete the Node

      transitions.forEach((tr) => {
        if (!tr) return;

        if (tr.from === id || tr.to === id) {
          const tre = layerRef.current!.findOne(
            `#tr${tr.id}`,
          ) as Konva.Arrow | null;
          if (tre) {
            tre.destroy(); // Delete the arrow
          }

          const trText = layerRef.current!.findOne(
            `#trtext${tr.id}`,
          ) as Konva.Text | null;
          if (trText) {
            trText.destroy(); // Also delete the Label of the transition
          }

          // Delete the transition for the other node participating in the state
          if (tr.from === id && tr.to !== undefined) {
            const aliveNodeTransitions = nodeList[tr.to]!.transitions;
            for (let i = 0; i < aliveNodeTransitions.length; i++) {
              if (aliveNodeTransitions[i].trId === tr.id) {
                aliveNodeTransitions.splice(i, 1);
                break;
              }
            }
          } else if (tr.to === id && tr.from !== undefined) {
            const aliveNodeTransitions = nodeList[tr.from]!.transitions;
            for (let i = 0; i < aliveNodeTransitions.length; i++) {
              if (aliveNodeTransitions[i].trId === tr.id) {
                aliveNodeTransitions.splice(i, 1);
                break;
              }
            }
          }

          // remove the arrow entry from the array (keep index holes)
          delete (transitions as unknown as Array<typeof tr | undefined>)[
            tr.id
          ];
        }
      });

      updateTransitions(transitions);

      // Update the nodeList store (keep index holes)
      delete (nodeList as unknown as Array<Node | undefined>)[id];
      updateNodeList(nodeList);

      // If the deleted Node is the one currently selected
      // Then deselect it
      if (currSelected === String(id)) setCurrSelected("nil");

      return;
    }

    // If current editor state is connect
    if (currentEditorState === "connect") {
      // Track which two states are clicked on
      if (transitionTracker === undefined) {
        setTransitionTracker(id);
        return;
      } else {
        const fromNode = nodeList[transitionTracker];
        const toNode = nodeList[id];
        if (!fromNode || !toNode) {
          setTransitionTracker(undefined);
          return;
        }

        // Checks if a transition between selected state(s) already exists to prevent dupe transitions
        for (const tr of fromNode.transitions) {
          if (tr.to !== null && tr.to === id) {
            setTransitionTracker(undefined);
            setAlertMsg("This transition already exists!");
            setTimeout(() => setAlertMsg("nil"), 3000);
            return;
          }
        }

        const points = getPoints(transitionTracker, id);

        // Decide if this edge is actually curved (middle point not collinear).
        const isCurved =
          points.length === 6 &&
          Math.abs(
            (points[2] - points[0]) * (points[5] - points[1]) -
              (points[3] - points[1]) * (points[4] - points[0]),
          ) > 0.01;

        const newTransition = {
          id: transitions.length,
          from: transitionTracker,
          to: id,
          points,
          stroke: "#ffffffe6",
          strokeWidth: 2,
          fill: "#ffffffe6",
          name: `transition ${transitions.length + 1}`,
          // self-loop gets tension 1, curved bidirectional edges get 0.5, straight edges 0
          tension: transitionTracker === id ? 1 : isCurved ? 0.5 : 0,
        };

        transitions.push(newTransition);

        // If this new edge completes a bidirectional pair, also curve the reverse edge.
        if (transitionTracker !== id) {
          const reverse = transitions.find(
            (tr, index) =>
              index !== newTransition.id &&
              tr &&
              tr.from === id &&
              tr.to === transitionTracker,
          );
          if (reverse) {
            // Recompute its points now that a back-edge exists;
            // computeArrowPoints will pick the opposite `side`.
            reverse.points = getPoints(reverse.from, reverse.to);
            reverse.tension = 0.5;
          }
        }

        updateTransitions([...transitions]);

        // Add this transition to the corresponding node
        fromNode.transitions.push({
          from: undefined,
          to: id,
          trId: transitions.length - 1,
        });

        toNode.transitions.push({
          from: transitionTracker,
          to: undefined,
          trId: transitions.length - 1,
        });

        updateNodeList(nodeList);
        setTransitionTracker(undefined);
        return;
      }
    }

    if (!clickedNode) return;

    // Draw a stroke around the selected node
    clickedNode.to({
      duration: 0.1,
      strokeWidth: 2,
      easing: Konva.Easings.EaseInOut,
    });

    // Deselect the old node if any available
    if (currSelected !== "nil") {
      const oldNode = layerRef.current.findOne(
        `#${currSelected}`,
      ) as Konva.Circle | null;

      if (oldNode) {
        oldNode.to({
          duration: 0.1,
          strokeWidth: 0,
          easing: Konva.Easings.EaseInOut,
        });
      }
    }

    // If same node is clicked, toggle selection
    if (currSelected === String(id)) {
      setCurrSelected("nil");
    } else {
      // Update value of current selected
      setCurrSelected(String(id));
    }
  }

  // Handle Updating Node Positions when dragged around
  function handleNodeDrag(id: number) {
    if (!layerRef.current) return;

    const draggedNode = layerRef.current.findOne(
      `#g${id}`,
    ) as Konva.Group | null;
    if (!draggedNode) return;

    if (!nodeList[id]) return;

    nodeList[id]!.x = draggedNode.x();
    nodeList[id]!.y = draggedNode.y();
    updateNodeList(nodeList);

    // Update position of arrows if they exist
    if (nodeList[id]!.transitions.length > 0) {
      nodeList[id]!.transitions.forEach((tr) => {
        let points: number[] = [];

        if (tr.from === undefined && tr.to !== undefined) {
          points = getPoints(id, tr.to);
        }

        if (tr.to === undefined && tr.from !== undefined) {
          points = getPoints(tr.from, id);
        }

        // Update points in the global store
        transitions[tr.trId].points = points;
        updateTransitions(transitions);

        // Update position on the editor
        const arr = layerRef.current!.findOne(
          `#tr${tr.trId}`,
        ) as Konva.Arrow | null;
        if (arr) {
          arr.points(points);
        }

        // Update Position of text
        const trText = layerRef.current!.findOne(
          `#trtext${tr.trId}`,
        ) as Konva.Text | null;
        if (trText) {
          trText.x(points[2] - 3 * transitions[tr.trId].name.length);
          trText.y(points[3] - 30);
        }
      });
    }
  }

  // Handle Zoom control for the editor
  function handleWheel(e: KonvaEventObject<WheelEvent>) {
    e.evt.preventDefault();

    const stage = stageRef.current;
       if (!stage) return;

    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    // how to scale? Zoom in? Or zoom out?
    let direction = e.evt.deltaY > 0 ? 1 : -1;

    // when we zoom on trackpad, e.evt.ctrlKey is true
    // in that case lets revert direction
    if (e.evt.ctrlKey) {
      direction = -direction;
    }

    const scaleBy = 1.01;
    const newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;

    stage.scale({ x: newScale, y: newScale });

    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    };
    stage.position(newPos);
  }

  return (
    <>
      <Stage
        width={window.innerWidth}
        height={window.innerHeight}
        draggable={currentEditorState === "grab"}
        onClick={handleEditorClick}
        ref={stageRef}
        onWheel={handleWheel}
      >
        <Layer ref={layerRef}>
          <Group>
            {nodeList.map(
              (node) =>
                node && (
                  <Group
                    key={node.name}
                    x={node.x}
                    y={node.y}
                    id={`g${node.id}`}
                    draggable={
                      !["create", "delete"].includes(currentEditorState)
                    }
                    onClick={() => handleNodeClick(node.id)}
                    onDragMove={() => handleNodeDrag(node.id)}
                  >
                    <Circle
                      x={0}
                      y={0}
                      id={`${node.id}`}
                      radius={2 * node.name.length + node.radius}
                      fill={node.fill}
                      strokeWidth={node.strokeWidth}
                      stroke={node.strokeColor}
                    />

                    {/* If state is final, draw an extra outer circle */}
                    {node.type === "final" && (
                      <Circle
                        x={0}
                        y={0}
                        id={`${node.id}`}
                        radius={2 * node.name.length + node.radius + 5}
                        fill={"transparent"}
                        strokeWidth={3}
                        stroke={node.fill}
                      />
                    )}

                    <Text
                      x={-node.radius - node.name.length / 2}
                      y={-node.radius / 3.5}
                      width={2 * node.radius + node.name.length}
                      height={2 * node.radius}
                      text={node.name}
                      fontSize={20}
                      fill="#ffffff"
                      align="center"
                    />

                    {/* If state is initial, draw an incoming arrow */}
                    {node.type === "initial" && (
                      <Arrow
                        x={-1 * (node.radius + 40)}
                        id="startarrow"
                        y={0}
                        points={[-node.radius / 1.5, 0, node.radius - 5, 0]}
                        pointerLength={10}
                        pointerWidth={10}
                        fill={"#ffffff80"}
                        stroke={"#ffffff80"}
                        strokeWidth={3}
                      />
                    )}
                  </Group>
                ),
            )}
            {/* Transition Arrows */}
            {transitions.map(
              (tr) =>
                tr && (
                  <Group key={tr.id}>
                    {/* Transition arrow object */}
                    <Arrow
                      key={tr.id}
                      id={`tr${tr.id}`}
                      stroke={tr.stroke}
                      strokeWidth={tr.strokeWidth}
                      fill={tr.fill}
                      points={tr.points}
                      tension={tr.tension}
                    />
                    {/* Add a Label to the middle of the arrow */}
                    <Text
                      id={`trtext${tr.id}`}
                      x={tr.points[2] - 2 * tr.name.length}
                      y={tr.points[3] - 30}
                      text={tr.name}
                      fontSize={16}
                      fill="#ffffff"
                      align="center"
                      onClick={() =>
                        currentEditorState !== "create" &&
                        currentEditorState !== "delete" &&
                        setTrNameEditor([true, tr.name, tr.id])
                      }
                    />
                  </Group>
                ),
            )}
          </Group>
        </Layer>
      </Stage>

      {/* Popup window to edit name of transition */}
      <TransitionNameEditor showVar={trNameEditor[0]}>
        <span className="absolute text-center leading-13 w-fit px-2 h-15 bg-primary-bg border border-border-bg rounded-2xl shadow-[0px_0px_100px_0px_#000000] transition-all ease-in-out duration-300 flex justify-center items-center">
          <input
            type="text"
            placeholder="Enter State Name..."
            value={trNameEditor[1]}
            onChange={(e) => {
              setTrNameEditor([true, e.target.value, trNameEditor[2]]);
            }}
            className="text-white font-github text-base px-2 border border-border-bg hover:border-input-active focus:border-2 focus:border-blue-500 transition-all ease-in-out outline-none w-full h-10 rounded-lg"
          />

          <button
            onClick={() => setTrNameEditor([false, "", undefined])}
            className="rounded-xl text-black bg-white ml-2 px-2 py-2 hover:scale-110 transition-all cursor-pointer active:scale-95 ease-in-out"
          >
            <X size={20} color="#000000" />
          </button>

          <button
            onClick={() => {
              if (!layerRef.current) return;

              const transitionIndex = trNameEditor[2];
              if (transitionIndex === undefined) return;

              const trText = layerRef.current.findOne(
                `#trtext${transitionIndex}`,
              ) as Konva.Text | null;

              if (trNameEditor[1].trim().length === 0) return; // Prevent empty transition names

              if (!trText) return;

              trText.text(trNameEditor[1]); // Update transition text
              transitions[transitionIndex].name = trNameEditor[1]; // Update transition name in store
              updateTransitions(transitions);

              // Update location of text
              trText.x(
                transitions[transitionIndex].points[2] -
                  3 * trNameEditor[1].length,
              );
              trText.y(transitions[transitionIndex].points[3] - 20);

              // Reset editor state
              setTrNameEditor([false, "", undefined]);
            }}
            className="rounded-xl text-black bg-blue-500 ml-2 px-2 py-2 hover:scale-110 transition-all cursor-pointer active:scale-95 ease-in-out"
          >
            <Check size={20} color="#ffffff" />
          </button>
        </span>
      </TransitionNameEditor>

      {/* Popup for Save FSM */}
      <TransitionNameEditor showVar={showSaveFSM}>
        <span className="absolute text-center leading-13 w-fit px-2 h-15 bg-primary-bg border border-border-bg rounded-2xl shadow-[0px_0px_100px_0px_#000000] transition-all ease-in-out duration-300 flex justify-center items-center">
          <select
            value={saveFSM[0]}
            onChange={(e) => {
              setSaveFSM([parseInt(e.target.value, 10), saveFSM[1]]);
            }}
            className="text-white font-github text-base px-2 border border-border-bg hover:border-input-active focus:border-2 focus:border-blue-500 transition-all ease-in-out outline-none h-10 rounded-lg mr-2"
          >
            <option value={1}>1x</option>
            <option value={2}>2x</option>
            <option value={3}>3x</option>
            <option value={4}>4x</option>
            <option value={5}>5x</option>
          </select>

          <input
            type="text"
            placeholder="Enter File Name..."
            value={saveFSM[1]}
            required
            onChange={(e) => {
              setSaveFSM([saveFSM[0], e.target.value]);
            }}
            className="text-white font-github text-base px-2 border border-border-bg hover:border-input-active focus:border-2 focus:border-blue-500 transition-all ease-in-out outline-none w-full h-10 rounded-lg"
          />

          <button
            onClick={() => {
              setShowSaveFSM(false);
              setSaveFSM([1, ""]);
            }}
            className="rounded-xl text-black bg-white ml-2 px-2 py-2 hover:scale-110 transition-all cursor-pointer active:scale-95 ease-in-out"
          >
            <X size={20} color="#000000" />
          </button>

          <button
            onClick={() => {
              // Save the FSM to disk

              if (saveFSM[1].trim() === "") {
                window.alert("Enter a valid file name");
                return;
              }

              if (!layerRef.current) return;

              const group = layerRef.current.findOne(
                "Group",
              ) as Konva.Node | null;
              if (!group) return;

              const dataUrl = group.toDataURL({
                pixelRatio: saveFSM[0], // Resolution
              });

              const link = document.createElement("a");

              link.download = saveFSM[1]; // Name
              link.href = dataUrl;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);

              setShowSaveFSM(false);
            }}
            className="rounded-xl text-black bg-blue-500 ml-2 px-2 py-2 hover:scale-110 transition-all cursor-pointer active:scale-95 ease-in-out"
          >
            <Check size={20} color="#ffffff" />
          </button>
        </span>
      </TransitionNameEditor>
    </>
  );
};

// Transition Name Editor
function TransitionNameEditor(props: { children: ReactNode; showVar: boolean }) {
  return (
    <div
      className={clsx(
        "select-none w-full h-20 absolute z-50 mx-auto flex justify-center items-center transition-all ease-in-out duration-300",
        {
          "-top-50": !props.showVar,
          "top-0 focus": props.showVar,
        },
      )}
    >
      {props.children}
    </div>
  );
}

export default Editor;
