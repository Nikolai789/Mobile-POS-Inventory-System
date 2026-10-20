const BUSINESS_TIME_ZONE = 'Asia/Manila';
const DAY_MS = 24 * 60 * 60 * 1000;
const PHILIPPINE_UTC_OFFSET_MS = 8 * 60 * 60 * 1000;

function toSqlTimestamp(milliseconds) {
  return new Date(milliseconds).toISOString().slice(0, 19).replace('T', ' ');
}

function businessDate(milliseconds) {
  return new Date(milliseconds + PHILIPPINE_UTC_OFFSET_MS).toISOString().slice(0, 10);
}

function businessMidnight(date) {
  return Date.parse(`${date}T00:00:00+08:00`);
}

function businessDayWindow(now = new Date()) {
  const date = businessDate(now.getTime());
  const start = businessMidnight(date);
  return { date, start: toSqlTimestamp(start), end: toSqlTimestamp(start + DAY_MS) };
}

module.exports = {
  BUSINESS_TIME_ZONE, DAY_MS, PHILIPPINE_UTC_OFFSET_MS,
  businessDate, businessDayWindow, businessMidnight, toSqlTimestamp,
};
