export type TopDockScrollBehavior = "smart" | "sticky" | "static";
export declare function attachTopDockScroll(
  target: HTMLElement | null,
  behavior?: TopDockScrollBehavior,
): () => void;
