// frontend/src/App.tsx
import Alert from "./components/Alert";
import Dock from "./components/Dock";
import Editor from "./components/Editor";
import Settings from "./components/Settings";
import Error from "./components/Error";
import Welcome from "./components/Welcome";
import Credits from "./components/Credits";
import RegexToDfaModal from "./components/RegexToDfaModal";
import DfaToRegexModal from "./components/DfaToRegexModal";
import { alert} from "./lib/backend";
import { useAtomValue } from "jotai";

// @ts-expect-error GridLines
import GridLines from "react-gridlines";

function App() {
  const alertMsg = useAtomValue(alert);

  return (
    <>
      <div
        id="editorwin"
        className="w-screen h-[100dvh] overflow-hidden bg-primary-bg"
      >
        <GridLines
          className="grid-area"
          cellWidth={100}
          strokeWidth={3}
          cellWidth2={10}
          lineColor="#ffffff1a"
          lineColor2="#ffffff0a"
        >
          <Editor />
        </GridLines>
      </div>

      <Dock />
      <Credits />
      <RegexToDfaModal />
	    <DfaToRegexModal />
      <Settings />
      <Alert message={alertMsg} />
      <Error />
      <Welcome />
    </>
  );
}

export default App;
