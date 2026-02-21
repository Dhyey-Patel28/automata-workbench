# Automata Workbench

A web-based workspace for building and exploring **finite automata** (DFA/NFA) and **regular expressions** on an interactive canvas.

> This project is a derivative of **FSM Engine** by **Karthik Saiharsh** (GPL-3.0).  
> Upstream snapshot used as a base: `karthik-saiharsh/fsm-engine` @ `ecf47d0`  
> https://github.com/karthik-saiharsh/fsm-engine/tree/ecf47d0293c1cf5d07395802e094c26694fed997

## Live Demo
- (Add your Vercel URL here)

## What’s different from FSM Engine (upstream `ecf47d0`)
This fork focuses on **automata theory workflows** and a **cleaner dashboard UX**.

## Attribution & License
- This project is based on FSM Engine by Karthik Saiharsh, licensed under GPL-3.0.
  - Upstream repo: https://github.com/karthik-saiharsh/fsm-engine
  - Upstream snapshot used: ecf47d0 (link above)
- This fork’s source code is available here: https://github.com/Dhyey-Patel28/automata-workbench
  - Not affiliated with the upstream author/project.

### Added / changed in this fork
- **Cleaner dashboard**
  - Reduced dock clutter (core actions visible; secondary tools grouped)
  - Tutorial/help no longer auto-opens on startup (can be opened manually)
- **Automata utilities**
  - Regex → automaton workflow
  - NFA → DFA + minimization workflow
  - DFA → Regex export
- **Project polish**
  - Clear on-page attribution + source link
  - README rewritten to reflect fork goals and changes

## Core Features
- Infinite canvas FSM editor (pan/zoom, drag states)
- Create / Connect / Delete modes
- Initial / intermediate / final state types
- Curved transitions that update dynamically as states move
- Export/convert tools (see “Automata utilities” above)

## Tech Stack
- React + TypeScript
- Vite
- Tailwind CSS
- Jotai (state)
- React Konva (canvas)
- lucide-react (icons)

## Local Development
```bash
npm install
npm run dev