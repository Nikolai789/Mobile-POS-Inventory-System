export function moneyCents(amount: number): number {
  return Math.round(Number(amount) * 100);
}

export function parseCashCents(input: string): number | null {
  if (!/^\d+(?:\.\d{1,2})?$/.test(input)) return null;
  const cents = moneyCents(Number(input));
  return Number.isSafeInteger(cents) ? cents : null;
}

export function formatMoney(amount: number): string {
  return `₱${Number(amount).toFixed(2)}`;
}

export function formatSaleDate(value: string | null | undefined, timeZone?: string): string {
  if (!value) return '';
  const date = new Date(value.includes('T') ? value : `${value.replace(' ', 'T')}Z`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString(undefined, timeZone ? { timeZone } : undefined);
}
