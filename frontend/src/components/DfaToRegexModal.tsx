// @ts-nocheck
import { useState } from "react";
import clsx from "clsx";
import { useAtom, useSetAtom, useAtomValue } from "jotai";
import {
    alert,
    Nodes,
    arrows,
    start_state,
    dfaToRegexAtom,
} from "../lib/backend";
import { dfaToRegex } from "../lib/dfaToRegex";
import { ScrollText, X } from "lucide-react";

// The component responsible for displaying the conversion result
const DfaToRegexModal = () => {
    // State management for modal visibility
    const [isOpen, setIsOpen] = useAtom(dfaToRegexAtom);

    // State management for displaying the result and loading
    const [resultRegex, setResultRegex] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    // Get the current DFA data from Jotai store
    const currentNodes = useAtomValue(Nodes);
    const currentArrows = useAtomValue(arrows);
    const currentStartState = useAtomValue(start_state);

    const setAlert = useSetAtom(alert);

    const closeModal = () => {
        setIsOpen(false);
        setResultRegex("");
    };

    const showAlert = (message: string) => {
        setAlert(message);
        setTimeout(() => setAlert("nil"), 3000);
    };

    const handleConvert = () => {
        if (!currentNodes || currentNodes.length === 0) {
            showAlert("The DFA is empty. Please draw a DFA first.");
            return;
        }

        setIsLoading(true);
        setResultRegex("");

        try {
            // Call the conversion function from dfaToRegex.ts
            const regex = dfaToRegex(
                currentNodes,
                currentArrows,
                currentStartState,
            );

            setResultRegex(regex || "The language is empty (L = Ø).");
            showAlert("DFA successfully converted to Regular Expression.");

        } catch (error) {
            const message =
                error instanceof Error
                    ? `Conversion Failed: ${error.message}`
                    : "An unexpected error occurred during conversion.";
            showAlert(message);
            setResultRegex("ERROR: Could not convert DFA. Check console for details.");
            console.error(error);
        } finally {
            setIsLoading(false);
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
                    "flex flex-col gap-4 w-[600px] max-w-lg bg-primary-bg border border-border-bg rounded-4xl shadow-[0px_0px_100px_0px_#00000080] p-8 transition-all ease-in-out duration-500",
                    {
                        "hidden pointer-events-none opacity-0 scale-0": !isOpen,
                    },
                )}
            >
                <div className="flex justify-between items-center">
                    <h2 className="text-white font-github text-2xl font-semibold">
                        DFA to Regular Expression
                    </h2>
                    <button onClick={closeModal} className="text-white hover:text-red-400 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <p className="text-white font-github text-base leading-6 text-left mb-2">
                    Use the State Elimination Method to derive the equivalent Regular Expression from the current DFA on the canvas.
                </p>

                <div className="flex gap-4">
                    <button
                        onClick={handleConvert}
                        disabled={isLoading}
                        className="flex-grow flex justify-center text-sm gap-2 font-github items-center rounded-xl text-white bg-green-600 px-4 py-3 hover:bg-green-700 transition-all cursor-pointer active:scale-[0.98] disabled:bg-gray-500 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <span className="animate-pulse">Converting...</span>
                        ) : (
                            <>
                                Convert DFA
                                <ScrollText size={18} color="#ffffff" />
                            </>
                        )}
                    </button>
                    <button
                        onClick={closeModal}
                        className="flex text-sm gap-2 font-github items-center rounded-xl text-black bg-white px-4 py-3 hover:scale-[1.02] transition-all cursor-pointer active:scale-[0.98] ease-in-out"
                    >
                        Close
                    </button>
                </div>

                {resultRegex && (
                    <div className="mt-4 p-4 bg-[#2a2a3a] border border-blue-500 rounded-lg">
                        <h3 className="text-blue-300 font-semibold mb-2">Resulting Regular Expression:</h3>
                        <code className="block p-3 bg-[#1e1e2d] text-yellow-300 rounded-md whitespace-pre-wrap break-all text-lg select-all">
                            {resultRegex}
                        </code>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DfaToRegexModal;