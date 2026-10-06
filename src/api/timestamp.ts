/**
 * The backend validates a client timestamp on every mutating call. It must be
 * the browser's `new Date().toString()` text, e.g.
 * "Mon Aug 10 2026 22:24:41 GMT+0530 (India Standard Time)", and for the `d`
 * field that string base64-encoded.
 *
 * Hermes (the app's JS engine) doesn't promise the same `toString()` output as
 * a browser, so the string is assembled by hand here to match it exactly.
 */

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const pad = (n: number) => String(n).padStart(2, '0');

function timeZoneName(date: Date) {
  try {
    return new Intl.DateTimeFormat('en-US', { timeZoneName: 'long' })
      .formatToParts(date)
      .find((part) => part.type === 'timeZoneName')?.value;
  } catch {
    return undefined;
  }
}

export function postingDate(date = new Date()) {
  const offset = -date.getTimezoneOffset();
  const sign = offset >= 0 ? '+' : '-';
  const abs = Math.abs(offset);
  const gmt = `GMT${sign}${pad(Math.floor(abs / 60))}${pad(abs % 60)}`;
  const zone = timeZoneName(date);

  return (
    `${DAYS[date.getDay()]} ${MONTHS[date.getMonth()]} ${pad(date.getDate())} ${date.getFullYear()} ` +
    `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())} ${gmt}` +
    (zone ? ` (${zone})` : '')
  );
}

/** Base64 of the posting date — the `d` / `date` field on cart, address and order calls. */
export function encodedTimestamp() {
  return btoa(postingDate());
}
