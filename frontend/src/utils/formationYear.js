export function getFormationYearStart() {
  const now = new Date();
  const year = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
  return new Date(year, 8, 1);
}

export function toApiDate(date) {
  return date.toISOString().split('T')[0];
}

export function monthLabel(yyyyMm) {
  const [y, m] = yyyyMm.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
}
