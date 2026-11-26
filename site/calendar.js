export const jamDay = Object.freeze({
  uid: "jam-day-iii-2026@jamday.tyharbin.com",
  sequence: 0,
  revisedAt: "2026-09-23T00:00:00Z",
  startsAt: "2026-10-03T10:00:00-07:00",
  endsAt: "2026-10-03T19:00:00-07:00",
  timeZone: "America/Los_Angeles",
  locale: "en-US",
  title: "Jam Day III",
  details: "Third annual Jam Day. Bring jars + sugar.",
});

const encoder = new TextEncoder();

function utcStamp(value) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(Z|[+-]\d{2}:\d{2})$/.test(value)) {
    throw new RangeError("Calendar timestamps require an explicit offset.");
  }
  return new Date(value).toISOString().replace(/[-:]|\.\d{3}/g, "");
}

function calendarText(value) {
  return value.replace(/\\/g, "\\\\").replace(/\r\n|[\r\n]/g, "\\n").replace(/[;,]/g, "\\$&");
}

function foldLine(line) {
  let output = "";
  let bytes = 0;
  for (const character of line) {
    const length = encoder.encode(character).length;
    if (bytes + length > 75) {
      output += "\r\n ";
      bytes = 1;
    }
    output += character;
    bytes += length;
  }
  return output;
}

export function calendarUrls(location, event = jamDay) {
  const start = utcStamp(event.startsAt);
  const end = utcStamp(event.endsAt);
  if (end <= start || !Number.isSafeInteger(event.sequence) || event.sequence < 0) {
    throw new RangeError("Calendar requires an ordered interval and nonnegative revision.");
  }

  const google = new URL("https://calendar.google.com/calendar/render");
  google.search = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${start}/${end}`,
    details: event.details,
    location,
  }).toString();

  const lines = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Jam Day//EN", "BEGIN:VEVENT",
    `UID:${calendarText(event.uid)}`, `SEQUENCE:${event.sequence}`, `DTSTAMP:${utcStamp(event.revisedAt)}`,
    `DTSTART:${start}`, `DTEND:${end}`,
    `SUMMARY:${calendarText(event.title)}`, `LOCATION:${calendarText(location)}`,
    `DESCRIPTION:${calendarText(event.details)}`,
    "END:VEVENT", "END:VCALENDAR",
  ];
  const ics = lines.map(foldLine).join("\r\n") + "\r\n";
  return { google: google.href, ics: `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}` };
}
