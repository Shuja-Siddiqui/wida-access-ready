export function evalSequence(items: string[], correctOrder: number[], sel: number[]): boolean {
  if (sel.length !== items.length) return false;
  const sorted = items.map((_, i) => i).sort((a, b) => correctOrder[a] - correctOrder[b]);
  return sel.every((v, i) => v === sorted[i]);
}

export function evalMatch(pairs: [number, number][], correctPairs: [number, number][]): boolean {
  if (pairs.length !== correctPairs.length) return false;
  return correctPairs.every(([l, r]) => pairs.some(([pl, pr]) => pl === l && pr === r));
}

export function evalClassify(map: Record<number, number>, correct: number[], itemCount: number): boolean {
  if (Object.keys(map).length < itemCount) return false;
  return correct.every((cat, i) => map[i] === cat);
}
