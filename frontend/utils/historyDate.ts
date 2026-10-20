/** Native date pickers operate on device-local calendar fields, not UTC dates. */
export function calendarDateToPickerValue(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(0);
  date.setFullYear(year, month - 1, day);
  date.setHours(12, 0, 0, 0);
  return date;
}

export function pickerValueToCalendarDate(value: Date): string {
  return `${String(value.getFullYear()).padStart(4, '0')}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
}

export function isCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value.startsWith('0000')) return false;
  const date = calendarDateToPickerValue(value);
  return Number.isFinite(date.getTime()) && pickerValueToCalendarDate(date) === value;
}
