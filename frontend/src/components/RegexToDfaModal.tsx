// @ts-nocheck
import { useState } from "react";
import clsx from "clsx";
import { useAtom, useSetAtom } from "jotai";
import {
	alert,
	arrows,
	arrowStates,
	currentSelected,
	editorState,
	Nodes,
	regexToDfaAtom,
	start_state,
} from "../lib/backend";
import { regexToDfa } from "../lib/regexToDfa";
import { CircleCheck, CircleX } from "lucide-react";

const RegexToDfaModal = () => {
	const [isOpen, setIsOpen] = useAtom(regexToDfaAtom);
	const setNodes = useSetAtom(Nodes);
	const setTransitions = useSetAtom(arrows);
	const setSelected = useSetAtom(currentSelected);
	const setEditorState = useSetAtom(editorState);
	const setStartState = useSetAtom(start_state);
	const setAlert = useSetAtom(alert);
	const resetArrowTracker = useSetAtom(arrowStates);

	const [expression, setExpression] = useState("");

	const closeModal = () => {
		setIsOpen(false);
		setExpression("");
	};

	const showAlert = (message: string) => {
		setAlert(message);
		setTimeout(() => setAlert("nil"), 3000);
	};

	const handleGenerate = () => {
		try {
			const result = regexToDfa(expression);
			setNodes(result.nodes);
			setTransitions(result.transitions);
			setStartState(result.startId);
			setSelected("nil");
			resetArrowTracker(undefined);
			setEditorState("nil");
			setIsOpen(false);
			setExpression("");
			showAlert("DFA generated from regex");
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "Failed to convert regex";
			showAlert(message);
		}
	};

	return (
		<div
			className={clsx(
				"absolute top-0 left-0 z-30 w-screen h-screen bg-[#1e1e1ebb] flex justify-center items-center transition-all ease-in-out duration-500 max-lg:hidden",
				{
					"hidden pointer-events-none opacity-0": !isOpen,
				},
			)}
		>
			<div
				className={clsx(
					"flex flex-col gap-4 w-150 max-w-180 bg-primary-bg border border-border-bg rounded-4xl shadow-[0px_0px_100px_0px_#00000080] p-8 transition-all ease-in-out duration-500",
					{
						"hidden pointer-events-none opacity-0 scale-0": !isOpen,
					},
				)}
			>
				<h2 className="text-white font-github text-2xl font-semibold">
					Regex to DFA
				</h2>
				<p className="text-white font-github text-base leading-6 text-left">
					Enter a regex. Use <code className="text-blue-300">+</code> for union (
					<code className="text-blue-300">|</code> also works), parentheses for grouping,
					and <code className="text-blue-300">*</code> for repetition (0 or more). Example:
					<code className="text-blue-300"> (a+b)*a</code>
				</p>

				<input
					type="text"
					placeholder="Example: (a+b)*a"
					value={expression}
					onChange={(e) => setExpression(e.target.value)}
					className="text-white font-github text-base px-3 py-2 border border-border-bg hover:border-input-active focus:border-2 focus:border-blue-500 transition-all ease-in-out outline-none w-full h-12 rounded-lg bg-transparent"
				/>

				<div className="flex justify-end gap-3 mt-2">
					<button
						onClick={closeModal}
						className="flex text-sm gap-2 font-github items-center rounded-xl text-black bg-white px-4 py-2 hover:scale-110 transition-all cursor-pointer active:scale-100 ease-in-out"
					>
						Cancel
						<CircleX size={18} color="#000000" />
					</button>

					<button
						onClick={handleGenerate}
						className="flex text-sm gap-2 font-github items-center rounded-xl text-white bg-blue-500 px-4 py-2 hover:scale-110 transition-all cursor-pointer active:scale-100 ease-in-out"
					>
						Generate DFA
						<CircleCheck size={18} color="#ffffff" />
					</button>
				</div>
			</div>
		</div>
	);
};

export default RegexToDfaModal;
