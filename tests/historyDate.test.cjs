const { test } = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { calendarDateToPickerValue, pickerValueToCalendarDate, isCalendarDate } = require('../src/features/history/utils/historyDate.ts');
const { getBusinessDate } = require('../src/shared/utils/businessTime.ts');

test('calendar dates survive native picker conversions, including leap days and early years', () => {
  for (const value of ['2026-01-01', '2026-12-31', '2028-02-29', '0001-01-01', '0099-12-31']) {
    const date = calendarDateToPickerValue(value);
    assert.equal(pickerValueToCalendarDate(date), value);
    assert.equal(date.getHours(), 12);
    assert.equal(isCalendarDate(value), true);
  }
  for (const value of ['', '2026-02-29', '2028-02-30', '2026-04-31', '2026-13-01', '0000-01-01', '2026-1-01']) {
    assert.equal(isCalendarDate(value), false, value);
  }
});

test('calendar selections and the initial Philippine date are independent of the device timezone', () => {
  const helperPath = require.resolve('../src/features/history/utils/historyDate.ts');
  const businessTimePath = require.resolve('../src/shared/utils/businessTime.ts');
  const script = `
    const assert = require('node:assert/strict');
    const { calendarDateToPickerValue, pickerValueToCalendarDate } = require(process.argv[1]);
    const { getBusinessDate } = require(process.argv[2]);
    for (const value of ['2026-01-01', '2026-03-08', '2026-11-01', '2028-02-29']) {
      assert.equal(pickerValueToCalendarDate(calendarDateToPickerValue(value)), value);
    }
    assert.equal(getBusinessDate(new Date('2026-10-19T16:00:00Z')), '2026-10-20');
  `;
  for (const timeZone of ['America/Los_Angeles', 'Pacific/Kiritimati', 'Asia/Manila']) {
    execFileSync(process.execPath, ['--experimental-strip-types', '-e', script, helperPath, businessTimePath], {
      env: { ...process.env, TZ: timeZone }, stdio: 'pipe',
    });
  }
});

test('today changes at Philippine midnight', () => {
  assert.equal(getBusinessDate(new Date('2026-12-31T15:59:59Z')), '2026-12-31');
  assert.equal(getBusinessDate(new Date('2026-12-31T16:00:00Z')), '2027-01-01');
});
