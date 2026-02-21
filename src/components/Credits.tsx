export default function Credits() {
    return (
        <div className="fixed bottom-3 left-3 z-10 select-none text-xs font-github text-white/50 hover:text-white/80">
            <a
                href="https://github.com/karthik-saiharsh/fsm-engine"
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
        </div>
    );
}