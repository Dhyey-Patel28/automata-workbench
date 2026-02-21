import {
  Move3d,
  PlusCircleIcon,
  MinusCircleIcon,
  Settings,
  Cable,
  HardDriveDownload,
  ArrowRightFromLine,
  Code2,
  GitBranch,
  MoreHorizontal,
  HelpCircle,
} from "lucide-react";
import clsx from "clsx";
import { nfaToMinimalDfa } from "../lib/nfaToDfa";
import { dfaToRegex } from "../lib/dfaToRegex";
import {
  editorState,
  currentSelected,
  alert as alertAtom,
  dfaToRegexResultAtom,
  arrowStates,
  saveFSMAtom,
  Nodes,
  regexToDfaAtom,
  arrows,
  start_state,
} from "../lib/backend";
import type { Node } from "../lib/backend";
import { useSetAtom, useAtomValue } from "jotai";
import { useState } from "react";

const Dock = () => {
  const DockIconSize = 24;
  const DockIconColor = "#ffffff";

  const [toolsOpen, setToolsOpen] = useState(false);

  const currentState = useAtomValue(editorState);
  const setCurrentState = useSetAtom(editorState);

  const currSelected = useAtomValue(currentSelected);

  const setAlertMsg = useSetAtom(alertAtom);
  const setTransitionTracker = useSetAtom(arrowStates);

  const setSaveFSM = useSetAtom(saveFSMAtom);
  const saveFSM = useAtomValue(saveFSMAtom);

  const setRegexModal = useSetAtom(regexToDfaAtom);
  const regexModalOpen = useAtomValue(regexToDfaAtom);

  const nodeList: Node[] = useAtomValue(Nodes);
  const setNodes = useSetAtom(Nodes);

  const transitions = useAtomValue(arrows);
  const setTransitions = useSetAtom(arrows);

  const setStartState = useSetAtom(start_state);
  const setCurrentSelected = useSetAtom(currentSelected);
  const setRegexResult = useSetAtom(dfaToRegexResultAtom);

  const showAlert = (message: string) => {
    setAlertMsg(message);
    setTimeout(() => setAlertMsg("nil"), 3000);
  };

  function handleDfaToRegexClick() {
    try {
      const { regex } = dfaToRegex(nodeList, transitions);
      if (!regex || regex.trim() === "") {
        showAlert("Could not derive a regex from the current DFA.");
        return;
      }
      setRegexResult(regex);
    } catch (err) {
      console.error(err);
      const msg =
        err instanceof Error ? err.message : "Error converting DFA to regex.";
      showAlert(msg);
    }
  }

  // Always-visible modes (icon-only)
  const ModeItems = [
    {
      name: "Pan",
      condition: [currentState != "grab", currentState == "grab"],
      icon: (
        <Move3d size={DockIconSize} color={DockIconColor} className="pointer-events-none" />
      ),
      onclick: () => setCurrentState(currentState === "grab" ? "nil" : "grab"),
    },
    {
      name: "Add state",
      condition: [currentState != "create", currentState == "create"],
      icon: (
        <PlusCircleIcon size={DockIconSize} color={DockIconColor} className="pointer-events-none" />
      ),
      onclick: () => setCurrentState(currentState === "create" ? "nil" : "create"),
    },
    {
      name: "Delete",
      condition: [currentState != "delete", currentState == "delete"],
      icon: (
        <MinusCircleIcon size={DockIconSize} color={DockIconColor} className="pointer-events-none" />
      ),
      onclick: () => setCurrentState(currentState === "delete" ? "nil" : "delete"),
    },
    {
      name: "State settings",
      condition: [currentState != "settings", currentState == "settings"],
      icon: (
        <Settings size={DockIconSize} color={DockIconColor} className="pointer-events-none" />
      ),
      onclick: () => {
        if (currSelected !== "nil") {
          setCurrentState(currentState === "settings" ? "nil" : "settings");
        } else {
          showAlert("You must select a State to view its Settings!");
        }
      },
    },
    {
      name: "Connect",
      condition: [currentState != "connect", currentState == "connect"],
      icon: (
        <Cable size={DockIconSize} color={DockIconColor} className="pointer-events-none" />
      ),
      onclick: () => {
        if (currentState == "connect") setCurrentState("nil");
        else {
          setCurrentState("connect");
          setTransitionTracker(undefined);
        }
      },
    },
  ];

  // Collapsed tools (opens from the “…” button)
  const ToolItems = [
    {
      name: "Regex → DFA",
      active: regexModalOpen,
      icon: <Code2 size={DockIconSize} color={DockIconColor} className="pointer-events-none" />,
      onclick: () => setRegexModal(!regexModalOpen),
    },
    {
      name: "DFA → Regex",
      active: false,
      icon: <Code2 size={DockIconSize} color={DockIconColor} className="pointer-events-none" />,
      onclick: handleDfaToRegexClick,
    },
    {
      name: "NFA → Min DFA",
      active: false,
      icon: <GitBranch size={DockIconSize} color={DockIconColor} className="pointer-events-none" />,
      onclick: () => {
        try {
          const result = nfaToMinimalDfa(nodeList, transitions);
          setNodes(result.nodes);
          setTransitions(result.transitions);
          setStartState(result.startId);
          setCurrentSelected("nil");
          setTransitionTracker(undefined);
          setCurrentState("nil");
          showAlert("Converted NFA to minimal DFA");
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : "Failed to convert NFA to minimal DFA";
          showAlert(message);
        }
      },
    },
    {
      name: saveFSM ? "Save FSM (on)" : "Save FSM",
      active: saveFSM,
      icon: <HardDriveDownload size={DockIconSize} color={DockIconColor} className="pointer-events-none" />,
      onclick: () => setSaveFSM(!saveFSM),
    },
    {
      name: "Export JSON",
      active: false,
      icon: <ArrowRightFromLine size={DockIconSize} color={DockIconColor} className="pointer-events-none" />,
      onclick: () => {
        const simplifiedJsonData = nodeList.map((node) => ({
          name: node.name,
          id: node.id,
          type: node.type,
          transitions: node.transitions,
        }));
        window.alert(JSON.stringify(simplifiedJsonData));
      },
    },
    {
      name: "Tutorial / Help",
      active: currentState === "welcome",
      icon: <HelpCircle size={DockIconSize} color={DockIconColor} className="pointer-events-none" />,
      onclick: () => setCurrentState(currentState === "welcome" ? "nil" : "welcome"),
    },
  ];

  return (
    <div className="absolute bottom-5 w-screen flex justify-center items-center select-none max-lg:hidden">
      <div className="relative w-fit px-2 h-14 z-10 bg-secondary-bg rounded-2xl border border-border-bg flex justify-center items-center gap-2 shadow-[0px_0px_30px_0px_rgba(0,0,0,0.45)]">
        {ModeItems.map((item) => (
          <button
            key={item.name}
            type="button"
            title={item.name}
            onClick={() => {
              item.onclick();
              setToolsOpen(false);
            }}
            className={clsx(
              "flex items-center justify-center p-3 border border-border-bg rounded-xl cursor-pointer transition-all duration-200",
              {
                "bg-secondary-bg hover:scale-105": item.condition[0],
                "bg-blue-500": item.condition[1],
              },
            )}
          >
            {item.icon}
          </button>
        ))}

        <div className="h-8 w-px bg-border-bg/80 mx-1" />

        <button
          type="button"
          title="Tools"
          onClick={() => setToolsOpen((v) => !v)}
          className={clsx(
            "flex items-center justify-center p-3 border border-border-bg rounded-xl cursor-pointer transition-all duration-200 hover:scale-105",
            { "bg-blue-500": toolsOpen, "bg-secondary-bg": !toolsOpen },
          )}
        >
          <MoreHorizontal size={DockIconSize} color={DockIconColor} className="pointer-events-none" />
        </button>

        {toolsOpen && (
          <div className="absolute bottom-16 right-0 w-56 bg-primary-bg border border-border-bg rounded-2xl shadow-[0px_0px_60px_0px_rgba(0,0,0,0.55)] p-2">
            {ToolItems.map((tool) => (
              <button
                key={tool.name}
                type="button"
                title={tool.name}
                onClick={() => {
                  tool.onclick();
                  setToolsOpen(false);
                }}
                className={clsx(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-xl border border-transparent hover:border-border-bg transition-all",
                  { "bg-blue-500/20": tool.active },
                )}
              >
                {tool.icon}
                <span className="text-white font-github text-sm">{tool.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dock;