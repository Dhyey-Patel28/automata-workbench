import {
  Move3d,
  PlusCircleIcon,
  MinusCircleIcon,
  Settings,
  Cable,
  HardDriveDownload,
  ArrowRightFromLine,
  BookMarked,
  Code2,
  GitBranch,
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

const Dock = () => {
  const DockIconSize = 24;
  const DockIconColor = "#ffffff";

  // Global editor state store
  const currentState = useAtomValue(editorState);
  const setCurrentState = useSetAtom(editorState);

  const currSelected = useAtomValue(currentSelected);

  const setAlertMsg = useSetAtom(alertAtom);

  const setTransitionTracker = useSetAtom(arrowStates);

  const setSaveFSM = useSetAtom(saveFSMAtom);
  const saveFSM = useAtomValue(saveFSMAtom);

  const setRegexModal = useSetAtom(regexToDfaAtom);
  const regexModalOpen = useAtomValue(regexToDfaAtom);

  // node / transition / start state atoms
  const nodeList: Node[] = useAtomValue(Nodes);
  const setNodes = useSetAtom(Nodes);

  const transitions = useAtomValue(arrows);
  const setTransitions = useSetAtom(arrows);

  const setStartState = useSetAtom(start_state);
  const setCurrentSelected = useSetAtom(currentSelected);
  const setRegexResult = useSetAtom(dfaToRegexResultAtom);

  // helper for alerts
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
      // Store regex in atom; a dedicated popup component can read & display
      setRegexResult(regex);
    } catch (err) {
      console.error(err);
      const msg =
        err instanceof Error ? err.message : "Error converting DFA to regex.";
      showAlert(msg);
    }
  }

  // Dock Items
  const DockItems = [
    {
      name: "Displace",
      condition: [currentState != "grab", currentState == "grab"],
      icon: (
        <Move3d
          size={DockIconSize}
          color={DockIconColor}
          className="pointer-events-none"
        />
      ),
      onclick: () => {
        setCurrentState(currentState === "grab" ? "nil" : "grab");
      },
    },
    {
      name: "Add",
      condition: [currentState != "create", currentState == "create"],
      icon: (
        <PlusCircleIcon
          size={DockIconSize}
          color={DockIconColor}
          className="pointer-events-none"
        />
      ),
      onclick: () => {
        setCurrentState(currentState === "create" ? "nil" : "create");
      },
    },
    {
      name: "Delete",
      condition: [currentState != "delete", currentState == "delete"],
      icon: (
        <MinusCircleIcon
          size={DockIconSize}
          color={DockIconColor}
          className="pointer-events-none"
        />
      ),
      onclick: () => {
        setCurrentState(currentState === "delete" ? "nil" : "delete");
      },
    },
    {
      name: "Controls",
      condition: [currentState != "settings", currentState == "settings"],
      icon: (
        <Settings
          size={DockIconSize}
          color={DockIconColor}
          className="pointer-events-none"
        />
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
        <Cable
          size={DockIconSize}
          color={DockIconColor}
          className="pointer-events-none"
        />
      ),
      onclick: () => {
        if (currentState == "connect") setCurrentState("nil");
        else {
          setCurrentState("connect");
          setTransitionTracker(undefined);
        }
      },
    },
    {
      name: "Regex to DFA",
      condition: [!regexModalOpen, regexModalOpen],
      icon: (
        <Code2
          size={DockIconSize}
          color={DockIconColor}
          className="pointer-events-none"
        />
      ),
      onclick: () => setRegexModal(!regexModalOpen),
    },
    {
      name: "DFA → Regex",
      condition: [true, false],
      icon: (
        <Code2
          size={DockIconSize}
          color={DockIconColor}
          className="pointer-events-none"
        />
      ),
      onclick: handleDfaToRegexClick,
    },
    {
      name: "NFA → Min DFA",
      condition: [true, false], // not a toggle; just an action
      icon: (
        <GitBranch
          size={DockIconSize}
          color={DockIconColor}
          className="pointer-events-none"
        />
      ),
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
      name: "Save FSM",
      condition: [!saveFSM, saveFSM],
      icon: (
        <HardDriveDownload
          size={DockIconSize}
          color={DockIconColor}
          className="pointer-events-none"
        />
      ),
      onclick: () => setSaveFSM(!saveFSM),
    },
    {
      name: "Export data",
      condition: [true, false], // just an action
      icon: (
        <ArrowRightFromLine
          size={DockIconSize}
          color={DockIconColor}
          className="pointer-events-none"
        />
      ),
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
      name: "Welcome",
      condition: [currentState != "welcome", currentState == "welcome"],
      icon: (
        <BookMarked
          size={DockIconSize}
          color={DockIconColor}
          className="pointer-events-none"
        />
      ),
      onclick: () => {
        setCurrentState(currentState === "welcome" ? "nil" : "welcome");
      },
    },
  ];

  return (
    <div className="absolute bottom-5 w-screen h-15 flex justify-center items-center select-none max-lg:hidden">
      <div className="w-fit px-2 h-15 z-10 bg-secondary-bg rounded-2xl border border-border-bg flex justify-center items-center gap-5 shadow-[0px_0px_40px_0px_rgba(0,0,0,0.5)]">
        {/* Dock Items */}
        {DockItems.map((item) => (
          <div
            key={item.name}
            onClick={item.onclick}
            className={clsx(
              "flex gap-2 p-2 border border-border-bg rounded-xl hover:scale-110 hover:-translate-y-3 active:scale-100 cursor-pointer transition-all ease-in-out duration-300",
              {
                "bg-secondary-bg": item.condition[0],
                "bg-blue-500": item.condition[1],
              },
            )}
          >
            {item.icon}
            <p className="text-white font-github font-semibold text-balance">
              {item.name}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dock;
