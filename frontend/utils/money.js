export function moneyCents(amount) {
  return Math.round(Number(amount) * 100);
}

export function parseCashCents(input) {
  if (!/^\d+(?:\.\d{1,2})?$/.test(input)) return null;
  const cents = moneyCents(input);
  return Number.isSafeInteger(cents) ? cents : null;
}

export function formatMoney(amount) {
  return `₱${Number(amount).toFixed(2)}`;
}

export function formatSaleDate(value, timeZone = undefined) {
  if (!value) return '';
  const date = new Date(value.includes('T') ? value : `${value.replace(' ', 'T')}Z`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString(undefined, timeZone ? { timeZone } : undefined);
}
