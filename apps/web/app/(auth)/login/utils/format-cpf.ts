export function formatCpf(value: string): string {
  const v = value.replace(/\D/g, "");
  if (v.length > 9) {
    return `${v.slice(0, 3)}.${v.slice(3, 6)}.${v.slice(6, 9)}-${v.slice(9)}`;
  }
  if (v.length > 6) {
    return `${v.slice(0, 3)}.${v.slice(3, 6)}.${v.slice(6)}`;
  }
  if (v.length > 3) {
    return `${v.slice(0, 3)}.${v.slice(3)}`;
  }
  return v;
}