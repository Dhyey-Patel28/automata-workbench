export default function Credits() {
    return (
        <div className="fixed left-3 z-10 select-none text-xs font-github text-white/50 hover:text-white/80 bottom-20 sm:bottom-3">
            <a
                href="https://github.com/karthik-saiharsh/fsm-engine/tree/ecf47d0293c1cf5d07395802e094c26694fed997"
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-2"
            >
                Based on FSM Engine
            </a>
            <span className="mx-1">by</span>
            <a
                href="https://github.com/karthik-saiharsh"
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-2"
            >
                Karthik Saiharsh
            </a>
            <span className="mx-2">•</span>
            <span>GPL-3.0</span>
            <span className="mx-2">•</span>
            <a
                href="https://github.com/Dhyey-Patel28/automata-workbench"
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-2"
            >
                Source
            </a>
        </div>
    );
}