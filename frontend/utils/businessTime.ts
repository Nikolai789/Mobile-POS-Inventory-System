export const BUSINESS_TIME_ZONE = 'Asia/Manila';
const PHILIPPINE_OFFSET_MS = 8 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

export function getBusinessDate(now = new Date()): string {
  return new Date(now.getTime() + PHILIPPINE_OFFSET_MS).toISOString().slice(0, 10);
}

export function timeUntilNextBusinessDay(now = Date.now()): number {
  const nextMidnight = (Math.floor((now + PHILIPPINE_OFFSET_MS) / DAY_MS) + 1) * DAY_MS
    - PHILIPPINE_OFFSET_MS;
  return nextMidnight - now + 250;
}

export function formatBusinessDate(value: string): string {
  return new Date(`${value}T00:00:00+08:00`).toLocaleDateString('en-PH', {
    timeZone: BUSINESS_TIME_ZONE, month: 'short', day: 'numeric', year: 'numeric',
  });
}

export function formatBusinessTimestamp(value: string): string {
  return new Date(value).toLocaleString('en-PH', {
    timeZone: BUSINESS_TIME_ZONE, month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
}
