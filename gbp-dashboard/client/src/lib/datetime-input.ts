export function toDateTimeInputValue(value: string | null): string {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

export function fromDateTimeInputValue(value: string): string | null {
  if (!value) {
    return null;
  }

  return new Date(value).toISOString();
}
