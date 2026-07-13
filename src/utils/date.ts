const formatOption: Intl.DateTimeFormatOptions = {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
};

export const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat('en-GB', formatOption).format(new Date(value));

export const formatDateOnlyFromDate = (value: Date) =>
  new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(value);

export const formatTimeOnlyFromDate = (value: Date) =>
  new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(value);

export const formatDateOnly = (value: string) => formatDateOnlyFromDate(new Date(value));

export const formatTimeOnly = (value: string) => formatTimeOnlyFromDate(new Date(value));

export const getDueWarning = (dueDate: string) => {
  const diffMs = new Date(dueDate).getTime() - Date.now();
  return diffMs < 30 * 60 * 1000
    ? 'Deadline is less than 30 minutes away. A fallback notification will be scheduled.'
    : null;
};
