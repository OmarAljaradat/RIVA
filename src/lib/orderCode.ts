export function formatOrderNumber(id: number | string): string {
  const num = Number(id) || 0;
  return `RIVA-${1000 + num}`;
}
