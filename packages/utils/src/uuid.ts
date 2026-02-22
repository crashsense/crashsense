export function generateId(): string {
  const hex = '0123456789abcdef';
  const segments = [8, 4, 4, 4, 12];
  const parts: string[] = [];

  for (const len of segments) {
    let segment = '';
    for (let i = 0; i < len; i++) {
      segment += hex[Math.floor(Math.random() * 16)];
    }
    parts.push(segment);
  }

  // Set version (4) and variant bits
  const p2 = '4' + parts[2].slice(1);
  const variantChar = hex[8 + Math.floor(Math.random() * 4)];
  const p3 = variantChar + parts[3].slice(1);

  return `${parts[0]}-${parts[1]}-${p2}-${p3}-${parts[4]}`;
}
