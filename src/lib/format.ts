/** Formats rupees with Indian digit grouping: 124500 → ₹1,24,500. */
export function formatINR(value: number) {
  const rounded = Math.round(value);
  const digits = Math.abs(rounded).toString();
  const lastThree = digits.slice(-3);
  const rest = digits.slice(0, -3);
  const grouped = rest ? `${rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',')},${lastThree}` : lastThree;
  return `${rounded < 0 ? '−' : ''}₹${grouped}`;
}

/** Short form for big amounts: 500000 → ₹5 L, 1250000 → ₹12.5 L. */
export function formatCompactINR(value: number) {
  if (value >= 1_00_00_000) return `₹${trim(value / 1_00_00_000)} Cr`;
  if (value >= 1_00_000) return `₹${trim(value / 1_00_000)} L`;
  if (value >= 1_000) return `₹${trim(value / 1_000)}k`;
  return formatINR(value);
}

function trim(value: number) {
  return Number(value.toFixed(1)).toString();
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Reads the dates the backend sends. Besides ISO strings it uses
 * "06 Oct 2026 04:47 PM" (orders), which Hermes — the app's JS engine — can't
 * parse with `new Date()`. Returns null for anything unreadable.
 */
export function parseApiDate(value: string | null | undefined): Date | null {
  const text = (value ?? '').trim();
  if (!text) return null;

  const match = /^(\d{1,2})[\s-]+([A-Za-z]{3})[A-Za-z]*[\s-]+(\d{4})(?:[\s,T]+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*([AaPp][Mm])?)?$/.exec(text);
  if (match) {
    const [, day, mon, year, hh = '0', mm = '0', ss = '0', meridiem] = match;
    const month = MONTHS.findIndex((m) => m.toLowerCase() === mon.toLowerCase());
    if (month < 0) return null;
    let hours = Number(hh) % 24;
    if (meridiem) hours = (hours % 12) + (meridiem.toLowerCase() === 'pm' ? 12 : 0);
    const date = new Date(Number(year), month, Number(day), hours, Number(mm), Number(ss));
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** 6 Oct 2026 — or '' when the date can't be read. */
export function formatDate(value: string) {
  const date = parseApiDate(value);
  return date ? `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}` : '';
}

export function formatShortDate(value: string) {
  const date = parseApiDate(value);
  return date ? `${date.getDate()} ${MONTHS[date.getMonth()]}` : '';
}

export function formatTime(value: string) {
  const date = parseApiDate(value);
  if (!date) return '';
  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours % 12 || 12}:${minutes} ${hours < 12 ? 'AM' : 'PM'}`;
}

export function formatDateTime(value: string) {
  const day = formatShortDate(value);
  const time = formatTime(value);
  return day && time ? `${day}, ${time}` : day;
}

export function plural(count: number, singular: string, pluralForm = `${singular}s`) {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

export function formatCount(value: number) {
  return value >= 1000 ? `${trim(value / 1000)}k` : value.toString();
}
