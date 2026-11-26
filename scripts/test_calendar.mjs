import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { calendarUrls, jamDay } from "../site/calendar.js";

function calendarFile(dataUrl) {
  assert.match(dataUrl, /^data:text\/calendar;charset=utf-8,/);
  return decodeURIComponent(dataUrl.slice(dataUrl.indexOf(",") + 1));
}

function fields(ics) {
  return Object.fromEntries(
    ics.replace(/\r\n /g, "").split("\r\n")
      .filter(line => line.includes(":"))
      .map(line => [line.slice(0, line.indexOf(":")), line.slice(line.indexOf(":") + 1)]),
  );
}

test("the public event and both calendar links represent the same Pacific-time interval", async () => {
  const location = "Synthetic hall";
  const urls = calendarUrls(location);
  const entry = fields(calendarFile(urls.ics));
  const google = new URL(urls.google).searchParams;
  const startDay = new Intl.DateTimeFormat(jamDay.locale, {
    timeZone: jamDay.timeZone, weekday: "long", month: "long", day: "numeric",
  }).format(new Date(jamDay.startsAt));
  const html = await readFile(new URL("../site/index.html", import.meta.url), "utf8");
  assert.equal(startDay, "Saturday, October 3");
  assert.ok(html.includes(startDay));
  for (const [stamp, label] of [[jamDay.startsAt, "10 AM"], [jamDay.endsAt, "7 PM"]]) {
    assert.ok(html.includes(`<time datetime="${stamp}">${label}</time>`));
  }
  assert.equal(entry.DTSTART, "20261003T170000Z");
  assert.equal(entry.DTEND, "20261004T020000Z");
  assert.equal(google.get("dates"), `${entry.DTSTART}/${entry.DTEND}`);
  assert.equal(google.get("location"), entry.LOCATION);
  assert.ok(!html.includes(location));
});

test("calendar revisions keep UID and distinguish the repeated local DST hour", () => {
  const revision = {
    ...jamDay, sequence: 1, revisedAt: "2026-10-01T00:00:00Z",
    startsAt: "2026-11-01T01:30:00-07:00", endsAt: "2026-11-01T01:30:00-08:00",
  };
  const original = fields(calendarFile(calendarUrls("Synthetic hall").ics));
  const changed = fields(calendarFile(calendarUrls("Synthetic hall", revision).ics));
  assert.equal(changed.UID, original.UID);
  assert.equal(original.SEQUENCE, "0");
  assert.equal(changed.SEQUENCE, "1");
  assert.equal(changed.DTSTAMP, "20261001T000000Z");
  assert.equal(changed.DTSTART, "20261101T083000Z");
  assert.equal(changed.DTEND, "20261101T093000Z");
  assert.throws(() => calendarUrls("Synthetic hall", { ...revision, startsAt: "2026-11-01T01:30:00" }),
    /explicit offset/);
});

test("calendar text is escaped and folded without breaking UTF-8", () => {
  const location = "Entrée, room A; hall \\ annex\r\n" + "あ".repeat(60);
  const ics = calendarFile(calendarUrls(location).ics);
  assert.ok(ics.endsWith("\r\n"));
  for (const line of ics.split("\r\n")) {
    assert.ok(Buffer.byteLength(line) <= 75);
  }
  assert.equal(fields(ics).LOCATION, "Entrée\\, room A\\; hall \\\\ annex\\n" + "あ".repeat(60));
});

function mockBrowser() {
  const submit = { disabled: false };
  const form = {
    hidden: false, data: new Map([["name", " Fixture guest "], ["headcount", "2"]]),
    querySelector: () => submit,
    addEventListener(_name, listener) { this.submit = () => listener({ preventDefault() {} }); },
  };
  const elements = {
    "#rsvp-form": form, "#form-status": {}, "#confirmation": { hidden: true },
    "#private-location": {}, "#google-calendar": { href: "#" }, "#ics-calendar": { href: "#" },
  };
  const requests = [];
  const queued = [];
  const originals = { document: globalThis.document, FormData: globalThis.FormData, fetch: globalThis.fetch };
  globalThis.document = { querySelector: selector => elements[selector] };
  globalThis.FormData = class {
    constructor(source) { this.get = key => source.data.get(key); }
  };
  globalThis.fetch = async (_url, options) => {
    requests.push({ method: options.method, body: JSON.parse(options.body) });
    assert.ok(queued.length, "network can only use a prepared fixture response");
    return queued.shift();
  };
  return { form, submit, elements, requests, queued, restore: () => Object.assign(globalThis, originals) };
}

test("browser RSVP suppresses concurrent duplicates and reveals links only after success", async () => {
  const browser = mockBrowser();
  const { form, submit, elements, requests, queued } = browser;
  try {
    await import("../site/app.js");
    form.data.set("headcount", "0");
    await form.submit();
    assert.deepEqual(requests, []);

    form.data.set("headcount", "2");
    queued.push({ ok: false });
    await form.submit();
    assert.equal(submit.disabled, false);
    assert.equal(elements["#confirmation"].hidden, true);
    assert.equal(elements["#ics-calendar"].href, "#");

    let resolveResponse;
    queued.push(new Promise(resolve => { resolveResponse = resolve; }));
    const sending = form.submit();
    await form.submit();
    assert.equal(requests.length, 2);
    assert.deepEqual(requests[1], { method: "POST", body: { name: "Fixture guest", headcount: 2 } });
    assert.equal(elements["#private-location"].textContent, undefined);
    resolveResponse({ ok: true, json: async () => ({ ok: true, location: "Synthetic hall" }) });
    await sending;
    assert.equal(elements["#confirmation"].hidden, false);
    assert.equal(elements["#private-location"].textContent, "Synthetic hall");
    assert.equal(fields(calendarFile(elements["#ics-calendar"].href)).LOCATION, "Synthetic hall");
  } finally {
    browser.restore();
  }
});
