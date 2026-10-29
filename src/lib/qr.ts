// Lightweight deterministic QR-style matrix generator (pure SVG, no deps).
// Not a real scannable QR code — a simulated visual pass token for the demo.

export function generateBookingCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'EMS-';
  for (let i = 0; i < 10; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function hashString(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function generateQrSvg(data: string, size = 160): string {
  const modules = 21;
  const cell = size / modules;
  let rects = '';
  for (let y = 0; y < modules; y++) {
    for (let x = 0; x < modules; x++) {
      const seed = hashString(`${data}|${x}|${y}|${x * y + 7}`);
      const on = (seed % 100) < 48;
      if (on) {
        rects += `<rect x="${x * cell}" y="${y * cell}" width="${cell}" height="${cell}" fill="currentColor"/>`;
      }
    }
  }
  // Position-detection squares (corner markers like a real QR)
  const drawFinder = (ox: number, oy: number) => {
    const p = cell;
    return `
      <rect x="${ox * p}" y="${oy * p}" width="${7 * p}" height="${7 * p}" fill="currentColor"/>
      <rect x="${(ox + 1) * p}" y="${(oy + 1) * p}" width="${5 * p}" height="${5 * p}" fill="white"/>
      <rect x="${(ox + 2) * p}" y="${(oy + 2) * p}" width="${3 * p}" height="${3 * p}" fill="currentColor"/>`;
  };
  rects += drawFinder(0, 0) + drawFinder(modules - 7, 0) + drawFinder(0, modules - 7);
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg"><rect width="${size}" height="${size}" fill="white"/>${rects}</svg>`;
}
