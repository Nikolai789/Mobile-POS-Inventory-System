import { colors } from '../../../shared/theme';
import { useState } from 'react';
import { getBusinessDate } from '../../../shared/utils/businessTime';
import { isCalendarDate } from '../utils/historyDate';
import DatePickerDialog, { type HistoryDatePickerProps } from './DatePickerDialog';

export default function HistoryDatePicker({ value, onApply, onCancel }: HistoryDatePickerProps) {
  const [draft, setDraft] = useState(() => value ?? getBusinessDate());
  return <DatePickerDialog onCancel={onCancel} onApply={() => onApply(draft)} applyDisabled={!isCalendarDate(draft)}>
    <input
      type="date"
      aria-label="Receipt date"
      value={draft}
      min="0001-01-01"
      max="9999-12-31"
      onInput={(event) => setDraft(event.currentTarget.value)}
      style={{ width: '100%', minWidth: 0, minHeight: 48, padding: 12, boxSizing: 'border-box', border: '1px solid #ccd5df', borderRadius: 8, font: 'inherit', color: colors.text, backgroundColor: '#fff' }}
    />
  </DatePickerDialog>;
}
