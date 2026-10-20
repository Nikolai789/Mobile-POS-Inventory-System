import { useState } from 'react';
import { Platform } from 'react-native';
import { DateTimePicker } from '@expo/ui/community/datetime-picker';
import { getBusinessDate } from '../../../shared/utils/businessTime';
import { calendarDateToPickerValue, pickerValueToCalendarDate } from '../utils/historyDate';
import DatePickerDialog, { type HistoryDatePickerProps } from './DatePickerDialog';

export default function HistoryDatePicker({ value, onApply, onCancel }: HistoryDatePickerProps) {
  const [draft, setDraft] = useState(() => calendarDateToPickerValue(value ?? getBusinessDate()));

  if (Platform.OS === 'android') {
    return <DateTimePicker
      value={draft}
      mode="date"
      presentation="dialog"
      positiveButton={{ label: 'Apply' }}
      negativeButton={{ label: 'Cancel' }}
      onValueChange={(_event, selectedDate) => onApply(pickerValueToCalendarDate(selectedDate))}
      onDismiss={onCancel}
    />;
  }

  return <DatePickerDialog onCancel={onCancel} onApply={() => onApply(pickerValueToCalendarDate(draft))}>
    <DateTimePicker
      value={draft}
      mode="date"
      display="spinner"
      onValueChange={(_event, selectedDate) => setDraft(selectedDate)}
      style={{ width: '100%', height: 216 }}
    />
  </DatePickerDialog>;
}
