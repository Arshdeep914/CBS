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

export function formatDate(iso: string) {
  const date = new Date(iso);
  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

export function formatShortDate(iso: string) {
  const date = new Date(iso);
  return `${date.getDate()} ${MONTHS[date.getMonth()]}`;
}

export function formatTime(iso: string) {
  const date = new Date(iso);
  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours % 12 || 12}:${minutes} ${hours < 12 ? 'AM' : 'PM'}`;
}

export function formatDateTime(iso: string) {
  return `${formatShortDate(iso)}, ${formatTime(iso)}`;
}

export function plural(count: number, singular: string, pluralForm = `${singular}s`) {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

export function formatCount(value: number) {
  return value >= 1000 ? `${trim(value / 1000)}k` : value.toString();
}
