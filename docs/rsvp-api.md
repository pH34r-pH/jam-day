# RSVP API contract

## Purpose

RSVP is deliberately approximate planning data: who is coming and roughly how many people to expect. It is not an attendee account or registration-management system.

## Source and ownership

The public form lives in [`../site/index.html`](../site/index.html), and its
request behavior lives in [`../site/app.js`](../site/app.js). The production
handler, persistence, private location, and host view belong to Fleet; this
repository documents their boundary but does not implement those resources.

## `POST /api/rsvp`

Request:

```json
{"name":"Ada","headcount":2}
```

Rules:

- `name`: trimmed, non-empty string, maximum 120 characters.
- `headcount`: integer from 1 through 30.
- Ignore/reject additional attendee fields; the client sends only these two values.

Persistence needs only `name` and `headcount`. A server-generated record ID and submission timestamp are useful operational metadata but are not part of the attendee-facing contract.

Success:

```json
{
  "ok": true,
  "location": "<private production event location>"
}
```

The public source and static artifact must never contain the production value of `location`. Fleet supplies it from private production configuration only after a successful RSVP.

## Duplicate submissions

Keep this intentionally lightweight. Disable repeat submission in the browser while a request is in flight, and let production apply a short bounded duplicate/double-submit guard if useful. There is no attendee identity, durable idempotency token, edit flow, cancellation flow, or RSVP-management API.

## Host view

The operational requirement is a private list of names/headcounts and a summed total headcount. This view belongs to Fleet/production, not the public site.

## Calendar exports

[The calendar helper](../site/calendar.js) fixes the public event identity
and schedule. Jam Day III runs from 10 AM to about 7 PM on October 3, 2026
in `America/Los_Angeles`, with `en-US` labels. Google Calendar and the
downloadable iCalendar file use the same UTC instants. The public page's
machine-readable times carry the Pacific offset for that date.

Keep the event UID stable when revising that event. Advance the sequence
and revision timestamp for a changed schedule. Use explicit offsets in the
source, including across daylight-saving transitions. The download uses
escaped text, CRLF line endings, and UTF-8 line folding.
[RFC 5545](https://www.rfc-editor.org/rfc/rfc5545.html)

Calendar links become available after a successful RSVP. The download is
generated in the browser. Clicking the Google Calendar link passes the
confirmed location to Google as part of the template. Local fixtures use
synthetic responses and exercise retries and concurrent submissions.

## Errors

Use generic 4xx responses for invalid input/rate limits and 5xx for unavailable persistence. Do not return storage names, connection details, private configuration, or other RSVP records.
