// frontend/src/lib/backend.ts
import { atom } from "jotai";

export type NodeTransition = {
	from?: number;
	to?: number;
	trId: number;
};

export type Node = {
	x: number;
	y: number;
	radius: number;
	fill: string;
	id: number;
	strokeWidth: number;
	strokeColor: string;
	name: string;
	type: "initial" | "final" | "intermediate";
	transitions: NodeTransition[];
	isFinal?: boolean;
};

export type Arrow = {
	id: number;
	from: number;
	to: number;
	points: number[];
	stroke: string;
	strokeWidth: number;
	fill: string;
	name: string;
	tension: number;
};

export const editorState = atom("nil");

export const Nodes = atom<Node[]>([]);

export const currentSelected = atom("nil");

export const alert = atom("nil");

export const arrows = atom<Arrow[]>([]);

export const arrowStates = atom<number | undefined>(undefined);

export const saveFSMAtom = atom(false);

export const recentStateSave = atom("nil");

export const start_state = atom("nil");

export const regexToDfaAtom = atom(false);

export const dfaToRegexResultAtom = atom<string | null>(null);