// frontend/src/components/DfaToRegexModal.tsx
import { useAtom } from "jotai";
import { dfaToRegexResultAtom } from "../lib/backend";

const DfaToRegexModal = () => {
  const [regex, setRegex] = useAtom(dfaToRegexResultAtom);

  if (!regex) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      aria-modal="true"
      role="dialog"
    >
      <div className="bg-primary-bg border border-border-bg rounded-2xl shadow-[0_0_80px_0_#000] max-w-xl w-[90%] p-6 text-white relative">
        <button
          onClick={() => setRegex(null)}
          className="absolute top-3 right-3 rounded-full bg-white/10 hover:bg-white/20 px-3 py-1 text-sm"
        >
          ✕
        </button>
        <h2 className="text-xl font-semibold mb-3">
          Equivalent Regular Expression
        </h2>
        <p className="font-mono wrap-break-word whitespace-pre-wrap bg-black/30 rounded-lg p-3 text-sm">
          {regex}
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={() => {
              void navigator.clipboard
                .writeText(regex)
                .catch(() => {
                  // ignore clipboard failure
                });
            }}
            className="rounded-lg bg-blue-500 hover:bg-blue-600 px-3 py-1 text-sm"
          >
            Copy
          </button>
          <button
            onClick={() => setRegex(null)}
            className="rounded-lg bg-white/10 hover:bg-white/20 px-3 py-1 text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default DfaToRegexModal;
