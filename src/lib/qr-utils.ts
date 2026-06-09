const UNIT_QR_RE = /^(.+)-(\d+)\/(\d+)$/;

export function parseControlNumber(input: string): { base: string; unit?: number; total?: number } {
  const match = input.match(UNIT_QR_RE);
  if (match) {
    return {
      base: match[1],
      unit: parseInt(match[2], 10),
      total: parseInt(match[3], 10),
    };
  }
  return { base: input };
}

export function formatUnitControlNumber(base: string, unit: number, total: number): string {
  return `${base}-${unit}/${total}`;
}
