const TERMINAL_GOOD = new Set(['Closed', 'Approved']);
const TERMINAL_BAD = new Set(['Rejected', 'Cancelled']);
const WAITING = new Set(['Queried', 'OnHold', 'Returned']);

export function chipClassForStatus(statusCode: string): string {
  if (TERMINAL_GOOD.has(statusCode)) return 'chip chip-success';
  if (TERMINAL_BAD.has(statusCode)) return 'chip chip-danger';
  if (WAITING.has(statusCode)) return 'chip chip-warning';
  return 'chip';
}

export function humanizeStatus(statusCode: string): string {
  return statusCode.replace(/([a-z0-9])([A-Z])/g, '$1 $2');
}

export function daysSince(dateIso: string | null): number | null {
  if (!dateIso) return null;
  const diff = Date.now() - new Date(dateIso).getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}
