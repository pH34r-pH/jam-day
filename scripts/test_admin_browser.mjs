import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { runInNewContext } from "node:vm";

const source = await readFile(new URL("../site/admin/admin.js", import.meta.url), "utf8");

function element(initial = {}) {
  return {
    hidden: false,
    dataset: {},
    children: [],
    append(...items) { this.children.push(...items); },
    replaceChildren(...items) { this.children = items; },
    ...initial,
  };
}

async function renderFixture(status, body) {
  const elements = {
    "#admin-status": element({ hidden: true }),
    "#table-wrap": element(),
    "#rsvp-rows": element({ children: [element({ textContent: "Previously visible synthetic row" })] }),
    "#total": element({ textContent: "99" }),
    "#count": element({ textContent: "99 RSVPs" }),
  };
  let bodyReads = 0;
  let request;
  await runInNewContext(source, {
    document: { querySelector: selector => elements[selector], createElement: () => element() },
    fetch: async (url, options) => {
      request = { url, options };
      return { status, ok: status === 200, json: async () => { bodyReads++; return body; } };
    },
  });
  assert.equal(new URL(request.url).pathname, "/api/organizer/rsvps");
  assert.equal(request.options.credentials, "include");
  return { elements, bodyReads };
}

function assertHidden({ elements }) {
  assert.equal(elements["#table-wrap"].hidden, true);
  assert.deepEqual(elements["#rsvp-rows"].children, []);
  assert.equal(elements["#count"].textContent, "");
  assert.equal(elements["#total"].textContent, "");
  assert.equal(elements["#admin-status"].hidden, false);
}

test("organizer browser keeps attendee data hidden for 401 and 403", async () => {
  for (const status of [401, 403]) {
    const result = await renderFixture(status, { rsvps: [{ name: "Synthetic private row", headcount: 2 }] });
    assertHidden(result);
    assert.equal(result.bodyReads, 0);
  }
});

test("organizer browser validates the whole list before rendering rows and totals", async () => {
  const valid = { name: "Synthetic guest", headcount: 2, submittedAt: { toString: null } };
  const invalid = await renderFixture(200, { rsvps: [valid, { name: "Other fixture", headcount: "3" }] });
  assertHidden(invalid);
  assert.equal(invalid.elements["#admin-status"].dataset.kind, "error");

  const result = await renderFixture(200, { rsvps: [valid, { name: "Other fixture", headcount: 3 }] });
  assert.equal(result.elements["#table-wrap"].hidden, false);
  assert.equal(result.elements["#total"].textContent, "5");
  assert.equal(result.elements["#count"].textContent, "2 RSVPs");
  const [first] = result.elements["#rsvp-rows"].children;
  assert.equal(first.children[0].textContent, valid.name);
  assert.equal(first.children[2].textContent, "—");
});
